import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createApp } from "./app.js";
import { pool } from "./db/pool.js";
import { documentIndexingQueue } from "./queues/documentIndexingQueue.js";

const app = createApp();
const server = app.listen(env.API_PORT, () => {
  logger.info(
    { port: env.API_PORT },
    "Compliance Document Copilot API listening",
  );
});

function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close(() => {
    void Promise.all([documentIndexingQueue.close(), pool.end()]).finally(
      () => {
        process.exit(0);
      },
    );
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
