import { z } from "zod";
import { ChatType } from "../models/chat.model";

export const createChatSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	members: z.array(z.string()).optional(),
	allowedRoles: z.array(z.string()).optional(),
	isPrivate: z.boolean().optional(),
	chatType: z
		.enum([ChatType.PUBLIC, ChatType.PRIVATE])
		.default(ChatType.PUBLIC),
});

export const updateChatSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
	members: z.array(z.string()).optional(),
	allowedRoles: z.array(z.string()).optional(),
	isPrivate: z.boolean().optional(),
	chatType: z.enum([ChatType.PUBLIC, ChatType.PRIVATE]).optional(),
});

export const updateUserRoleSchema = z.object({
	role: z.string().min(1),
});
