import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../../src/services/auth.service.js";

describe("AuthService Unit Tests", () => {
  beforeAll(() => {
    // Inject mock environment secrets for token signing in tests
    process.env.JWT_ACCESS_SECRET = "test_access_secret_12345678";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_12345678";
  });

  it("should correctly hash and compare passwords", async () => {
    const password = "Password123!";
    const hash = await AuthService.hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    
    const isMatch = await AuthService.comparePasswords(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await AuthService.comparePasswords("wrong_pass", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("should generate and verify valid JWT access tokens", () => {
    const payload = { userId: "test-user-123" };
    const token = AuthService.generateAccessToken(payload);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = AuthService.verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it("should generate and verify valid JWT refresh tokens", () => {
    const payload = { userId: "test-user-456" };
    const token = AuthService.generateRefreshToken(payload);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = AuthService.verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });
});
