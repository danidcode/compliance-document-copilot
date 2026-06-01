import { logger } from "./config/logger.js";
import { pool } from "./db/pool.js";
import { documentIndexingQueueName } from "./queues/documentIndexingQueue.js";
import { createDocumentIndexingWorker } from "./services/documents/documentIndexingWorker.js";

const worker = createDocumentIndexingWorker();

logger.info(
  { queue: documentIndexingQueueName },
  "Compliance Document Copilot worker listening",
);

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down worker");
  await worker.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
