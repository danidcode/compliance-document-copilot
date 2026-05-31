import { SearchRequestSchema } from "@cdc/contracts";
import type { RequestHandler } from "express";
import type { VectorSearchService } from "../services/vector/vectorSearchService.js";

export class SearchController {
  constructor(private readonly vectorSearch: VectorSearchService) {}

  search: RequestHandler = async (req, res, next) => {
    try {
      const request = SearchRequestSchema.parse(req.body);
      const response = await this.vectorSearch.search(request);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
