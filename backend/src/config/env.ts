import dotenv from "dotenv";
import { z } from "zod";

// Load env variables
dotenv.config();

// Default values for test environments so tests run instantly without manual .env setups
if (process.env.NODE_ENV === "test") {
  process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://capstone:capstone@localhost:5432/test_db?schema=public";
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test_jwt_access_secret_12345";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_jwt_refresh_secret_12345";
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string({
    required_error: "DATABASE_URL is required for database connection",
  }),
  JWT_ACCESS_SECRET: z.string().min(8, "JWT_ACCESS_SECRET must be at least 8 characters"),
  JWT_REFRESH_SECRET: z.string().min(8, "JWT_REFRESH_SECRET must be at least 8 characters"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export default env;
