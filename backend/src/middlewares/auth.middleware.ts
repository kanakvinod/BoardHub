import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { UnauthorizedError } from "../utils/customErrors.js";
import { AuthenticatedRequest } from "../types/index.js";

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing or malformed");
    }

    const token = authHeader.split(" ")[1];
    const payload = AuthService.verifyAccessToken(token);

    (req as AuthenticatedRequest).user = { id: payload.userId };
    next();
  } catch (err) {
    next(err);
  }
};
