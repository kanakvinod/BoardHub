import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { HttpError } from "../utils/customErrors.js";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (err instanceof HttpError) {
    logger.warn(`API Warning: [${err.name}] ${err.message} (HTTP ${err.statusCode}) on ${req.method} ${req.originalUrl}`);
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        status: err.statusCode,
      },
    });
    return;
  }

  // Prisma unique constraint or foreign key checks
  if (err.constructor.name === "PrismaClientKnownRequestError" || err.message.includes("Prisma")) {
    logger.warn(`Database Exception: ${err.message}`);
    res.status(400).json({
      error: {
        message: "Database constraint or validation failure",
        status: 400,
      },
    });
    return;
  }

  logger.error(err, `Unhandled Exception on ${req.method} ${req.originalUrl}`);

  res.status(500).json({
    error: {
      message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
      status: 500,
    },
  });
};
