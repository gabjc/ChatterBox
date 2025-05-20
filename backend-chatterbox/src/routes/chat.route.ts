import { Router } from "express";
import {
	getChatByIdHandler,
	getChatMessagesHandler,
	getUserChatsHandler,
	updateUserRoleHandler,
} from "../controllers/chat.controller";

const chatRoutes = Router();

// Get available chats
chatRoutes.get("/", getUserChatsHandler);

// Get chat by ID
chatRoutes.get("/:id", getChatByIdHandler);

// Get chat messages
chatRoutes.get("/:id/messages", getChatMessagesHandler);

// Update user role (admin function)
chatRoutes.put("/user/:userId/role", updateUserRoleHandler);

export default chatRoutes;
