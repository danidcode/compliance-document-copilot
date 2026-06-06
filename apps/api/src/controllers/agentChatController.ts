import { AgentChatRequestSchema } from "@cdc/contracts";
import type { RequestHandler } from "express";
import type { ComplianceAgentService } from "../services/agents/complianceAgentService.js";

export class AgentChatController {
  constructor(private readonly agent: ComplianceAgentService) {}

  chat: RequestHandler = async (req, res, next) => {
    try {
      const request = AgentChatRequestSchema.parse(req.body);
      const response = await this.agent.answer(request);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
