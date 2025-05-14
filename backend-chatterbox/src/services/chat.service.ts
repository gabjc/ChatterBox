import mongoose from "mongoose";
import ChatModel from "../models/chat.model";
import UserModel from "../models/user.model";

export const validadeChatAccess = async (
	userId: mongoose.Types.ObjectId,
	chatId: string
): Promise<boolean> => {
	try {
		const chat = await ChatModel.findById(chatId);
		if (!chat) {
			return false;
		}

		const isMember = chat.members.some((member) => member.equals(userId));
		if (isMember) {
			return true;
		}

		if (chat.allowedRoles && chat.allowedRoles.length > 0) {
			const user = await UserModel.findById(userId);
			if (!user) {
				return false;
			}

			return chat.allowedRoles.includes(user.role);
		}
		return false;
	} catch (error) {
		console.error("Error validating chat access:", error);
		return false;
	}
};

export const getUserAccessibleChats = async (
	userId: mongoose.Types.ObjectId
): Promise<mongoose.Document[]> => {
	try {
		const user = await UserModel.findById(userId);
		if (!user) {
			throw new Error("User not found");
			return [];
		}
		return ChatModel.find({
			$or: [{ members: userId }, { allowedRoles: user.role }],
		}).sort({ updatedAt: -1 });
	} catch (error) {
		console.error("Error fetching user accessible chats:", error);
		return [];
	}
};
