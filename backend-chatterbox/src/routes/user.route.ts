import { Router } from "express";
import { getUserHandler } from "../controllers/user.controller";
import { updateUserRoleHandler } from "../controllers/chat.controller";
import {
	superUserMiddleware,
	adminOrSuperMiddleware,
} from "../middleware/roles";
import {
	getAllUsersHandler,
	getUserDetailsHandler,
} from "../controllers/admin.controller";
const userRoutes = Router();

// prefix: /user
userRoutes.get("/", getUserHandler);

//supers only
userRoutes.put("/:userId/role", superUserMiddleware, updateUserRoleHandler);

//admin/super routes
userRoutes.get("/all", adminOrSuperMiddleware, getAllUsersHandler);
userRoutes.get("/:userId", adminOrSuperMiddleware, getUserDetailsHandler);

export default userRoutes;
