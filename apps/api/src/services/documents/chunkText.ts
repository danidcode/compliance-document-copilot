import type { ExtractedPage } from "./pdfTextExtractor.js";

export type TextChunk = {
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  content: string;
  tokenEstimate: number;
  metadata: Record<string, unknown>;
};

export type ChunkTextOptions = {
  maxChars?: number;
  overlapChars?: number;
};

export function chunkPages(pages: ExtractedPage[], options: ChunkTextOptions = {}): TextChunk[] {
  const maxChars = options.maxChars ?? 1_800;
  const overlapChars = options.overlapChars ?? 250;
  const chunks: TextChunk[] = [];

  for (const page of pages) {
    const blocks = splitPageIntoBlocks(page.text, maxChars);
    let previousTail = "";

    for (const block of blocks) {
      const content = [previousTail, block].filter(Boolean).join("\n\n").trim();
      if (!content) {
        continue;
      }

      chunks.push({
        chunkIndex: chunks.length,
        pageStart: page.pageNumber,
        pageEnd: page.pageNumber,
        content,
        tokenEstimate: estimateTokens(content),
        metadata: {
          pageNumbers: [page.pageNumber],
          chunking: {
            strategy: "page-aware-character-window",
            maxChars,
            overlapChars
          }
        }
      });

      previousTail = block.slice(Math.max(0, block.length - overlapChars));
    }
  }

  return chunks;
}

function splitPageIntoBlocks(text: string, maxChars: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const blocks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length <= maxChars) {
      current = (current + " " + sentence).trim();
      continue;
    }

    if (current) {
      blocks.push(current);
      current = "";
    }

    if (sentence.length <= maxChars) {
      current = sentence;
      continue;
    }

    for (let start = 0; start < sentence.length; start += maxChars) {
      blocks.push(sentence.slice(start, start + maxChars));
    }
  }

  if (current) {
    blocks.push(current);
  }

  return blocks;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
