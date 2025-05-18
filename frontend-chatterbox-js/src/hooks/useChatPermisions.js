// src/hooks/useChatPermissions.js
import { useQuery } from "@tanstack/react-query";
import { checkChatPermission } from "../lib/api";
import useAuth from "./useAuth";

export const CHAT_PERMISSIONS = "chat-permissions";

const useChatPermissions = (chatId) => {
	const { user } = useAuth();

	const { data: hasPermission = false, ...rest } = useQuery({
		queryKey: [CHAT_PERMISSIONS, chatId, user?._id],
		queryFn: () => checkChatPermission(chatId),
		// Only run this query if we have a user and it's not the public chat
		enabled: !!user && chatId !== "public",
		// Permissions don't change often, so we can cache them longer
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	return {
		hasPermission: chatId === "public" ? true : hasPermission,
		...rest,
	};
};

export default useChatPermissions;

// src/lib/socket.js
import { io } from "socket.io-client";

// We'll create a single socket instance that can be reused
let socket = null;

export const connectToChat = ({
	chatId,
	userId,
	username,
	onConnect,
	onDisconnect,
	onMessage,
	onUserList,
	onError,
}) => {
	// If we already have a socket connection, disconnect it first
	if (socket) {
		socket.disconnect();
	}

	// Create a new socket connection
	socket = io(import.meta.env.VITE_API_URL, {
		withCredentials: true,
		auth: {
			userId,
			username,
		},
	});

	// Set up event handlers
	socket.on("connect", () => {
		console.log("Socket connected");
		// Join the chat room
		socket.emit("join_room", { chatId });
		if (onConnect) onConnect();
	});

	socket.on("disconnect", () => {
		console.log("Socket disconnected");
		if (onDisconnect) onDisconnect();
	});

	socket.on("chat_message", (message) => {
		console.log("Received message:", message);
		if (onMessage) onMessage(message);
	});

	socket.on("user_list", (users) => {
		console.log("User list updated:", users);
		if (onUserList) onUserList(users);
	});

	socket.on("error", (error) => {
		console.error("Socket error:", error);
		if (onError) onError(error);
	});

	socket.on("connect_error", (error) => {
		console.error("Socket connection error:", error);
		if (onError) onError(error);
	});

	return socket;
};

export const disconnectFromChat = () => {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
};

export const sendMessage = (chatId, message) => {
	if (!socket || !socket.connected) {
		console.error("Cannot send message: Socket not connected");
		return false;
	}

	socket.emit("send_message", { chatId, message });
	return true;
};
