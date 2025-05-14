import { Router } from "express";
import {
	addChatMembersHandler,
	createChatHandler,
	deleteChatHandler,
	getChatByIdHandler,
	getChatMessagesHandler,
	getUserChatsHandler,
	removeChatMembersHandler,
	updateChatHandler,
} from "../controllers/chat.controller";

const chatRoutes = Router();

// CRUD for chats
chatRoutes.post("/", createChatHandler);
chatRoutes.get("/", getUserChatsHandler);
chatRoutes.get("/:id", getChatByIdHandler);
chatRoutes.put("/:id", updateChatHandler);
chatRoutes.delete("/:id", deleteChatHandler);

// Chat messages
chatRoutes.get("/:id/messages", getChatMessagesHandler);

// Chat members
chatRoutes.post("/:id/members", addChatMembersHandler);
chatRoutes.delete("/:id/members", removeChatMembersHandler);

export default chatRoutes;
