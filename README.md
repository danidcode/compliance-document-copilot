# Compliance Document Copilot

Compliance Document Copilot is a production-style AI Engineering learning project for PDF upload, page-aware indexing, vector search with PostgreSQL + pgvector, and grounded RAG answers with citations.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, TypeScript, Express
- Database: PostgreSQL 16 with pgvector
- Jobs: BullMQ with Redis
- AI: OpenAI embeddings, Responses API, and Agents SDK
- Package manager: pnpm
- Runtime: Docker Compose

## Quick Start

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Set `OPENAI_API_KEY` in `.env`.

3. Start the full stack:

```bash
docker compose up --build
```

4. Open the app:

```text
http://localhost:5173
```

The API is available at `http://localhost:4000/api`.

## Useful Commands

```bash
docker compose up --build
docker compose exec api pnpm --filter @cdc/api db:migrate
docker compose exec api pnpm --filter @cdc/api db:seed
docker compose exec api pnpm --filter @cdc/api test
docker compose logs -f api worker
```

PostgreSQL runs the first migration automatically on fresh volumes because `apps/api/migrations` is mounted into `/docker-entrypoint-initdb.d`. The explicit migration command is useful after adding later migrations. Redis backs the BullMQ indexing queue, and the separate `worker` service consumes document indexing jobs.

## Incremental Phases

### Phase 1: Upload + Indexing

- `POST /api/documents` accepts a PDF multipart upload and enqueues an indexing job.
- Metadata is stored in `documents`.
- The API returns immediately while the BullMQ worker service processes the document.
- The worker uses `pdfjs-dist` to extract text page by page.
- `chunkPages` creates page-aware chunks.
- OpenAI embeddings are generated for each chunk.
- Chunks and vectors are stored in `document_chunks`.

### Phase 2: Vector Search

- `POST /api/search` embeds the user question.
- pgvector cosine search retrieves the most relevant chunks.
- Optional `documentIds` and `metadata` filters are already represented in the API contract.

### Phase 3: Full RAG Chat

- `POST /api/chat` runs vector search.
- Retrieved chunks are formatted into a grounded prompt.
- OpenAI Responses API returns the answer.
- Query metadata is stored in `rag_queries`.

### Phase 4: Citations + Evaluation

- Every chat response includes citation objects with chunk id, document id, document name, page range, and similarity.
- `POST /api/evaluations/run` runs a small smoke evaluation that checks answer grounding and citation presence.

### Phase 5: Agentic RAG

- `POST /api/chat/agent` runs an OpenAI Agents SDK workflow.
- The compliance agent has a typed `compliance_document_search` tool backed by the existing pgvector search service.
- The response includes normal answer fields plus `agentSteps` so you can inspect tool calls and final synthesis.
- See `docs/agentic-ai.md` for the implementation walkthrough and practice roadmap.

## Architectural Decisions

The backend is organized around clean boundaries:

- Controllers adapt HTTP requests and responses only.
- Repositories own SQL and data mapping.
- AI services isolate OpenAI API calls.
- Document services own PDF extraction and chunking.
- Vector and RAG services orchestrate use cases.

This keeps the system easy to extend with metadata filters, reranking, streaming answers, tool calling, agent workflows, and offline evaluation without rewriting upload or storage logic.

## Database Design

`documents` stores upload metadata and lifecycle status. `document_chunks` stores page-aware text chunks, metadata, token estimates, and `vector(1536)` embeddings for `text-embedding-3-small`. JSONB metadata columns and GIN indexes are included now so future filtering can be added without a migration-heavy redesign.

## API Examples

Upload:

```bash
curl -F "file=@example.pdf" http://localhost:4000/api/documents
```

Search:

```bash
curl -X POST http://localhost:4000/api/search \
  -H "Content-Type: application/json" \
  -d '{"question":"What are the incident reporting obligations?","topK":5}'
```

Chat:

```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"When must data incidents be reported?","topK":5,"temperature":0.1}'
```

Agentic chat:

```bash
curl -X POST http://localhost:4000/api/chat/agent \
  -H "Content-Type: application/json" \
  -d '{"question":"When must data incidents be reported?","topK":5,"temperature":0.1}'
```
