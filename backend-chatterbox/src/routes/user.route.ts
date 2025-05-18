import { Router } from "express";
import { getUserHandler } from "../controllers/user.controller";
import { updateUserRoleHandler } from "../controllers/chat.controller";
import { superUserMiddleware } from "../middleware/roles";

const userRoutes = Router();

// prefix: /user
userRoutes.get("/", getUserHandler);

userRoutes.put("/:userId/role", superUserMiddleware, updateUserRoleHandler);

export default userRoutes;
