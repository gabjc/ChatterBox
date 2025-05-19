import { useQuery } from "@tanstack/react-query";
import { getChatById } from "../lib/api";
import useAuth from "./useAuth";
import Roles from "../constants/roles";

export const CHAT_PERMISSIONS = "chat-permissions";

const useChatPermissions = (chatId) => {
	const { user } = useAuth();

	const { data: chat, ...rest } = useQuery({
		queryKey: [CHAT_PERMISSIONS, chatId],
		queryFn: () => getChatById(chatId),
		enabled: !!user && !!chatId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const hasPermission = () => {
		if (!user || !chat) return false;

		// Check if user is a member of the chat
		if (chat.members.includes(user._id)) return true;

		// Check role-based permissions
		if (chat.allowedRoles && chat.allowedRoles.includes(user.role)) return true;

		// Check if chat is public and user is at least a USER
		if (chat.chatType === "PUBLIC" && user.role === Roles.USER) return true;

		// Admin and Super users can access public chats
		if (
			chat.chatType === "PUBLIC" &&
			(user.role === Roles.ADMIN || user.role === Roles.SUPER)
		)
			return true;

		// Only ADMIN and SUPER users can access private chats
		if (
			chat.chatType === "PRIVATE" &&
			(user.role === Roles.ADMIN || user.role === Roles.SUPER)
		)
			return true;

		return false;
	};

	return {
		hasPermission: hasPermission(),
		chat,
		...rest,
	};
};

export default useChatPermissions;
