import type { ChunkDto, CitationDto } from "@cdc/contracts";

export function buildRagContext(chunks: ChunkDto[]): string {
  return chunks
    .map((chunk, index) => {
      const source = `Source ${index + 1}: ${chunk.documentName}, page ${formatPages(chunk.pageStart, chunk.pageEnd)}, chunk ${chunk.id}`;
      return `${source}\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

export function buildCitations(chunks: ChunkDto[]): CitationDto[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    similarity: chunk.similarity
  }));
}

function formatPages(pageStart: number, pageEnd: number): string {
  return pageStart === pageEnd ? String(pageStart) : `${pageStart}-${pageEnd}`;
}
