import { Agent, Runner, tool } from "@openai/agents";
import type {
  AgentChatRequest,
  AgentChatResponse,
  AgentStepDto,
  ChunkDto,
} from "@cdc/contracts";
import { z } from "zod";
import { env } from "../../config/env.js";
import type { QueryRepository } from "../../repositories/queryRepository.js";
import { mapOpenAiError } from "../ai/openAiErrorMapper.js";
import { ensureOpenAiKey } from "../ai/openAiService.js";
import { buildCitations, buildRagContext } from "../rag/promptBuilder.js";
import type { VectorSearchService } from "../vector/vectorSearchService.js";

type SearchToolResult = {
  query: string;
  context: string;
  citations: ReturnType<typeof buildCitations>;
};

const SearchToolInputSchema = z.object({
  query: z.string().min(2).max(4000),
  topK: z.number().int().min(1).max(20),
});

export class ComplianceAgentService {
  constructor(
    private readonly vectorSearch: VectorSearchService,
    private readonly queries: QueryRepository,
  ) {}

  async answer(request: AgentChatRequest): Promise<AgentChatResponse> {
    ensureOpenAiKey();

    const agentSteps: AgentStepDto[] = [];
    const retrievedChunks = new Map<string, ChunkDto>();
    let latestToolResult: SearchToolResult | undefined;

    const complianceSearchTool = tool({
      name: "compliance_document_search",
      description:
        "Search indexed compliance PDF chunks and return cited context for answering the user's question.",
      parameters: SearchToolInputSchema,
      execute: async (input) => {
        const search = await this.vectorSearch.search({
          question: input.query,
          topK: input.topK,
          ...(request.filters ? { filters: request.filters } : {}),
        });
        const citations = buildCitations(search.matches);

        for (const chunk of search.matches) {
          retrievedChunks.set(chunk.id, chunk);
        }

        latestToolResult = {
          query: input.query,
          context: buildRagContext(search.matches),
          citations,
        };

        agentSteps.push({
          type: "tool_call",
          name: "compliance_document_search",
          input,
          summary: `Retrieved ${search.matches.length} chunks for "${input.query}".`,
          citationCount: citations.length,
        });

        return latestToolResult;
      },
    });

    const agent = new Agent({
      name: "Compliance RAG Agent",
      instructions: [
        "You are Compliance Document Copilot, an agentic RAG assistant for indexed compliance PDFs.",
        "Always call compliance_document_search before answering.",
        "Answer only from retrieved context. If context is insufficient, say what is missing.",
        "Use concise compliance language and mention source document names and page numbers when relevant.",
        "Do not invent obligations, deadlines, thresholds, or legal interpretations that are not in the retrieved context.",
      ].join("\n"),
      model: env.OPENAI_CHAT_MODEL,
      modelSettings: {
        temperature: request.temperature,
        toolChoice: "required",
        parallelToolCalls: false,
      },
      tools: [complianceSearchTool],
    });

    const runner = new Runner({
      workflowName: "Compliance Agentic RAG",
      traceMetadata: {
        feature: "agentic_compliance_rag",
      },
    });

    const result = await runner
      .run(
        agent,
        [
          `User question: ${request.question}`,
          `Requested topK: ${request.topK}`,
          "First search for the most relevant compliance context, then synthesize the final answer.",
        ].join("\n"),
        {
          maxTurns: 4,
        },
      )
      .catch(mapOpenAiError);

    const answer = String(result.finalOutput ?? "").trim();
    const citations = latestToolResult?.citations ?? [];
    const chunks = Array.from(retrievedChunks.values());

    agentSteps.push({
      type: "final_answer",
      name: result.lastAgent?.name ?? "Compliance RAG Agent",
      summary: answer
        ? "Synthesized the final grounded answer."
        : "No final answer was produced.",
      citationCount: citations.length,
    });

    await this.queries.save({
      question: request.question,
      answer,
      model: env.OPENAI_CHAT_MODEL,
      filters: request.filters,
      retrievedChunkIds: citations.map((citation) => citation.chunkId),
    });

    return {
      answer,
      citations,
      retrievedChunks: chunks,
      agentSteps,
    };
  }
}
