import { useState } from "react";
import { Box, Button, Flex, Input, useColorModeValue } from "@chakra-ui/react";
import { ArrowRightIcon } from "@chakra-ui/icons";

const MessageInput = ({ onSendMessage }) => {
	const [message, setMessage] = useState("");
	const [isTyping, setIsTyping] = useState(false);

	const handleInputChange = (e) => {
		setMessage(e.target.value);

		// Could add typing indicator logic here
		if (!isTyping && e.target.value) {
			setIsTyping(true);
			// socket.emit("chat:typing", { isTyping: true });
		} else if (isTyping && !e.target.value) {
			setIsTyping(false);
			// socket.emit("chat:typing", { isTyping: false });
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (!message.trim()) return;

		onSendMessage(message.trim());
		setMessage("");
		setIsTyping(false);
		// socket.emit("chat:typing", { isTyping: false });
	};

	return (
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
	);
};

export default MessageInput;
