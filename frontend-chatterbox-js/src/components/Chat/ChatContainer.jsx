import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Flex, Text, useToast } from "@chakra-ui/react";
import { io } from "socket.io-client";
import useAuth from "../../hooks/useAuth";
import Roles from "../../constants/roles";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";

// Match the static chat IDs from the backend
const STATIC_CHATS = {
	public: {
		_id: "public-chat", // Must match backend STATIC_CHAT_IDS.PUBLIC
		name: "Public Chat",
		description: "Chat room for all users",
		chatType: "PUBLIC",
	},
	private: {
		_id: "private-chat", // Must match backend STATIC_CHAT_IDS.PRIVATE
		name: "Private Chat",
		description: "Admin-only chat room",
		chatType: "PRIVATE",
	},
};

const ChatContainer = () => {
	const { chatType } = useParams();
	const navigate = useNavigate();
	const toast = useToast();
	const { user, isLoading } = useAuth();
	const [socket, setSocket] = useState(null);
	const [messages, setMessages] = useState([]);
	const [activeUsers, setActiveUsers] = useState([]);
	const [isConnected, setIsConnected] = useState(false);
	const [typingUsers, setTypingUsers] = useState([]);

	// Get the current chat based on the route param
	const currentChat = STATIC_CHATS[chatType];

	// Check permission - redirect if unauthorized
	useEffect(() => {
		if (!isLoading && user) {
			// If trying to access private chat as a regular user
			if (chatType === "private" && user.role === Roles.USER) {
				toast({
					title: "Access denied",
					description: "You don't have permission to access private chats",
					status: "error",
					duration: 3000,
					isClosable: true,
				});
				navigate("/");
			}

			// If chat type is invalid, redirect to home
			if (!currentChat) {
				toast({
					title: "Invalid chat",
					description: "The requested chat room doesn't exist",
					status: "error",
					duration: 3000,
					isClosable: true,
				});
				navigate("/");
			}
		}
	}, [chatType, user, isLoading, navigate, toast, currentChat]);

	// Initialize socket connection
	useEffect(() => {
		if (!user || !currentChat) return;

		// Connect to websocket server with token auth
		const socketIo = io(import.meta.env.VITE_API_URL, {
			withCredentials: true,
		});

		// Connection established
		socketIo.on("connect", () => {
			console.log("Socket connected");
			setIsConnected(true);

			// Join the appropriate chat room
			socketIo.emit("chat:join", currentChat._id);
		});

		// Handle incoming messages
		socketIo.on("chat:messages", (messageHistory) => {
			console.log("Received message history:", messageHistory);
			setMessages(messageHistory || []);
		});

		// Handle new messages
		socketIo.on("chat:message", (message) => {
			console.log("Received new message:", message);
			setMessages((prev) => [...prev, message]);
		});

		// Handle active users update
		socketIo.on("chat:activeUsers", (users) => {
			console.log("Active users:", users);
			setActiveUsers(users);
		});

		// Handle typing indicators
		socketIo.on("chat:typing", ({ userId, username, isTyping }) => {
			if (isTyping) {
				setTypingUsers((prev) => [
					...prev.filter((user) => user.userId !== userId),
					{ userId, username },
				]);
			} else {
				setTypingUsers((prev) => prev.filter((user) => user.userId !== userId));
			}
		});

		// User joined notification
		socketIo.on("chat:userJoined", (userData) => {
			toast({
				title: "User joined",
				description: `${userData.email || userData.userId} joined the chat`,
				status: "info",
				duration: 2000,
				isClosable: true,
			});
		});

		// User left notification
		socketIo.on("chat:userLeft", (userData) => {
			toast({
				title: "User left",
				description: `${userData.email || userData.userId} left the chat`,
				status: "info",
				duration: 2000,
				isClosable: true,
			});
		});

		// Error handling
		socketIo.on("chat:error", (error) => {
			toast({
				title: "Chat Error",
				description: error,
				status: "error",
				duration: 3000,
				isClosable: true,
			});
		});

		// Disconnection handling
		socketIo.on("disconnect", () => {
			console.log("Socket disconnected");
			setIsConnected(false);

			toast({
				title: "Disconnected",
				description: "Lost connection to chat server",
				status: "warning",
				duration: 3000,
				isClosable: true,
			});
		});

		setSocket(socketIo);

		// Cleanup on unmount
		return () => {
			if (socketIo) {
				console.log("Leaving chat:", currentChat._id);
				socketIo.emit("chat:leave", currentChat._id);
				socketIo.disconnect();
				setIsConnected(false);
			}
		};
	}, [user, currentChat, toast, navigate]);

	// Send message handler
	const handleSendMessage = (content) => {
		if (!socket || !currentChat || !isConnected) return;

		socket.emit("chat:message", {
			chatId: currentChat._id,
			content,
		});
	};

	// Handle typing status
	const handleTypingStatus = (isTyping) => {
		if (!socket || !currentChat || !isConnected) return;

		socket.emit("chat:typing", {
			chatId: currentChat._id,
			isTyping,
		});
	};

	// Loading state
	if (isLoading) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				height="80vh">
				<Text>Loading...</Text>
			</Box>
		);
	}

	// Authentication check
	if (!user) {
		return (
			<Box textAlign="center" py={10}>
				<Text>Please login to access chats</Text>
			</Box>
		);
	}

	// Invalid chat check
	if (!currentChat) {
		return (
			<Box textAlign="center" py={10}>
				<Text>Invalid chat type. Please select a valid chat.</Text>
			</Box>
		);
	}

	return (
		<Flex direction="column" height="calc(100vh - 80px)" overflow="hidden">
			<ChatHeader
				chatType={chatType}
				activeUsers={activeUsers.length}
				isConnected={isConnected}
			/>

			{/* Chat status bar */}
			<Box
				bg="gray.700"
				p={4}
				borderBottom="1px solid"
				borderColor="gray.600"
				display="flex"
				justifyContent="space-between"
				alignItems="center">
				<Box>
					<Text fontSize="sm" color="gray.400">
						{currentChat.description}
					</Text>
				</Box>
				<Text
					fontSize="sm"
					color={isConnected ? "green.300" : "red.300"}
					fontWeight="medium">
					{isConnected ? "Connected" : "Disconnected"}
					{activeUsers.length > 0 &&
						isConnected &&
						` • ${activeUsers.length} online`}
				</Text>
			</Box>

			{/* Message display area */}
			<MessageList messages={messages} currentUser={user} />

			{/* Message input area */}
			<MessageInput
				onSendMessage={handleSendMessage}
				onTypingStatus={handleTypingStatus}
				typingUsers={typingUsers}
				isConnected={isConnected}
			/>
		</Flex>
	);
};

export default ChatContainer;
