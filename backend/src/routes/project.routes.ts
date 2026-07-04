import { Router } from "express";
import { ProjectController, createProjectSchema, updateProjectSchema, addMemberSchema } from "../controllers/project.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

// All project routes require auth
router.use(requireAuth);

router.post("/", validate(createProjectSchema), ProjectController.createProject as any);
router.get("/", ProjectController.getAllProjects as any);
router.get("/:id", ProjectController.getProjectById as any);
router.put("/:id", validate(updateProjectSchema), ProjectController.updateProject as any);
router.delete("/:id", ProjectController.deleteProject as any);
router.post("/:id/members", validate(addMemberSchema), ProjectController.addMember as any);

export const projectRouter = router;
export default projectRouter;
