import { useNavigate } from "react-router-dom";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import useAuth from "../../hooks/useAuth";
import Roles from "../../constants/roles";

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

const ChatHeader = ({ chatType }) => {
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
				<Button
					leftIcon={<ChevronLeftIcon />}
					variant="ghost"
					size="sm"
					onClick={() => navigate("/")}>
					Back to Home
				</Button>

				<Heading size="sm" textTransform="capitalize">
					{currentChat.name}
				</Heading>

				{/* Chat Switch Button - only show if user can access both */}
				{canAccessPrivate && (
					<Button
						size="sm"
						colorScheme={chatType === "private" ? "blue" : "purple"}
						onClick={() =>
							handleChatSwitch(chatType === "public" ? "private" : "public")
						}>
						Switch to {chatType === "public" ? "Private" : "Public"} Chat
					</Button>
				)}
			</Flex>
		</Box>
	);
};

export default ChatHeader;
