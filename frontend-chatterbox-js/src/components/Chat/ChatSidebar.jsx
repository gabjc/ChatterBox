import { useNavigate } from "react-router-dom";
import {
	Box,
	Button,
	Flex,
	Heading,
	List,
	ListItem,
	Text,
	VStack,
} from "@chakra-ui/react";
import { ChevronLeftIcon } from "@chakra-ui/icons";

const ChatSidebar = ({ chats, currentChat, onSelectChat, chatType }) => {
	const navigate = useNavigate();

	return (
		<Box
			width="250px"
			bg="gray.800"
			borderRight="1px solid"
			borderColor="gray.700"
			height="100%"
			overflow="auto">
			<Flex direction="column" height="100%">
				<Flex
					align="center"
					p={4}
					borderBottom="1px solid"
					borderColor="gray.700">
					<Button
						leftIcon={<ChevronLeftIcon />}
						variant="ghost"
						size="sm"
						onClick={() => navigate("/")}>
						Back
					</Button>
					<Heading size="sm" ml={2} textTransform="capitalize">
						{chatType} Chats
					</Heading>
				</Flex>

				{chats.length > 0 ? (
					<List spacing={0} flex="1" overflow="auto">
						{chats.map((chat) => (
							<ListItem
								key={chat._id}
								bg={currentChat?._id === chat._id ? "blue.700" : "transparent"}
								_hover={{
									bg: currentChat?._id === chat._id ? "blue.700" : "gray.700",
								}}
								cursor="pointer"
								onClick={() => onSelectChat(chat)}
								transition="background 0.2s">
								<Box p={3} borderBottom="1px solid" borderColor="gray.700">
									<Text fontWeight="bold" noOfLines={1}>
										{chat.name}
									</Text>
									<Text fontSize="xs" color="gray.400" noOfLines={1}>
										{chat.description || "No description"}
									</Text>
								</Box>
							</ListItem>
						))}
					</List>
				) : (
					<VStack flex="1" justify="center" p={4}>
						<Text color="gray.500" textAlign="center">
							No {chatType} chats available
						</Text>
					</VStack>
				)}
			</Flex>
		</Box>
	);
};

export default ChatSidebar;
