import OpenAI from "openai";
import { env } from "../../config/env.js";
import { AppError } from "../../http/errors.js";
import { mapOpenAiError } from "./openAiErrorMapper.js";

export type GenerateAnswerInput = {
  question: string;
  context: string;
  temperature: number;
};

export class OpenAiService {
  private readonly client = new OpenAI({
    apiKey: env.OPENAI_API_KEY || "missing-openai-api-key",
  });

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }
    ensureOpenAiKey();

    const response = await this.client.embeddings
      .create({
        model: env.OPENAI_EMBEDDING_MODEL,
        input: texts,
      })
      .catch(mapOpenAiError);

    return response.data.map((item) => item.embedding);
  }

  async embedText(text: string): Promise<number[]> {
    const [embedding] = await this.embedTexts([text]);
    if (!embedding) {
      throw new Error("OpenAI returned no embedding");
    }
    return embedding;
  }

  async generateGroundedAnswer(input: GenerateAnswerInput): Promise<string> {
    ensureOpenAiKey();

    const response = await this.client.responses
      .create({
        model: env.OPENAI_CHAT_MODEL,
        temperature: input.temperature,
        input: [
          {
            role: "system",
            content:
              "You are Compliance Document Copilot. Answer only from the provided context. If the context is insufficient, say what is missing. Keep the answer concise and grounded.",
          },
          {
            role: "user",
            content: `Context:\n${input.context}\n\nQuestion:\n${input.question}`,
          },
        ],
      })
      .catch(mapOpenAiError);

    return response.output_text.trim();
  }
}

export function ensureOpenAiKey() {
  if (!env.OPENAI_API_KEY) {
    throw new AppError(
      "OPENAI_API_KEY is not configured. Add it to .env and restart the API container.",
      503,
      "openai_api_key_missing",
    );
  }
}
