import type { ConnectionOptions } from "bullmq";
import { env } from "../config/env.js";

export function createRedisConnectionOptions(): ConnectionOptions {
  return {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
  };
}
