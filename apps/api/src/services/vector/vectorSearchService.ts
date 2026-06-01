import type { SearchRequest, SearchResponse } from "@cdc/contracts";
import type { ChunkRepository } from "../../repositories/chunkRepository.js";
import type { OpenAiService } from "../ai/openAiService.js";

export class VectorSearchService {
  constructor(
    private readonly chunks: ChunkRepository,
    private readonly ai: OpenAiService,
  ) {}

  async search(request: SearchRequest): Promise<SearchResponse> {
    const embedding = await this.ai.embedText(request.question);
    const matches = await this.chunks.searchByEmbedding(
      embedding,
      request.topK,
      request.filters,
    );

    return {
      query: request.question,
      matches,
    };
  }
}
