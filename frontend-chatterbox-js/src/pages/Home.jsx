import { useNavigate } from "react-router-dom";
import { Box, Button, Heading, VStack, Text, useToast } from "@chakra-ui/react";
import useAuth from "../hooks/useAuth";
import Roles from "../constants/roles";

const Home = () => {
	const navigate = useNavigate();
	const toast = useToast();
	const { user, isLoading } = useAuth();

	const handleChatButtonClick = (chatType) => {
		if (chatType === "private" && user?.role === Roles.USER) {
			toast({
				title: "Access denied",
				description: "You don't have permission to access private chats",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}
		navigate(`/chat/${chatType}`);
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

	return (
		<Box textAlign="center" py={10} px={6}>
			<Heading as="h1" size="xl" mb={6}>
				Welcome to Chatterbox
			</Heading>
			<Text fontSize="lg" mb={8}>
				Select a chat room to start messaging
			</Text>

			<VStack spacing={4} width="100%" maxWidth="300px" mx="auto">
				<Button
					colorScheme="blue"
					size="lg"
					width="100%"
					onClick={() => handleChatButtonClick("public")}>
					Public Chat
				</Button>

				<Button
					colorScheme="purple"
					size="lg"
					width="100%"
					onClick={() => handleChatButtonClick("private")}
					isDisabled={user?.role === Roles.USER}>
					Private Chat
					{user?.role === Roles.USER && " (Requires Admin access)"}
				</Button>
			</VStack>
		</Box>
	);
};

export default Home;
