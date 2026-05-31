import { readFile } from "node:fs/promises";
import type { DocumentDto, UploadDocumentResponse } from "@cdc/contracts";
import type { ChunkRepository } from "../../repositories/chunkRepository.js";
import type { DocumentRepository } from "../../repositories/documentRepository.js";
import type { OpenAiService } from "../ai/openAiService.js";
import { chunkPages } from "./chunkText.js";
import type { PdfTextExtractor } from "./pdfTextExtractor.js";

export class DocumentIndexingService {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly chunks: ChunkRepository,
    private readonly pdfTextExtractor: PdfTextExtractor,
    private readonly ai: OpenAiService
  ) {}

  async indexUploadedDocument(document: DocumentDto, storagePath: string): Promise<UploadDocumentResponse> {
    await this.documents.updateStatus(document.id, "processing");

    try {
      const buffer = await readFile(storagePath);
      const extracted = await this.pdfTextExtractor.extract(buffer);
      const textChunks = chunkPages(extracted.pages);
      const embeddings = await this.ai.embedTexts(textChunks.map((chunk) => chunk.content));

      await this.chunks.createMany(
        textChunks.map((chunk, index) => ({
          documentId: document.id,
          chunkIndex: chunk.chunkIndex,
          pageStart: chunk.pageStart,
          pageEnd: chunk.pageEnd,
          content: chunk.content,
          tokenEstimate: chunk.tokenEstimate,
          metadata: chunk.metadata,
          embedding: requiredEmbedding(embeddings[index])
        }))
      );

      const indexedDocument = await this.documents.updateStatus(document.id, "indexed", {
        pageCount: extracted.pageCount
      });

      return {
        document: indexedDocument,
        chunksIndexed: textChunks.length
      };
    } catch (error) {
      await this.documents.updateStatus(document.id, "failed", {
        errorMessage: error instanceof Error ? error.message : "Unknown indexing failure"
      });
      throw error;
    }
  }
}

function requiredEmbedding(embedding: number[] | undefined): number[] {
  if (!embedding) {
    throw new Error("OpenAI returned fewer embeddings than requested");
  }
  return embedding;
}
