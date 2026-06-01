import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { isAppError } from "../http/errors.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    logger.warn(
      {
        err: error,
        requestId: req.id,
        method: req.method,
        path: req.path,
      },
      "request validation failed",
    );
    res.status(400).json({
      error: {
        code: "validation_error",
        message: "Request validation failed",
        issues: error.issues,
      },
    });
    return;
  }

  if (isAppError(error)) {
    logger.warn(
      {
        err: error,
        requestId: req.id,
        method: req.method,
        path: req.path,
        code: error.code,
        details: error.details,
      },
      "application error",
    );
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  logger.error(
    {
      err: error,
      requestId: req.id,
      method: req.method,
      path: req.path,
    },
    "unhandled request error",
  );
  res.status(500).json({
    error: {
      code: "internal_error",
      message: "Unexpected server error",
    },
  });
};
