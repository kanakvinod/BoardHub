import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";
import request from "supertest";

// Mock Prisma
vi.mock("../../src/config/db.js", () => {
  return {
    prisma: {
      project: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      task: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

import { app } from "../../src/server.js";
import { prisma } from "../../src/config/db.js";
import { AuthService } from "../../src/services/auth.service.js";

describe("Projects & Tasks API Integration Tests", () => {
  let token: string;
  const mockUserId = "test-user-id";

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = "test_access_secret_12345678";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_12345678";
    token = AuthService.generateAccessToken({ userId: mockUserId });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v1/projects", () => {
    it("should create project successfully when authenticated", async () => {
      const mockProject = {
        id: "a62f4e42-70b1-4198-8f83-a442a8b23f5b",
        name: "Test Project Board",
        description: "Seeded tasks for verification",
        ownerId: mockUserId,
        members: [{ id: mockUserId, name: "Alice Tester", email: "alice@example.com" }],
      };

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any);

      const res = await request(app)
        .post("/api/v1/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Test Project Board",
          description: "Seeded tasks for verification",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Project Board");
      expect(res.body.ownerId).toBe(mockUserId);
    });

    it("should fail with 401 when calling endpoint without bearer token", async () => {
      const res = await request(app)
        .post("/api/v1/projects")
        .send({
          name: "Unauthorized Project",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain("Authentication token is missing");
    });
  });

  describe("POST /api/v1/tasks", () => {
    it("should fail task creation if assignee is not a member of the project", async () => {
      const mockProject = {
        id: "a62f4e42-70b1-4198-8f83-a442a8b23f5b",
        name: "Test Project Board",
        ownerId: mockUserId,
        members: [{ id: mockUserId }], // Jane is not a member
      };

      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any);

      const res = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          projectId: "a62f4e42-70b1-4198-8f83-a442a8b23f5b",
          title: "New Task",
          assigneeId: "c90df62f-1dfd-4bb1-ba81-dfb506ceee32",
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe("Assignee must be a member of the project");
    });
  });
});
