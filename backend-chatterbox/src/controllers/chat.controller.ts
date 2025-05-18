import { CREATED, FORBIDDEN, NOT_FOUND, OK } from "../constants/http";
import Roles from "../constants/roles";
import ChatModel, { ChatType } from "../models/chat.model";
import MessageModel from "../models/message.model";
import UserModel from "../models/user.model";
import { updateUserRole, validadeChatAccess } from "../services/chat.service";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import { createChatSchema, updateChatSchema } from "./chat.schema";

export const createChatHandler = catchErrors(async (req, res) => {
	const request = createChatSchema.parse(req.body);
	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");

	if (request.chatType === ChatType.PRIVATE) {
		appAssert(
			user.role === Roles.ADMIN || user.role === Roles.SUPER,
			FORBIDDEN,
			"Only admins and super users can create private chats"
		);
	}

	const chat = await ChatModel.create({
		...request,
		createdBy: req.userId,
		members: [req.userId, ...(request.members || [])],
	});

	return res.status(CREATED).json(chat);
});

export const getUserChatsHandler = catchErrors(async (req, res) => {
	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");

	const userRole = user.role;
	const query: any = { $or: [{ members: req.userId }] };

	if (userRole === Roles.USER) {
		// Users can only access PUBLIC chats or chats they're explicitly members of
		query.$or.push({
			chatType: ChatType.PUBLIC,
			allowedRoles: userRole,
		});
	} else if (userRole === Roles.ADMIN || userRole === Roles.SUPER) {
		// ADMIN and SUPER can access both public and private chats
		query.$or.push({
			allowedRoles: userRole,
		});
	}

	const chats = await ChatModel.find(query).sort({ updatedAt: -1 });

	return res.status(OK).json(chats);
});

export const getChatByIdHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	const hasAccess = await validadeChatAccess(req.userId, chatId);
	appAssert(hasAccess, FORBIDDEN, "You don't have access to this chat");

	return res.status(OK).json(chat);
});

export const updateChatHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;
	const updateData = updateChatSchema.parse(req.body);

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");

	// Only the creator can update the chat OR a super user
	const canEdit =
		chat.createdBy.equals(req.userId) || user.role === Roles.SUPER;
	appAssert(
		canEdit,
		FORBIDDEN,
		"You don't have permission to update this chat"
	);

	if (updateData.chatType === ChatType.PRIVATE) {
		appAssert(
			user.role === Roles.ADMIN || user.role === Roles.SUPER,
			FORBIDDEN,
			"Only admins and super users can change a chat to private"
		);
	}

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

	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");

	// Only creator or super user can delete
	const canDelete =
		chat.createdBy.equals(req.userId) || user.role === Roles.SUPER;
	appAssert(
		canDelete,
		FORBIDDEN,
		"You don't have permission to delete this chat"
	);

	await Promise.all([
		ChatModel.findByIdAndDelete(chatId),
		MessageModel.deleteMany({ chatId }),
	]);

	return res.status(OK).json({ message: "Chat deleted successfully" });
});

export const getChatMessagesHandler = catchErrors(async (req, res) => {
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
		.populate("userId", "email role")
		.exec();

	return res.status(OK).json(messages.reverse());
});

export const addChatMembersHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;
	const { userId } = req.body;

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");

	// Only creator or super/admin users can add members
	const canEdit =
		chat.createdBy.equals(req.userId) ||
		user.role === Roles.SUPER ||
		user.role === Roles.ADMIN;

	appAssert(
		canEdit,
		FORBIDDEN,
		"You don't have permission to add members to this chat"
	);

	const isAlreadyMember = chat.members.some((member) => member.equals(userId));
	if (!isAlreadyMember) {
		chat.members.push(userId);
		await chat.save();
	}

	return res.status(OK).json(chat);
});

export const removeChatMembersHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;
	const { userId } = req.body;

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");

	// Only creator or super/admin users can remove members
	const canEdit =
		chat.createdBy.equals(req.userId) ||
		user.role === Roles.SUPER ||
		user.role === Roles.ADMIN;

	appAssert(
		canEdit,
		FORBIDDEN,
		"You don't have permission to remove members from this chat"
	);

	chat.members = chat.members.filter((member) => !member.equals(userId));
	await chat.save();

	return res.status(OK).json(chat);
});

export const updateUserRoleHandler = catchErrors(async (req, res) => {
	const targetUserId = req.params.userId;
	const { role } = req.body;

	// Validate role is valid
	appAssert(
		Object.values(Roles).includes(role),
		FORBIDDEN,
		"Invalid role specified"
	);

	const adminUser = await UserModel.findById(req.userId);
	appAssert(adminUser, NOT_FOUND, "Admin user not found");

	// Only SUPER users can update roles
	appAssert(
		adminUser.role === Roles.SUPER,
		FORBIDDEN,
		"Only super users can update user roles"
	);

	const success = await updateUserRole(req.userId, targetUserId, role);
	appAssert(success, NOT_FOUND, "Failed to update user role");

	return res.status(OK).json({ message: "User role updated successfully" });
});
