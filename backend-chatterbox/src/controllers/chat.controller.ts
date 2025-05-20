import { OK, FORBIDDEN, NOT_FOUND } from "../constants/http";
import Roles from "../constants/roles";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import UserModel from "../models/user.model";
import { updateUserRole } from "../services/chat.service";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import { STATIC_CHAT_IDS } from "../utils/initializeStaticChats";

/**
 * Get all static chats the user has access to
 */
export const getUserChatsHandler = catchErrors(async (req, res) => {
	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");

	const userRole = user.role;

	// Start with the public chat that everyone can access
	const accessibleChatIds = [STATIC_CHAT_IDS.PUBLIC];

	// Check if user can access private chat
	if (userRole === Roles.ADMIN || userRole === Roles.SUPER) {
		accessibleChatIds.push(STATIC_CHAT_IDS.PRIVATE);
	}

	const chats = await ChatModel.find({
		_id: { $in: accessibleChatIds },
	});

	return res.status(OK).json(chats);
});

/**
 * Get a specific chat by ID
 */
export const getChatByIdHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;

	// Validate we're requesting one of our static chats
	if (chatId !== STATIC_CHAT_IDS.PUBLIC && chatId !== STATIC_CHAT_IDS.PRIVATE) {
		return res.status(NOT_FOUND).json({ message: "Chat not found" });
	}

	const chat = await ChatModel.findById(chatId);
	appAssert(chat, NOT_FOUND, "Chat not found");

	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");

	// Check if user has access to this chat
	const hasAccess =
		chatId === STATIC_CHAT_IDS.PUBLIC ||
		(chatId === STATIC_CHAT_IDS.PRIVATE &&
			(user.role === Roles.ADMIN || user.role === Roles.SUPER));

	appAssert(hasAccess, FORBIDDEN, "You don't have access to this chat");

	return res.status(OK).json(chat);
});

/**
 * Get chat messages
 */
export const getChatMessagesHandler = catchErrors(async (req, res) => {
	const chatId = req.params.id;
	const limit = Number(req.query.limit) || 50;
	const before = req.query.before as string;

	// Validate we're requesting one of our static chats
	if (chatId !== STATIC_CHAT_IDS.PUBLIC && chatId !== STATIC_CHAT_IDS.PRIVATE) {
		return res.status(NOT_FOUND).json({ message: "Chat not found" });
	}

	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");

	// Check if user has access to this chat
	const hasAccess =
		chatId === STATIC_CHAT_IDS.PUBLIC ||
		(chatId === STATIC_CHAT_IDS.PRIVATE &&
			(user.role === Roles.ADMIN || user.role === Roles.SUPER));

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

/**
 * Update a user's role (admin only)
 */
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
