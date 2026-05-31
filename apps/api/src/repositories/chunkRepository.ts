import type { ChunkDto } from "@cdc/contracts";
import type { DbPool } from "../db/pool.js";
import { toPgVector } from "../utils/vector.js";

export type CreateChunkInput = {
  documentId: string;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  content: string;
  tokenEstimate: number;
  metadata?: Record<string, unknown>;
  embedding: number[];
};

type ChunkRow = {
  id: string;
  document_id: string;
  document_name: string;
  page_start: number;
  page_end: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity?: number;
};

export type ChunkSearchFilters = {
  documentIds?: string[] | undefined;
  metadata?: Record<string, unknown> | undefined;
};

export class ChunkRepository {
  constructor(private readonly db: DbPool) {}

  async createMany(chunks: CreateChunkInput[]): Promise<number> {
    if (chunks.length === 0) {
      return 0;
    }

    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      for (const chunk of chunks) {
        await client.query(
          `
            INSERT INTO document_chunks (
              document_id, chunk_index, page_start, page_end, content, token_estimate, metadata, embedding
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)
          `,
          [
            chunk.documentId,
            chunk.chunkIndex,
            chunk.pageStart,
            chunk.pageEnd,
            chunk.content,
            chunk.tokenEstimate,
            JSON.stringify(chunk.metadata ?? {}),
            toPgVector(chunk.embedding)
          ]
        );
      }
      await client.query("COMMIT");
      return chunks.length;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async searchByEmbedding(
    embedding: number[],
    topK: number,
    filters: ChunkSearchFilters = {}
  ): Promise<ChunkDto[]> {
    const params: unknown[] = [toPgVector(embedding), topK];
    const where: string[] = ["dc.embedding IS NOT NULL"];

    if (filters.documentIds?.length) {
      params.push(filters.documentIds);
      where.push(`dc.document_id = ANY($${params.length}::uuid[])`);
    }

    if (filters.metadata && Object.keys(filters.metadata).length > 0) {
      params.push(JSON.stringify(filters.metadata));
      where.push(`dc.metadata @> $${params.length}::jsonb`);
    }

    const result = await this.db.query<ChunkRow>(
      `
        SELECT
          dc.id,
          dc.document_id,
          d.name AS document_name,
          dc.page_start,
          dc.page_end,
          dc.content,
          dc.metadata,
          1 - (dc.embedding <=> $1::vector) AS similarity
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE ${where.join(" AND ")}
        ORDER BY dc.embedding <=> $1::vector
        LIMIT $2
      `,
      params
    );

    return result.rows.map(toDto);
  }
}

function toDto(row: ChunkRow): ChunkDto {
  return {
    id: row.id,
    documentId: row.document_id,
    documentName: row.document_name,
    pageStart: row.page_start,
    pageEnd: row.page_end,
    content: row.content,
    metadata: row.metadata,
    similarity: row.similarity
  };
}
