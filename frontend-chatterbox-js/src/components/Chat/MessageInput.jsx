import { useState, useEffect } from "react";
import {
	Box,
	Button,
	Flex,
	Input,
	Text,
	useColorModeValue,
} from "@chakra-ui/react";
import { ArrowRightIcon } from "@chakra-ui/icons";

const MessageInput = ({ onSendMessage, socket, currentChatId }) => {
	const [message, setMessage] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [typingUsers, setTypingUsers] = useState([]);

	useEffect(() => {
		if (!socket) return;

		// Listen for typing events from other users
		socket.on("chat:typing", ({ userId, username, isTyping }) => {
			if (isTyping) {
				setTypingUsers((prev) => [
					...prev.filter((user) => user.userId !== userId),
					{ userId, username },
				]);
			} else {
				setTypingUsers((prev) => prev.filter((user) => user.userId !== userId));
			}
		});

		return () => {
			socket.off("chat:typing");
		};
	}, [socket]);

	// Debounce typing indicator to avoid spamming
	useEffect(() => {
		let typingTimeout;

		if (isTyping && socket && currentChatId) {
			socket.emit("chat:typing", {
				chatId: currentChatId,
				isTyping: true,
			});

			// Auto-reset typing status after 2 seconds of inactivity
			typingTimeout = setTimeout(() => {
				setIsTyping(false);
				socket.emit("chat:typing", {
					chatId: currentChatId,
					isTyping: false,
				});
			}, 2000);
		}

		return () => {
			if (typingTimeout) clearTimeout(typingTimeout);
		};
	}, [isTyping, message, socket, currentChatId]);

	const handleInputChange = (e) => {
		setMessage(e.target.value);

		// Set typing indicator
		if (!isTyping && e.target.value) {
			setIsTyping(true);
		} else if (isTyping && !e.target.value) {
			setIsTyping(false);
			if (socket && currentChatId) {
				socket.emit("chat:typing", {
					chatId: currentChatId,
					isTyping: false,
				});
			}
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!message.trim()) return;

		onSendMessage(message.trim());
		setMessage("");
		setIsTyping(false);

		if (socket && currentChatId) {
			socket.emit("chat:typing", {
				chatId: currentChatId,
				isTyping: false,
			});
		}
	};

	return (
		<Box>
			{typingUsers.length > 0 && (
				<Box px={4} py={1} fontSize="sm" color="gray.400" fontStyle="italic">
					{typingUsers.length === 1
						? `${typingUsers[0].username || "Someone"} is typing...`
						: `${typingUsers.length} people are typing...`}
				</Box>
			)}

			<Box
				bg={useColorModeValue("gray.100", "gray.800")}
				p={4}
				borderTop="1px solid"
				borderColor={useColorModeValue("gray.200", "gray.700")}>
				<form onSubmit={handleSubmit}>
					<Flex>
						<Input
							value={message}
							onChange={handleInputChange}
							placeholder="Type a message..."
							size="md"
							bg={useColorModeValue("white", "gray.700")}
							borderRadius="md"
							mr={2}
							autoComplete="off"
						/>
						<Button
							type="submit"
							colorScheme="blue"
							rightIcon={<ArrowRightIcon />}
							isDisabled={!message.trim()}>
							Send
						</Button>
					</Flex>
				</form>
			</Box>
		</Box>
	);
};

export default MessageInput;
