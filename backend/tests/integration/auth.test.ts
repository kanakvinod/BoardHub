import { vi, describe, it, expect, beforeEach } from "vitest";
import request from "supertest";

// Mock Prisma client connection
vi.mock("../../src/config/db.js", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

import { app } from "../../src/server.js";
import { prisma } from "../../src/config/db.js";
import { AuthService } from "../../src/services/auth.service.js";

describe("Auth Controller Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a user with valid parameters", async () => {
      const userResult = {
        id: "user-uuid-1",
        name: "Alice Tester",
        email: "alice@example.com",
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(userResult as any);

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Alice Tester",
          email: "alice@example.com",
          password: "Password123!",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.user.name).toBe("Alice Tester");
      expect(res.body.user.email).toBe("alice@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should return a 400 bad request error for validation failure", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "A", // too short
          email: "not-an-email",
          password: "123", // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("Validation failed");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should log in user and return access token", async () => {
      const hash = await AuthService.hashPassword("Password123!");
      const userResult = {
        id: "user-uuid-2",
        name: "Bob Tester",
        email: "bob@example.com",
        password: hash,
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(userResult as any);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "bob@example.com",
          password: "Password123!",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.user.name).toBe("Bob Tester");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should return 401 for invalid credentials", async () => {
      const hash = await AuthService.hashPassword("Password123!");
      const userResult = {
        id: "user-uuid-2",
        name: "Bob Tester",
        email: "bob@example.com",
        password: hash,
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(userResult as any);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "bob@example.com",
          password: "WrongPassword!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe("Invalid email or password");
    });
  });
});
