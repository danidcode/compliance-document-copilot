import type { DbPool } from "../db/pool.js";

export type SaveQueryInput = {
  question: string;
  answer?: string;
  model?: string;
  filters?: Record<string, unknown> | undefined;
  retrievedChunkIds?: string[];
};

export class QueryRepository {
  constructor(private readonly db: DbPool) {}

  async save(input: SaveQueryInput): Promise<void> {
    await this.db.query(
      `
        INSERT INTO rag_queries (question, answer, model, filters, retrieved_chunk_ids)
        VALUES ($1, $2, $3, $4, $5::uuid[])
      `,
      [
        input.question,
        input.answer ?? null,
        input.model ?? null,
        JSON.stringify(input.filters ?? {}),
        input.retrievedChunkIds ?? [],
      ],
    );
  }
}
