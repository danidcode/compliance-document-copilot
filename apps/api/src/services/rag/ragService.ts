import type { ChatRequest, ChatResponse } from "@cdc/contracts";
import { env } from "../../config/env.js";
import type { QueryRepository } from "../../repositories/queryRepository.js";
import type { OpenAiService } from "../ai/openAiService.js";
import type { VectorSearchService } from "../vector/vectorSearchService.js";
import { buildCitations, buildRagContext } from "./promptBuilder.js";

export class RagService {
  constructor(
    private readonly vectorSearch: VectorSearchService,
    private readonly ai: OpenAiService,
    private readonly queries: QueryRepository
  ) {}

  async answer(request: ChatRequest): Promise<ChatResponse> {
    const search = await this.vectorSearch.search(request);
    const context = buildRagContext(search.matches);
    const answer = await this.ai.generateGroundedAnswer({
      question: request.question,
      context,
      temperature: request.temperature
    });
    const citations = buildCitations(search.matches);

    await this.queries.save({
      question: request.question,
      answer,
      model: env.OPENAI_CHAT_MODEL,
      filters: request.filters,
      retrievedChunkIds: citations.map((citation) => citation.chunkId)
    });

    return {
      answer,
      citations,
      retrievedChunks: search.matches
    };
  }
}
