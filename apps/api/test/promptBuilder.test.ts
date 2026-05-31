import { describe, expect, it } from "vitest";
import { buildCitations, buildRagContext } from "../src/services/rag/promptBuilder.js";

const chunk = {
  id: "00000000-0000-0000-0000-000000000001",
  documentId: "00000000-0000-0000-0000-000000000002",
  documentName: "Policy",
  pageStart: 2,
  pageEnd: 2,
  content: "Incidents must be reported within 24 hours.",
  metadata: {},
  similarity: 0.91
};

describe("promptBuilder", () => {
  it("includes source metadata in the RAG context", () => {
    expect(buildRagContext([chunk])).toContain("Policy, page 2");
    expect(buildRagContext([chunk])).toContain(chunk.id);
  });

  it("builds citations from chunks", () => {
    expect(buildCitations([chunk])).toEqual([
      {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        documentName: "Policy",
        pageStart: 2,
        pageEnd: 2,
        similarity: 0.91
      }
    ]);
  });
});
