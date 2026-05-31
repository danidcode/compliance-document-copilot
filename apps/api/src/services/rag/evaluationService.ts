import type { EvaluationCase, EvaluationResult } from "@cdc/contracts";
import type { RagService } from "./ragService.js";

const evaluationCases: EvaluationCase[] = [
  {
    id: "grounded-answer",
    question: "What compliance obligations are described in the uploaded documents?",
    expectedSourceHint: "At least one citation should be returned."
  }
];

export class EvaluationService {
  constructor(private readonly rag: RagService) {}

  async run(): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];

    for (const evaluationCase of evaluationCases) {
      const response = await this.rag.answer({
        question: evaluationCase.question,
        topK: 4,
        temperature: 0
      });

      results.push({
        caseId: evaluationCase.id,
        question: evaluationCase.question,
        answer: response.answer,
        citationCount: response.citations.length,
        passed: response.citations.length > 0 && !/insufficient|missing/i.test(response.answer),
        notes: evaluationCase.expectedSourceHint ?? ""
      });
    }

    return results;
  }
}
