import OpenAI from "openai";
import { AppError } from "../../http/errors.js";

export function mapOpenAiError(error: unknown): never {
  if (error instanceof OpenAI.APIError) {
    const code = String(error.code ?? error.type ?? "openai_api_error");
    const requestId = error.requestID;
    const details = {
      provider: "openai",
      status: error.status,
      code,
      type: error.type,
      requestId,
    };

    if (error.status === 401) {
      throw new AppError(
        "OpenAI rejected the configured API key.",
        502,
        "openai_authentication_failed",
        details,
      );
    }

    if (error.status === 429) {
      const isQuota = code === "insufficient_quota";
      throw new AppError(
        isQuota
          ? "OpenAI quota is exhausted or billing is not enabled for this project."
          : "OpenAI rate limit reached. Retry after a short delay.",
        isQuota ? 402 : 429,
        isQuota ? "openai_insufficient_quota" : "openai_rate_limited",
        details,
      );
    }

    throw new AppError(error.message, 502, "openai_api_error", details);
  }

  throw error;
}
