import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().default(""),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4.1-mini"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  UPLOAD_DIR: z.string().default("uploads"),
  REDIS_URL: z.string().url().default("redis://redis:6379"),
  INDEXING_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(2),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export const env = EnvSchema.parse(process.env);
