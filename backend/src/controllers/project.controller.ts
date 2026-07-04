import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { AuthenticatedRequest } from "../types/index.js";
import { ForbiddenError, NotFoundError } from "../utils/customErrors.js";
import { logger } from "../utils/logger.js";

// Validation schemas
export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Project name is required").optional(),
    description: z.string().optional(),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export class ProjectController {
  static async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;
      const ownerId = req.user.id;

      const project = await prisma.project.create({
        data: {
          name,
          description,
          ownerId,
          members: {
            connect: { id: ownerId }, // The owner is also a member
          },
        },
        include: {
          members: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Project created: ${project.name} (${project.id}) by owner ${ownerId}`);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  static async getAllProjects(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;

      // Find projects where user is owner or member
      const projects = await prisma.project.findMany({
        where: {
          members: {
            some: { id: userId },
          },
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { tasks: true, members: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          members: {
            select: { id: true, name: true, email: true },
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!project) {
        throw new NotFoundError("Project not found");
      }

      // Check if user is a member of the project
      const isMember = project.members.some((member) => member.id === userId);
      if (!isMember) {
        throw new ForbiddenError("You are not a member of this project");
      }

      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const userId = req.user.id;

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundError("Project not found");
      }

      if (project.ownerId !== userId) {
        throw new ForbiddenError("Only the project owner can update details");
      }

      const updatedProject = await prisma.project.update({
        where: { id },
        data: { name, description },
      });

      res.status(200).json(updatedProject);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new NotFoundError("Project not found");
      }

      if (project.ownerId !== userId) {
        throw new ForbiddenError("Only the project owner can delete this project");
      }

      await prisma.project.delete({
        where: { id },
      });

      logger.info(`Project deleted: ${id}`);
      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { email } = req.body;
      const userId = req.user.id;

      const project = await prisma.project.findUnique({
        where: { id },
        include: { members: true },
      });

      if (!project) {
        throw new NotFoundError("Project not found");
      }

      if (project.ownerId !== userId) {
        throw new ForbiddenError("Only the project owner can invite members");
      }

      // Find user to invite
      const userToInvite = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!userToInvite) {
        throw new NotFoundError("User with this email not found");
      }

      // Check if user is already a member
      const isAlreadyMember = project.members.some((member) => member.id === userToInvite.id);
      if (isAlreadyMember) {
        res.status(200).json({ message: "User is already a member of this project" });
        return;
      }

      // Add user to project
      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          members: {
            connect: { id: userToInvite.id },
          },
        },
        include: {
          members: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      logger.info(`User ${userToInvite.email} added to project ${id}`);
      res.status(200).json(updatedProject);
    } catch (error) {
      next(error);
    }
  }
}
