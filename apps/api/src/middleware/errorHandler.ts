import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { isAppError } from "../http/errors.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "validation_error",
        message: "Request validation failed",
        issues: error.issues
      }
    });
    return;
  }

  if (isAppError(error)) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  reqSafeLog(error);
  res.status(500).json({
    error: {
      code: "internal_error",
      message: "Unexpected server error"
    }
  });
};

function reqSafeLog(error: unknown) {
  console.error(error);
}
