import { useNavigate } from "react-router-dom";
import { Box, Button, Flex, Heading, Text, Badge } from "@chakra-ui/react";
import { ChevronLeftIcon, LockIcon, UnlockIcon } from "@chakra-ui/icons";
import useAuth from "../../hooks/useAuth";
import Roles from "../../constants/roles";

// Match the static chat IDs from the backend
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

const ChatHeader = ({ chatType, activeUsers = 0, isConnected = false }) => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const currentChat = STATIC_CHATS[chatType];

	// Check if user can access both chats
	const canAccessPrivate =
		user && (user.role === Roles.ADMIN || user.role === Roles.SUPER);

	const handleChatSwitch = (newChatType) => {
		if (newChatType === "private" && !canAccessPrivate) return;
		navigate(`/chat/${newChatType}`);
	};

	if (!currentChat) return null;

	return (
		<Box
			width="100%"
			bg="gray.800"
			borderBottom="1px solid"
			borderColor="gray.700"
			p={4}>
			<Flex justifyContent="space-between" alignItems="center">
				{/* Back button */}
				<Button
					leftIcon={<ChevronLeftIcon />}
					variant="ghost"
					size="sm"
					onClick={() => navigate("/")}>
					Back to Home
				</Button>

				{/* Chat title and info */}
				<Flex direction="column" alignItems="center">
					<Flex alignItems="center">
						{chatType === "private" ? (
							<LockIcon color="purple.300" mr={2} />
						) : (
							<UnlockIcon color="green.300" mr={2} />
						)}
						<Heading size="sm" textTransform="capitalize">
							{currentChat.name}
						</Heading>
					</Flex>

					{/* Connection status */}
					<Flex mt={1} alignItems="center">
						<Badge
							colorScheme={isConnected ? "green" : "red"}
							variant="subtle"
							size="sm"
							mr={2}>
							{isConnected ? "Connected" : "Disconnected"}
						</Badge>
						{isConnected && activeUsers > 0 && (
							<Text fontSize="xs" color="gray.400">
								{activeUsers} {activeUsers === 1 ? "user" : "users"} online
							</Text>
						)}
					</Flex>
				</Flex>

				{/* Chat Switch Button - only show if user can access both */}
				{canAccessPrivate && (
					<Button
						size="sm"
						colorScheme={chatType === "private" ? "purple" : "blue"}
						onClick={() =>
							handleChatSwitch(chatType === "public" ? "private" : "public")
						}
						leftIcon={chatType === "public" ? <LockIcon /> : <UnlockIcon />}>
						Switch to {chatType === "public" ? "Private" : "Public"} Chat
					</Button>
				)}
			</Flex>
		</Box>
	);
};

export default ChatHeader;
