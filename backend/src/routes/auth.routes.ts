import { Router } from "express";
import { AuthController, registerSchema, loginSchema } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

export const authRouter = router;
export default authRouter;
