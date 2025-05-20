import { useEffect, useRef } from "react";
import { Box, Flex, Text, Avatar, Badge, Divider } from "@chakra-ui/react";

const MessageList = ({ messages, currentUser }) => {
	const messagesEndRef = useRef(null);

	// Auto-scroll to bottom when new messages arrive
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Helper function to format timestamps
	const formatTime = (timestamp) => {
		try {
			const date = new Date(timestamp);
			return date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch (error) {
			return "Unknown time";
		}
	};

	// Get a color for a user based on their ID to have consistent colors
	const getUserColor = (userId) => {
		if (!userId) return "gray.400";

		// Simple hash function to generate a color from a string
		const colors = [
			"red.400",
			"green.400",
			"blue.400",
			"yellow.400",
			"purple.400",
			"pink.400",
			"teal.400",
			"orange.400",
		];

		let hash = 0;
		for (let i = 0; i < userId.length; i++) {
			hash = (hash + userId.charCodeAt(i)) % colors.length;
		}

		return colors[hash];
	};

	// Group messages by date for better visual organization
	const getMessageDate = (timestamp) => {
		try {
			const date = new Date(timestamp);
			return date.toDateString();
		} catch (error) {
			return "";
		}
	};

	return (
		<Box
			flex="1"
			overflowY="auto"
			p={4}
			bg="gray.900"
			id="message-list"
			css={{
				"&::-webkit-scrollbar": {
					width: "8px",
				},
				"&::-webkit-scrollbar-track": {
					background: "#2D3748", // gray.700
				},
				"&::-webkit-scrollbar-thumb": {
					background: "#4A5568", // gray.600
					borderRadius: "4px",
				},
			}}>
			{messages.length === 0 ? (
				<Flex justify="center" align="center" height="100%">
					<Text color="gray.500">
						No messages yet. Be the first to send one!
					</Text>
				</Flex>
			) : (
				<>
					{messages.map((message, index) => {
						const isCurrentUser = message.userId?._id === currentUser?._id;
						const userColor = getUserColor(message.userId?._id);
						const username = message.userId?.email || "Unknown User";
						const displayName = username.split("@")[0]; // Extract name from email
						const role = message.userId?.role || "";

						// Add date separator when day changes
						const shouldShowDate =
							index === 0 ||
							getMessageDate(message.createdAt) !==
								getMessageDate(messages[index - 1].createdAt);

						return (
							<Box key={`${message._id || index}`}>
								{shouldShowDate && (
									<Flex justify="center" mb={4} mt={index > 0 ? 6 : 0}>
										<Badge px={2} py={1} borderRadius="md" colorScheme="gray">
											{new Date(message.createdAt).toLocaleDateString()}
										</Badge>
									</Flex>
								)}

								<Flex
									justify={isCurrentUser ? "flex-end" : "flex-start"}
									mb={3}
									mt={4}>
									{!isCurrentUser && (
										<Avatar
											size="sm"
											name={displayName}
											bg={userColor}
											color="white"
											mr={2}
										/>
									)}

									<Box
										maxWidth="70%"
										bg={isCurrentUser ? "blue.500" : "gray.700"}
										color="white"
										p={3}
										borderRadius="lg"
										position="relative">
										{!isCurrentUser && (
											<Text
												fontSize="sm"
												fontWeight="bold"
												color={userColor}
												mb={1}>
												{displayName}
												{role && (
													<Badge
														ml={1}
														size="sm"
														colorScheme={
															role === "SUPER"
																? "red"
																: role === "ADMIN"
																? "purple"
																: "blue"
														}>
														{role}
													</Badge>
												)}
											</Text>
										)}
										<Text wordBreak="break-word">{message.content}</Text>
										<Text
											fontSize="xs"
											color="gray.400"
											mt={1}
											textAlign="right">
											{formatTime(message.createdAt)}
										</Text>
									</Box>

									{isCurrentUser && (
										<Avatar
											size="sm"
											name={displayName}
											bg="blue.500"
											color="white"
											ml={2}
										/>
									)}
								</Flex>
							</Box>
						);
					})}
					<div ref={messagesEndRef} />
				</>
			)}
		</Box>
	);
};

export default MessageList;
