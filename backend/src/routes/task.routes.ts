import { Router } from "express";
import { TaskController, createTaskSchema, updateTaskSchema, getTasksQuerySchema } from "../controllers/task.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

// All task routes require auth
router.use(requireAuth);

router.post("/", validate(createTaskSchema), TaskController.createTask as any);
router.put("/:id", validate(updateTaskSchema), TaskController.updateTask as any);
router.delete("/:id", TaskController.deleteTask as any);
router.get("/project/:projectId", validate(getTasksQuerySchema), TaskController.getTasksByProject as any);

export const taskRouter = router;
export default taskRouter;
