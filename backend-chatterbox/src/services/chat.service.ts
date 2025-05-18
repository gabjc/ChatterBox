import mongoose from "mongoose";
import ChatModel, { ChatType } from "../models/chat.model";
import UserModel from "../models/user.model";
import Roles from "../constants/roles";
import appAssert from "../utils/appAssert";
import { NOT_FOUND } from "../constants/http";

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
		return chat.chatType === ChatType.PUBLIC;
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
		}
		const query: any = { $or: [{ members: userId }] };

		if (user.role === Roles.USER) {
			query.$or.push({
				chatType: ChatType.PUBLIC,
				allowedRoles: user.role,
			});
		} else if (user.role === Roles.ADMIN || user.role === Roles.SUPER) {
			query.$or.push({
				allowedRoles: user.role,
			});
		}

		return ChatModel.find(query).sort({ updatedAt: -1 });
	} catch (error) {
		console.error("Error fetching user accessible chats:", error);
		return [];
	}
};

export const updateUserRole = async (
	adminId: mongoose.Types.ObjectId,
	targetUserId: string,
	newRole: string
): Promise<boolean> => {
	try {
		const adminUser = await UserModel.findById(adminId);
		if (!adminUser || adminUser.role !== Roles.SUPER) {
			return false;
		}

		const targetUser = await UserModel.findByIdAndUpdate(
			targetUserId,
			{ role: newRole },
			{ new: true }
		);

		return !!targetUser;
	} catch (error) {
		console.error("Error updating user role:", error);
		return false;
	}
};
