import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import env from "./config/env.js";
import { setupSwagger } from "./config/swagger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";
import { logger } from "./utils/logger.js";

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

// Express body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${req.ip}`
    );
  });
  next();
});

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many authentication requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Setup Swagger Docs
setupSwagger(app);

// API Routes
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/tasks", taskRouter);

// Health check endpoint (for deployment & monitoring)
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// Base Route
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Welcome to BoardHub API. Refer to /api-docs for documentation.",
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { message: "Endpoint not found", status: 404 } });
});

// Global Error Handler
app.use(errorHandler);

// Start Server (only if not in testing mode)
let server: any;
if (env.NODE_ENV !== "test") {
  server = app.listen(env.PORT, () => {
    logger.info(`🚀 API Server successfully listening on port ${env.PORT}`);
    logger.info(`📖 API Swagger Documentation available at http://localhost:${env.PORT}/api-docs`);
  });
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received. Shutting down gracefully...");
  if (server) {
    server.close(() => {
      logger.info("Server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export { app };
export default app;
