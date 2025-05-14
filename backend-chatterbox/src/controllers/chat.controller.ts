import { CREATED, FORBIDDEN, NOT_FOUND, OK } from "../constants/http";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import { validadeChatAccess } from "../services/chat.service";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import { createChatSchema, updateChatSchema } from "./chat.schema";

export const createChatHandler = catchErrors(async (req, res) => {
	const request = createChatSchema.parse(req.body);

	const chat = await ChatModel.create({
		...request,
		createdBy: req.userId,
		members: [req.userId, ...(request.members || [])],
	});

	return res.status(CREATED).json(chat);
});

export const getUserChatsHandler = catchErrors(async (req, res) => {
	const user = req.userId;
	const userRole = req.body.role;

	const chats = await ChatModel.find({
		$or: [{ members: user }, { allowedRoles: userRole }],
	}).sort({ updatedAt: -1 });

	return res.status(OK).json(chats);
});

export const getChatByIdHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	const hasAccess = await validadeChatAccess(req.userId, chatId);
	appAssert(hasAccess, FORBIDDEN, "You don't have access to this chat");
});

export const updateChatHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;
	const updateData = updateChatSchema.parse(req.body);

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	appAssert(
		chat.createdBy.equals(req.userId),
		FORBIDDEN,
		"You don't have permission to update this chat"
	);

	const updatedChat = await ChatModel.findByIdAndUpdate(
		chatId,
		{ $set: updateData },
		{ new: true }
	);

	return res.status(OK).json(updatedChat);
});

export const deleteChatHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	appAssert(
		chat.createdBy.equals(req.userId),
		FORBIDDEN,
		"You don't have permission to delete this chat"
	);

	await Promise.all([
		ChatModel.findByIdAndDelete(chatId),
		MessageModel.deleteMany({ chatId }),
	]);

	return res.status(OK).json({ message: "Chat deleted successfully" });
});

const getChatMessagesHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;
	const limit = Number(req.query.limit) || 50;
	const before = req.query.before as string;

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	const hasAccess = await validadeChatAccess(req.userId, chatId);
	appAssert(hasAccess, FORBIDDEN, "You don't have access to this chat");

	const query: any = { chatId };
	if (before) {
		query.createdAt = { $lt: new Date(before) };
	}

	const messages = await MessageModel.find(query)
		.sort({ createdAt: -1 })
		.limit(limit)
		.populate("userId", "email")
		.exec();

	return res.status(OK).json(messages.reverse());
});

export const addChatMembersHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;
	const { userId } = req.body;

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	appAssert(
		chat.createdBy.equals(req.userId),
		FORBIDDEN,
		"You don't have permission to add members to this chat"
	);

	const isAlreadyMember = chat.members.some((member) => member.equals(userId));
	if (!isAlreadyMember) {
		chat.members.push(userId);
		await chat.save();
	}
	// const updatedChat = await ChatModel.findByIdAndUpdate(
	// 	chatId,
	// 	{ $addToSet: { members: { $each: membersToAdd } } },
	// 	{ new: true }
	// );

	return res.status(OK).json(chat);
});

export const removeChatMembersHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;
	const { userId } = req.body;

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	appAssert(
		chat.createdBy.equals(req.userId),
		FORBIDDEN,
		"You don't have permission to remove members from this chat"
	);

	chat.members = chat.members.filter((member) => !member.equals(userId));
	await chat.save();

	return res.status(OK).json(chat);
});
