import { Router } from "express";
import { pool } from "../db/pool.js";
import {
  DocumentController,
  uploadPdf,
} from "../controllers/documentController.js";
import { ChatController } from "../controllers/chatController.js";
import { EvaluationController } from "../controllers/evaluationController.js";
import { SearchController } from "../controllers/searchController.js";
import { ChunkRepository } from "../repositories/chunkRepository.js";
import { DocumentRepository } from "../repositories/documentRepository.js";
import { QueryRepository } from "../repositories/queryRepository.js";
import { OpenAiService } from "../services/ai/openAiService.js";
import { EvaluationService } from "../services/rag/evaluationService.js";
import { RagService } from "../services/rag/ragService.js";
import { VectorSearchService } from "../services/vector/vectorSearchService.js";

export function createRoutes(): Router {
  const router = Router();

  const documents = new DocumentRepository(pool);
  const chunks = new ChunkRepository(pool);
  const queries = new QueryRepository(pool);
  const ai = new OpenAiService();
  const vectorSearch = new VectorSearchService(chunks, ai);
  const rag = new RagService(vectorSearch, ai, queries);
  const evaluations = new EvaluationService(rag);

  const documentController = new DocumentController(documents);
  const searchController = new SearchController(vectorSearch);
  const chatController = new ChatController(rag);
  const evaluationController = new EvaluationController(evaluations);

  router.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  router.get("/documents", documentController.list);
  router.post(
    "/documents",
    uploadPdf.single("file"),
    documentController.upload,
  );
  router.post("/search", searchController.search);
  router.post("/chat", chatController.chat);
  router.post("/evaluations/run", evaluationController.run);

  return router;
}
