import { Outlet, useNavigate } from "react-router-dom";
import { Box, Flex, Button, Text, useToast } from "@chakra-ui/react";
import useAuth from "../hooks/useAuth";
import { logout } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";

const AppContainer = () => {
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();
	const toast = useToast();
	const queryClient = useQueryClient();

	const handleLogout = async () => {
		try {
			await logout();
			queryClient.clear();
			navigate("/login");
			toast({
				title: "Logged out",
				status: "success",
				duration: 2000,
			});
		} catch (error) {
			toast({
				title: "Error logging out",
				description: error.message,
				status: "error",
				duration: 3000,
			});
		}
	};

	return (
		<Box minH="100vh" bg="gray.900" color="white">
			<Flex
				as="header"
				bg="gray.800"
				px={4}
				py={3}
				justifyContent="space-between"
				alignItems="center"
				borderBottom="1px solid"
				borderColor="gray.700">
				<Text
					fontWeight="bold"
					fontSize="xl"
					cursor="pointer"
					onClick={() => navigate("/")}>
					Chatterbox
				</Text>

				<Flex alignItems="center">
					{!isLoading &&
						(user ? (
							<Flex alignItems="center">
								<Text
									mr={4}
									fontSize="sm"
									color="gray.300"
									cursor="pointer"
									onClick={() => navigate("/profile")}>
									{user.email} ({user.role})
								</Text>
								<Button variant="outline" size="sm" onClick={handleLogout}>
									Logout
								</Button>
							</Flex>
						) : (
							<Flex>
								<Button
									variant="ghost"
									size="sm"
									mr={2}
									onClick={() => navigate("/login")}>
									Login
								</Button>
								<Button
									colorScheme="blue"
									size="sm"
									onClick={() => navigate("/register")}>
									Register
								</Button>
							</Flex>
						))}
				</Flex>
			</Flex>

			<Box as="main">
				<Outlet />
			</Box>
		</Box>
	);
};

export default AppContainer;
