import { useEffect, useRef } from "react";
import { Box, Flex, Text, Avatar, Badge } from "@chakra-ui/react";

const MessageList = ({ messages, currentUser }) => {
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Helper function to format timestamps
	const formatTime = (timestamp) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
					<Text color="gray.500">No messages yet</Text>
				</Flex>
			) : (
				<>
					{messages.map((message, index) => {
						const isCurrentUser = message.userId?._id === currentUser?._id;
						const userColor = getUserColor(message.userId?._id);
						const username = message.userId?.email || "Unknown User";
						const displayName = username.split("@")[0]; // Extract name from email

						// Add date separator when day changes
						const shouldShowDate =
							index === 0 ||
							new Date(message.createdAt).toDateString() !==
								new Date(messages[index - 1].createdAt).toDateString();

						return (
							<Box key={index}>
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
												{message.userId?.role && (
													<Text as="span" fontSize="xs" ml={1} color="gray.400">
														({message.userId.role})
													</Text>
												)}
											</Text>
										)}
										<Text>{message.content}</Text>
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
