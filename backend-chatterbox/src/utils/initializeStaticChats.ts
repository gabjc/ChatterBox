import mongoose from "mongoose";
import ChatModel, { ChatType } from "../models/chat.model";
import UserModel from "../models/user.model";
import Roles from "../constants/roles";

// Static chat IDs for consistent reference
export const STATIC_CHAT_IDS = {
	PUBLIC: "public-chat",
	PRIVATE: "private-chat",
};

/**
 * Initializes the static chat rooms (public and private) if they don't exist
 */
export const initializeStaticChats = async (): Promise<void> => {
	console.log("Initializing static chat rooms...");

	try {
		// Find or create super admin user
		const superAdmin = await UserModel.findOne({ role: Roles.SUPER });

		if (!superAdmin) {
			console.error(
				"No super admin user found. Cannot initialize static chats."
			);
			return;
		}

		const publicChatExists = await ChatModel.findOne({
			name: "Public Chat",
		});

		if (!publicChatExists) {
			console.log("Creating public chat room...");
			await ChatModel.create({
				name: "Public Chat",
				description: "Chat room for all users",
				chatType: ChatType.PUBLIC,
				createdBy: superAdmin._id,
				members: [superAdmin._id],
				allowedRoles: [Roles.USER, Roles.ADMIN, Roles.SUPER],
			});
			console.log("Public chat room created successfully.");
		}

		// Check if private chat exists
		const privateChatExists = await ChatModel.findOne({
			name: "Private Chat",
		});

		if (!privateChatExists) {
			console.log("Creating private chat room...");
			await ChatModel.create({
				name: "Private Chat",
				description: "Admin-only chat room",
				chatType: ChatType.PRIVATE,
				createdBy: superAdmin._id,
				members: [superAdmin._id],
				allowedRoles: [Roles.ADMIN, Roles.SUPER],
				isPrivate: true,
			});
			console.log("Private chat room created successfully.");
		}

		console.log("Static chat rooms initialized successfully.");
	} catch (error) {
		console.error("Error initializing static chat rooms:", error);
	}
};
