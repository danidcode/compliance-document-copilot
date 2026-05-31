import { z } from "zod";

export const DocumentStatusSchema = z.enum(["uploaded", "processing", "indexed", "failed"]);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  pageCount: z.number().int().nonnegative(),
  status: DocumentStatusSchema,
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type DocumentDto = z.infer<typeof DocumentSchema>;

export const ChunkSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  documentName: z.string(),
  pageStart: z.number().int().positive(),
  pageEnd: z.number().int().positive(),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  similarity: z.number().optional()
});
export type ChunkDto = z.infer<typeof ChunkSchema>;

export const UploadDocumentResponseSchema = z.object({
  document: DocumentSchema,
  chunksIndexed: z.number().int().nonnegative()
});
export type UploadDocumentResponse = z.infer<typeof UploadDocumentResponseSchema>;

export const DocumentsResponseSchema = z.object({
  documents: z.array(DocumentSchema)
});
export type DocumentsResponse = z.infer<typeof DocumentsResponseSchema>;

export const SearchRequestSchema = z.object({
  question: z.string().min(2).max(4000),
  topK: z.number().int().min(1).max(20).default(6),
  filters: z
    .object({
      documentIds: z.array(z.string().uuid()).optional(),
      metadata: z.record(z.string(), z.unknown()).optional()
    })
    .optional()
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const SearchResponseSchema = z.object({
  query: z.string(),
  matches: z.array(ChunkSchema)
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export const CitationSchema = z.object({
  chunkId: z.string().uuid(),
  documentId: z.string().uuid(),
  documentName: z.string(),
  pageStart: z.number().int().positive(),
  pageEnd: z.number().int().positive(),
  similarity: z.number().optional()
});
export type CitationDto = z.infer<typeof CitationSchema>;

export const ChatRequestSchema = SearchRequestSchema.extend({
  temperature: z.number().min(0).max(1).default(0.1)
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(CitationSchema),
  retrievedChunks: z.array(ChunkSchema)
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const EvaluationCaseSchema = z.object({
  id: z.string(),
  question: z.string(),
  expectedSourceHint: z.string().optional()
});
export type EvaluationCase = z.infer<typeof EvaluationCaseSchema>;

export const EvaluationResultSchema = z.object({
  caseId: z.string(),
  question: z.string(),
  answer: z.string(),
  citationCount: z.number().int().nonnegative(),
  passed: z.boolean(),
  notes: z.string()
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
