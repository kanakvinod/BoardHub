import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { AuthenticatedRequest } from "../types/index.js";
import { ForbiddenError, NotFoundError } from "../utils/customErrors.js";
import { logger } from "../utils/logger.js";

// Validation schemas
export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().uuid("Invalid project ID"),
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
    dueDate: z.string().datetime({ precision: 3, offset: true }).optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    assigneeId: z.string().uuid().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
  }),
});

export const getTasksQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    search: z.string().optional(),
  }),
});

export class TaskController {
  static async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, title, description, status, priority, assigneeId, dueDate } = req.body;
      const userId = req.user.id;

      // Verify user is a member of the project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true },
      });

      if (!project) {
        throw new NotFoundError("Project not found");
      }

      const isMember = project.members.some((member) => member.id === userId);
      if (!isMember) {
        throw new ForbiddenError("You must be a member of the project to add tasks");
      }

      // Verify assignee is a member if provided
      if (assigneeId) {
        const isAssigneeMember = project.members.some((member) => member.id === assigneeId);
        if (!isAssigneeMember) {
          throw new ForbiddenError("Assignee must be a member of the project");
        }
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          status,
          priority,
          projectId,
          ownerId: userId,
          assigneeId: assigneeId || null,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      logger.info(`Task created: ${task.title} (${task.id}) in project ${projectId}`);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, status, priority, assigneeId, dueDate } = req.body;
      const userId = req.user.id;

      // Find task and check project membership
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            include: { members: true },
          },
        },
      });

      if (!task) {
        throw new NotFoundError("Task not found");
      }

      const isMember = task.project.members.some((member) => member.id === userId);
      if (!isMember) {
        throw new ForbiddenError("You must be a member of the project to modify tasks");
      }

      // Verify assignee is member of project if assigneeId is being updated
      if (assigneeId) {
        const isAssigneeMember = task.project.members.some((member) => member.id === assigneeId);
        if (!isAssigneeMember) {
          throw new ForbiddenError("Assignee must be a member of the project");
        }
      }

      // Build update payload
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

      const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      logger.info(`Task updated: ${id}`);
      res.status(200).json(updatedTask);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find task and check project membership
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            include: { members: true },
          },
        },
      });

      if (!task) {
        throw new NotFoundError("Task not found");
      }

      const isMember = task.project.members.some((member) => member.id === userId);
      if (!isMember) {
        throw new ForbiddenError("You must be a member of the project to delete tasks");
      }

      await prisma.task.delete({
        where: { id },
      });

      logger.info(`Task deleted: ${id} by user ${userId}`);
      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async getTasksByProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;
      const { page, limit, status, priority, search } = req.query as any;

      // Verify project membership
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true },
      });

      if (!project) {
        throw new NotFoundError("Project not found");
      }

      const isMember = project.members.some((member) => member.id === userId);
      if (!isMember) {
        throw new ForbiddenError("You must be a member of this project to view tasks");
      }

      // Build filters
      const whereClause: any = {
        projectId,
      };

      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Pagination details
      const skip = (page - 1) * limit;

      const [tasks, totalCount] = await prisma.$transaction([
        prisma.task.findMany({
          where: whereClause,
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
            owner: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.task.count({ where: whereClause }),
      ]);

      res.status(200).json({
        tasks,
        pagination: {
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          page,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
