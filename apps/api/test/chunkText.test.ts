import { describe, expect, it } from "vitest";
import { chunkPages } from "../src/services/documents/chunkText.js";

describe("chunkPages", () => {
  it("preserves page references for generated chunks", () => {
    const chunks = chunkPages(
      [
        {
          pageNumber: 3,
          text: "Training must be completed annually. Evidence is retained by compliance."
        }
      ],
      { maxChars: 40, overlapChars: 8 }
    );

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every((chunk) => chunk.pageStart === 3 && chunk.pageEnd === 3)).toBe(true);
    expect(chunks[0]?.metadata).toMatchObject({ pageNumbers: [3] });
  });
});
