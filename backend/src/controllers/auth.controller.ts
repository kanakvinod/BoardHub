import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { AuthService } from "../services/auth.service.js";
import { ConflictError, UnauthorizedError } from "../utils/customErrors.js";
import { logger } from "../utils/logger.js";

// Validation schemas
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictError("Email is already registered");
      }

      // Hash password and create user
      const hashedPassword = await AuthService.hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const accessToken = AuthService.generateAccessToken({ userId: user.id });
      const refreshToken = AuthService.generateRefreshToken({ userId: user.id });

      // Set cookie for refresh token
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info(`User registered successfully: ${user.email} (${user.id})`);

      res.status(201).json({
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new UnauthorizedError("Invalid email or password");
      }

      // Compare passwords
      const isMatch = await AuthService.comparePasswords(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedError("Invalid email or password");
      }

      // Generate tokens
      const accessToken = AuthService.generateAccessToken({ userId: user.id });
      const refreshToken = AuthService.generateRefreshToken({ userId: user.id });

      // Set cookie for refresh token
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info(`User logged in successfully: ${user.email}`);

      res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError("Refresh token is missing");
      }

      // Verify token
      const payload = AuthService.verifyRefreshToken(refreshToken);

      // Check if user still exists
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        throw new UnauthorizedError("User does not exist");
      }

      // Generate new tokens
      const newAccessToken = AuthService.generateAccessToken({ userId: user.id });
      const newRefreshToken = AuthService.generateRefreshToken({ userId: user.id });

      // Refresh cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        user,
        accessToken: newAccessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
      next(error);
    }
  }
}
