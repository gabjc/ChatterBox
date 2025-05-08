import ChatModel from "../models/chat.model";
import catchErrors from "../utils/catchErrors";
import { createChatSchema } from "./chat.schema";

export const createChatHandler = catchErrors(async (req, res) => {
	const request = createChatSchema.parse(req.body);

	const chat = await ChatModel.create({
		...request,
		createdBy: req.userId,
		members: [req.userId, ...(request.members || [])],
	});
});
