import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, "Compliance Document Copilot API listening");
});
