import { z } from "zod";

export const createChatSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	members: z.array(z.string()).optional(),
	allowedRoles: z.array(z.string()).optional(),
	isPrivate: z.boolean().optional(),
});
