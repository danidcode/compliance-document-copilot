import type { DocumentDto, DocumentStatus } from "@cdc/contracts";
import type { DbPool } from "../db/pool.js";

type DocumentRow = {
  id: string;
  name: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  page_count: number;
  status: DocumentStatus;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type CreateDocumentInput = {
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  metadata?: Record<string, unknown>;
};

export class DocumentRepository {
  constructor(private readonly db: DbPool) {}

  async create(input: CreateDocumentInput): Promise<DocumentDto> {
    const result = await this.db.query<DocumentRow>(
      `
        INSERT INTO documents (name, original_name, mime_type, size_bytes, storage_path, status, metadata)
        VALUES ($1, $2, $3, $4, $5, 'uploaded', $6)
        RETURNING *
      `,
      [
        input.name,
        input.originalName,
        input.mimeType,
        input.sizeBytes,
        input.storagePath,
        JSON.stringify(input.metadata ?? {})
      ]
    );

    return toDto(requiredRow(result.rows[0]));
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
    options: { pageCount?: number; errorMessage?: string } = {}
  ): Promise<DocumentDto> {
    const result = await this.db.query<DocumentRow>(
      `
        UPDATE documents
        SET status = $2,
            page_count = COALESCE($3, page_count),
            error_message = $4,
            updated_at = now()
        WHERE id = $1
        RETURNING *
      `,
      [id, status, options.pageCount ?? null, options.errorMessage ?? null]
    );

    return toDto(requiredRow(result.rows[0]));
  }

  async list(): Promise<DocumentDto[]> {
    const result = await this.db.query<DocumentRow>(
      "SELECT * FROM documents ORDER BY created_at DESC LIMIT 100"
    );
    return result.rows.map(toDto);
  }

  async findById(id: string): Promise<DocumentDto | null> {
    const result = await this.db.query<DocumentRow>("SELECT * FROM documents WHERE id = $1", [id]);
    const row = result.rows[0];
    return row ? toDto(row) : null;
  }
}

function toDto(row: DocumentRow): DocumentDto {
  return {
    id: row.id,
    name: row.name,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    pageCount: row.page_count,
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function requiredRow<T>(row: T | undefined): T {
  if (!row) {
    throw new Error("Expected database row");
  }
  return row;
}
