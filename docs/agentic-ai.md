# Agentic AI Implementation

This project now includes an agentic RAG workflow built with the OpenAI Agents SDK for TypeScript. The goal is not to replace the existing deterministic RAG endpoint, but to give you a concrete learning path for agents, tools, traces, and future multi-agent orchestration.

Official references used for this implementation:

- OpenAI Agents SDK quickstart: https://developers.openai.com/api/docs/guides/agents/quickstart
- OpenAI tools guide: https://developers.openai.com/api/docs/guides/tools
- SDK and Agents SDK overview: https://developers.openai.com/api/docs/libraries#use-the-agents-sdk

## What Changed

The existing `/api/chat` endpoint still performs a direct RAG flow:

1. Embed the question.
2. Search pgvector chunks.
3. Build a grounded prompt.
4. Call the OpenAI Responses API.
5. Return answer, citations, and retrieved chunks.

The new `/api/chat/agent` endpoint performs an agentic workflow:

1. Create a `Compliance RAG Agent`.
2. Give it a typed function tool named `compliance_document_search`.
3. Force the first model turn to use that tool.
4. Let the agent synthesize the final answer from tool output.
5. Return the answer, citations, retrieved chunks, and visible `agentSteps`.

This is agentic because the model runs inside an agent loop with tools. The model receives a tool catalog, decides the tool arguments, observes the tool result, and then produces a final answer.

## Files Added Or Updated

- `apps/api/src/services/agents/complianceAgentService.ts`
  - Defines the OpenAI `Agent`.
  - Defines the `compliance_document_search` tool with a Zod input schema.
  - Runs the agent with `run(...)`.
  - Captures tool calls as `agentSteps`.
  - Saves query metadata in the existing `rag_queries` table.

- `apps/api/src/controllers/agentChatController.ts`
  - Validates the request with the shared contract.
  - Calls `ComplianceAgentService`.

- `apps/api/src/routes/index.ts`
  - Registers `POST /api/chat/agent`.

- `packages/contracts/src/index.ts`
  - Adds `AgentStepSchema`.
  - Adds `AgentChatRequestSchema`.
  - Adds `AgentChatResponseSchema`.

- `apps/web/src/api/client.ts`
  - Adds `askAgent(...)`.

- `apps/web/src/hooks/useCopilotWorkspace.ts`
  - Adds the agent mutation and state.

- `apps/web/src/features/copilot/QueryToolbar.tsx`
  - Adds the Agent button.

- `apps/web/src/features/results/ResultsPanel.tsx`
  - Shows agent steps when the response includes them.

## The Agent Tool

The tool is intentionally read-only:

```ts
compliance_document_search({
  query: string,
  topK: number,
});
```

The handler calls the existing `VectorSearchService`, builds citations with the existing prompt helper, and returns compact context to the agent. This keeps the trusted application runtime in control of database access, filters, and citation formatting.

## Why Force Tool Use

The agent is configured with:

```ts
modelSettings: {
  toolChoice: "required",
  parallelToolCalls: false
}
```

For learning, this makes behavior easier to inspect: every agent call should include at least one search tool call before a final answer. Later, you can relax `toolChoice` to `"auto"` and evaluate when the model chooses to search.

## How To Try It

Start the stack, upload and index at least one PDF, then use the new Agent button in the UI.

You can also call the API directly:

```bash
curl -X POST http://localhost:4000/api/chat/agent \
  -H "Content-Type: application/json" \
  -d '{"question":"What compliance obligations are described?","topK":6,"temperature":0.1}'
```

The response shape is:

```ts
{
  answer: string;
  citations: CitationDto[];
  retrievedChunks: ChunkDto[];
  agentSteps: Array<{
    type: "tool_call" | "handoff" | "final_answer";
    name: string;
    input?: Record<string, unknown>;
    summary: string;
    citationCount?: number;
  }>;
}
```

## What To Inspect

Use the UI `Agent Steps` section to see the local trace returned by the app. Use the OpenAI Traces dashboard for the full SDK trace, including model calls and tool calls:

https://platform.openai.com/traces

The local trace is deliberately small and user-facing. The OpenAI trace is better for debugging prompts, tool arguments, model turns, and latency.

## Practice Roadmap

1. Tool tuning
   - Add a `documentIds` filter control in the UI.
   - Pass filters through the agent endpoint.
   - Compare direct RAG vs agent RAG retrieval.

2. Agent autonomy
   - Change `toolChoice` from `"required"` to `"auto"`.
   - Add eval cases that fail if the agent answers without citations.

3. Specialist agents
   - Add a policy summarizer agent.
   - Add a risk checklist agent.
   - Use `agent.asTool(...)` when the main agent should stay in control.
   - Use handoffs when a specialist should take over the conversation.

4. Guardrails
   - Add an output guardrail that rejects uncited legal claims.
   - Add a tool output guardrail that limits context size.

5. Streaming
   - Replace `run(...)` with streaming agent execution.
   - Stream model tokens and tool events into the React app.

6. Evaluation
   - Extend `EvaluationService` with agent-specific cases.
   - Track whether `agentSteps` include a search tool call.
   - Compare answer quality and citation quality across `/chat` and `/chat/agent`.

## Design Boundaries

- The agent has no write tools.
- The agent does not access the database directly.
- The agent cannot upload, delete, or modify documents.
- The application controls retrieval, filters, and persistence.
- Citations still come from trusted chunk metadata, not from generated text.

Those boundaries are important in compliance workflows because the model can reason over retrieved data without becoming the owner of storage, permissions, or audit records.
