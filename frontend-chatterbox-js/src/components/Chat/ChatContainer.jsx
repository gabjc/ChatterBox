import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import useAuth from "../../hooks/useAuth";
import Roles from "../../constants/roles";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";
import { io } from "socket.io-client";

const STATIC_CHATS = {
	public: {
		_id: "public-chat",
		name: "Public Chat",
		description: "Chat room for all users",
		chatType: "PUBLIC",
	},
	private: {
		_id: "private-chat",
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

	// Get the current chat based on the route param
	const currentChat = STATIC_CHATS[chatType];

	// Check permission
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
		}
	}, [chatType, user, isLoading, navigate, toast]);

	// Initialize socket connection
	useEffect(() => {
		if (!user || !currentChat) return;

		const socketIo = io(import.meta.env.VITE_API_URL, {
			withCredentials: true,
			auth: {
				token: localStorage.getItem("token"),
			},
		});

		socketIo.on("connect", () => {
			console.log("Socket connected");
			setIsConnected(true);

			// Join the appropriate chat room
			socketIo.emit("chat:join", currentChat._id);

			// Request previous messages
			socketIo.emit("chat:getMessages", currentChat._id);
		});

		socketIo.on("chat:messages", (messageHistory) => {
			console.log("Received message history:", messageHistory);
			setMessages(messageHistory || []);
		});

		socketIo.on("chat:message", (message) => {
			console.log("Received message:", message);
			setMessages((prev) => [...prev, message]);
		});

		socketIo.on("chat:activeUsers", (users) => {
			console.log("Active users:", users);
			setActiveUsers(users);
		});

		socketIo.on("chat:userJoined", (userData) => {
			toast({
				title: "User joined",
				description: `${userData.email || userData.userId} joined the chat`,
				status: "info",
				duration: 2000,
				isClosable: true,
			});
		});

		socketIo.on("chat:userLeft", (userData) => {
			toast({
				title: "User left",
				description: `${userData.email || userData.userId} left the chat`,
				status: "info",
				duration: 2000,
				isClosable: true,
			});
		});

		socketIo.on("chat:error", (error) => {
			toast({
				title: "Error",
				description: error,
				status: "error",
				duration: 3000,
				isClosable: true,
			});
		});

		socketIo.on("disconnect", () => {
			console.log("Socket disconnected");
			setIsConnected(false);
		});

		setSocket(socketIo);

		return () => {
			if (socketIo) {
				console.log("Leaving chat:", currentChat._id);
				socketIo.emit("chat:leave", currentChat._id);
				socketIo.disconnect();
				setIsConnected(false);
			}
		};
	}, [user, currentChat, toast]);

	const handleSendMessage = (content) => {
		if (!socket || !currentChat || !isConnected) return;

		socket.emit("chat:message", {
			chatId: currentChat._id,
			content,
		});
	};

	const handleBack = () => {
		navigate("/");
	};

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

	if (!user) {
		return (
			<Box textAlign="center" py={10}>
				<Text>Please login to access chats</Text>
			</Box>
		);
	}

	if (!currentChat) {
		return (
			<Box textAlign="center" py={10}>
				<Text>Invalid chat type. Please select a valid chat.</Text>
			</Box>
		);
	}

	return (
		<Flex direction="column" height="calc(100vh - 80px)" overflow="hidden">
			<ChatHeader chatType={chatType} />

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

			<MessageList messages={messages} currentUser={user} />

			<MessageInput
				onSendMessage={handleSendMessage}
				socket={socket}
				currentChatId={currentChat._id}
			/>
		</Flex>
	);
};

export default ChatContainer;
