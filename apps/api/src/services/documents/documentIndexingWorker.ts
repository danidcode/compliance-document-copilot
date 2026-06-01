import { Job, Worker } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { pool } from "../../db/pool.js";
import { ChunkRepository } from "../../repositories/chunkRepository.js";
import { DocumentRepository } from "../../repositories/documentRepository.js";
import { OpenAiService } from "../ai/openAiService.js";
import { DocumentIndexingService } from "./documentIndexingService.js";
import { PdfTextExtractor } from "./pdfTextExtractor.js";
import {
  documentIndexingQueueName,
  type DocumentIndexingJobData,
} from "../../queues/documentIndexingQueue.js";
import { createRedisConnectionOptions } from "../../queues/redisConnection.js";

export function createDocumentIndexingWorker() {
  const documents = new DocumentRepository(pool);
  const chunks = new ChunkRepository(pool);
  const indexing = new DocumentIndexingService(
    documents,
    chunks,
    new PdfTextExtractor(),
    new OpenAiService(),
  );

  const worker = new Worker<DocumentIndexingJobData>(
    documentIndexingQueueName,
    async (job: Job<DocumentIndexingJobData>) => {
      logger.info(
        {
          jobId: job.id,
          documentId: job.data.documentId,
          attempt: job.attemptsMade + 1,
        },
        "document indexing job started",
      );

      await job.updateProgress(10);
      const document = await documents.findById(job.data.documentId);
      if (!document) {
        throw new Error(`Document ${job.data.documentId} not found`);
      }

      const result = await indexing.indexUploadedDocument(
        document,
        job.data.storagePath,
      );
      await job.updateProgress(100);

      logger.info(
        {
          jobId: job.id,
          documentId: job.data.documentId,
          chunksIndexed: result.chunksIndexed,
        },
        "document indexing job completed",
      );

      return {
        documentId: result.document.id,
        chunksIndexed: result.chunksIndexed,
      };
    },
    {
      connection: createRedisConnectionOptions(),
      concurrency: env.INDEXING_WORKER_CONCURRENCY,
    },
  );

  worker.on("failed", (job, error) => {
    logger.error(
      {
        err: error,
        jobId: job?.id,
        documentId: job?.data.documentId,
        attemptsMade: job?.attemptsMade,
      },
      "document indexing job failed",
    );
  });

  worker.on("error", (error) => {
    logger.error({ err: error }, "document indexing worker error");
  });

  return worker;
}
