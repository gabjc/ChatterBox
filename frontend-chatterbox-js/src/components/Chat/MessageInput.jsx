import { useState, useEffect, useRef } from "react";
import {
	Box,
	Button,
	Flex,
	Input,
	Text,
	useColorModeValue,
} from "@chakra-ui/react";
import { ArrowRightIcon } from "@chakra-ui/icons";

const MessageInput = ({
	onSendMessage,
	onTypingStatus,
	typingUsers = [],
	isConnected,
}) => {
	const [message, setMessage] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const typingTimeoutRef = useRef(null);

	// Reset typing status when component unmounts
	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
			// Ensure typing status is set to false when component unmounts
			if (isTyping) {
				onTypingStatus(false);
			}
		};
	}, [isTyping, onTypingStatus]);

	// Handle typing indicator with debounce
	useEffect(() => {
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		if (message.trim()) {
			// If user is typing and has content, send typing status
			if (!isTyping) {
				setIsTyping(true);
				onTypingStatus(true);
			}

			// Auto-reset typing status after 2 seconds of inactivity
			typingTimeoutRef.current = setTimeout(() => {
				setIsTyping(false);
				onTypingStatus(false);
			}, 2000);
		} else if (isTyping) {
			// If user cleared message, stop typing indicator
			setIsTyping(false);
			onTypingStatus(false);
		}
	}, [message, isTyping, onTypingStatus]);

	const handleInputChange = (e) => {
		setMessage(e.target.value);
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!message.trim()) return;

		onSendMessage(message.trim());
		setMessage("");

		// Reset typing status after sending message
		setIsTyping(false);
		onTypingStatus(false);
	};

	return (
		<Box>
			{/* Typing indicator display */}
			{typingUsers.length > 0 && (
				<Box px={4} py={1} fontSize="sm" color="gray.400" fontStyle="italic">
					{typingUsers.length === 1
						? `${typingUsers[0].username || "Someone"} is typing...`
						: `${typingUsers.length} people are typing...`}
				</Box>
			)}

			{/* Message input form */}
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
							placeholder={
								isConnected ? "Type a message..." : "Disconnected..."
							}
							size="md"
							bg={useColorModeValue("white", "gray.700")}
							borderRadius="md"
							mr={2}
							autoComplete="off"
							isDisabled={!isConnected}
						/>
						<Button
							type="submit"
							colorScheme="blue"
							rightIcon={<ArrowRightIcon />}
							isDisabled={!isConnected || !message.trim()}>
							Send
						</Button>
					</Flex>
				</form>
			</Box>
		</Box>
	);
};

export default MessageInput;
