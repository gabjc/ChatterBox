import { useEffect, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

const MessageList = ({ messages, currentUser }) => {
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

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

						return (
							<Flex
								key={index}
								justify={isCurrentUser ? "flex-end" : "flex-start"}
								mb={3}>
								<Box
									maxWidth="70%"
									bg={isCurrentUser ? "blue.500" : "gray.700"}
									color="white"
									p={3}
									borderRadius="lg"
									position="relative">
									{!isCurrentUser && (
										<Text
											fontSize="xs"
											fontWeight="bold"
											color="blue.300"
											mb={1}>
											{message.userId?.email || "Unknown User"}
											{message.userId?.role && (
												<Text as="span" fontSize="xs" ml={1} color="gray.400">
													({message.userId.role})
												</Text>
											)}
										</Text>
									)}
									<Text>{message.content}</Text>
									<Text fontSize="xs" color="gray.400" mt={1} textAlign="right">
										{new Date(message.createdAt).toLocaleTimeString()}
									</Text>
								</Box>
							</Flex>
						);
					})}
					<div ref={messagesEndRef} />
				</>
			)}
		</Box>
	);
};

export default MessageList;
