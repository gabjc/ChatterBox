import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import useAuth from "../../hooks/useAuth";
import Roles from "../../constants/roles";
import ChatSidebar from "./ChatSidebar";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { io } from "socket.io-client";

const ChatContainer = () => {
	const { chatType } = useParams();
	const navigate = useNavigate();
	const toast = useToast();
	const { user, isLoading } = useAuth();
	const [socket, setSocket] = useState(null);
	const [messages, setMessages] = useState([]);
	const [activeUsers, setActiveUsers] = useState([]);
	const [currentChat, setCurrentChat] = useState(null);
	const [chats, setChats] = useState([]);

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
		if (!user) return;

		const socketIo = io(import.meta.env.VITE_API_URL, {
			withCredentials: true,
			auth: {
				token: localStorage.getItem("token"),
			},
		});

		socketIo.on("connect", () => {
			console.log("Socket connected");
		});

		socketIo.on("chat:list", (chatsList) => {
			console.log("Received chats:", chatsList);
			// Filter chats based on chat type
			const filteredChats = chatsList.filter((chat) => {
				if (chatType === "private") {
					return chat.chatType === "PRIVATE";
				} else {
					return chat.chatType === "PUBLIC";
				}
			});
			setChats(filteredChats);

			// Select first chat if available
			if (filteredChats.length > 0 && !currentChat) {
				handleSelectChat(filteredChats[0]);
			}
		});

		socketIo.on("chat:message", (message) => {
			console.log("Received message:", message);
			setMessages((prev) => [...prev, message]);
		});

		socketIo.on("chat:userJoined", (userData) => {
			toast({
				title: "User joined",
				description: `User ${userData.userId} joined the chat`,
				status: "info",
				duration: 2000,
				isClosable: true,
			});
		});

		socketIo.on("chat:userLeft", (userData) => {
			toast({
				title: "User left",
				description: `User ${userData.userId} left the chat`,
				status: "info",
				duration: 2000,
				isClosable: true,
			});
		});

		socketIo.on("chat:typing", ({ userId, isTyping }) => {
			// Handle typing indicators
			console.log(`User ${userId} is ${isTyping ? "typing" : "not typing"}`);
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
		});

		setSocket(socketIo);

		return () => {
			if (socketIo) {
				console.log("Disconnecting socket");
				socketIo.disconnect();
			}
		};
	}, [user, chatType, toast]);

	const handleSelectChat = (chat) => {
		// Leave current chat if any
		if (currentChat && socket) {
			socket.emit("chat:leave", currentChat._id);
		}

		setCurrentChat(chat);
		setMessages([]);

		// Join new chat
		if (socket && chat) {
			socket.emit("chat:join", chat._id);
		}
	};

	const handleSendMessage = (content) => {
		if (!socket || !currentChat) return;

		socket.emit("chat:message", {
			chatId: currentChat._id,
			content,
		});
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

	return (
		<Flex height="calc(100vh - 80px)" overflow="hidden">
			<ChatSidebar
				chats={chats}
				currentChat={currentChat}
				onSelectChat={handleSelectChat}
				chatType={chatType}
			/>

			<Flex direction="column" flex="1" overflow="hidden">
				{currentChat ? (
					<>
						<Box
							bg="gray.700"
							p={4}
							borderBottom="1px solid"
							borderColor="gray.600">
							<Heading size="md">{currentChat.name}</Heading>
							<Text fontSize="sm" color="gray.400">
								{currentChat.description}
							</Text>
						</Box>

						<MessageList messages={messages} currentUser={user} />

						<MessageInput onSendMessage={handleSendMessage} />
					</>
				) : (
					<Flex justify="center" align="center" flex="1">
						<Text color="gray.500">
							{chats.length > 0
								? "Select a chat to start messaging"
								: `No ${chatType} chats available`}
						</Text>
					</Flex>
				)}
			</Flex>
		</Flex>
	);
};

export default ChatContainer;
