import type { RequestHandler } from "express";
import type { EvaluationService } from "../services/rag/evaluationService.js";

export class EvaluationController {
  constructor(private readonly evaluations: EvaluationService) {}

  run: RequestHandler = async (_req, res, next) => {
    try {
      const results = await this.evaluations.run();
      res.json({ results });
    } catch (error) {
      next(error);
    }
  };
}
