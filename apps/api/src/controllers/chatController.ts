import { ChatRequestSchema } from "@cdc/contracts";
import type { RequestHandler } from "express";
import type { RagService } from "../services/rag/ragService.js";

export class ChatController {
  constructor(private readonly rag: RagService) {}

  chat: RequestHandler = async (req, res, next) => {
    try {
      const request = ChatRequestSchema.parse(req.body);
      const response = await this.rag.answer(request);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
