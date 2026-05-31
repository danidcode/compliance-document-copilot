import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { RequestHandler } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../http/errors.js";
import type { DocumentRepository } from "../repositories/documentRepository.js";
import type { DocumentIndexingService } from "../services/documents/documentIndexingService.js";

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await mkdir(env.UPLOAD_DIR, { recursive: true });
      callback(null, env.UPLOAD_DIR);
    } catch (error) {
      callback(error as Error, env.UPLOAD_DIR);
    }
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, `${Date.now()}-${safeName}`);
  }
});

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      callback(new AppError("Only PDF files are supported", 400, "unsupported_file_type"));
      return;
    }
    callback(null, true);
  }
});

export class DocumentController {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly indexing: DocumentIndexingService
  ) {}

  list: RequestHandler = async (_req, res, next) => {
    try {
      const documents = await this.documents.list();
      res.json({ documents });
    } catch (error) {
      next(error);
    }
  };

  upload: RequestHandler = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError("A PDF file is required", 400, "missing_file");
      }

      const document = await this.documents.create({
        name: path.parse(req.file.originalname).name,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storagePath: req.file.path,
        metadata: {
          ingestionSource: "web-upload"
        }
      });

      const response = await this.indexing.indexUploadedDocument(document, req.file.path);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
