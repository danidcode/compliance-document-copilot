import { Queue } from "bullmq";
import { createRedisConnectionOptions } from "./redisConnection.js";

export const documentIndexingQueueName = "document-indexing";
export const documentIndexingJobName = "index-document";

export type DocumentIndexingJobData = {
  documentId: string;
  storagePath: string;
};

export const documentIndexingQueue = new Queue<
  DocumentIndexingJobData,
  unknown,
  typeof documentIndexingJobName
>(documentIndexingQueueName, {
  connection: createRedisConnectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5_000,
    },
    removeOnComplete: {
      age: 60 * 60,
      count: 100,
    },
    removeOnFail: {
      age: 24 * 60 * 60,
      count: 500,
    },
  },
});

export async function enqueueDocumentIndexingJob(
  data: DocumentIndexingJobData,
) {
  return documentIndexingQueue.add(documentIndexingJobName, data, {
    jobId: data.documentId,
  });
}
