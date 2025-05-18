// Simple script to test WebSocket connection and functionality
const socketIo = require("socket.io-client");

// Configuration
const SERVER_URL = "http://localhost:5000"; // Change this to your server URL
const ACCESS_TOKEN = "YOUR_ACCESS_TOKEN_HERE"; // Replace with a valid access token

// Connect to WebSocket server
const socket = socketIo(SERVER_URL, {
	auth: {
		token: ACCESS_TOKEN,
	},
	withCredentials: true,
	transports: ["websocket"],
});

// Connection events
socket.on("connect", () => {
	console.log("Connected to WebSocket server!");
	console.log("Socket ID:", socket.id);

	// Join a chat after connecting
	// Replace with an actual chat ID from your database
	const testChatId = "YOUR_CHAT_ID_HERE";
	socket.emit("chat:join", testChatId);

	// Send a test message after 2 seconds
	setTimeout(() => {
		console.log("Sending test message...");
		socket.emit("chat:message", {
			chatId: testChatId,
			content: "Hello, this is a test message from the WebSocket client!",
		});
	}, 2000);
});

// Listen for chat messages
socket.on("chat:message", (message) => {
	console.log("Received message:", message);
});

// Listen for chat errors
socket.on("chat:error", (error) => {
	console.error("Chat error:", error);
});

// Listen for messages history when joining a chat
socket.on("chat:messages", (messages) => {
	console.log("Received message history:", messages);
});

// Listen for user joined/left events
socket.on("chat:userJoined", (data) => {
	console.log("User joined:", data);
});

socket.on("chat:userLeft", (data) => {
	console.log("User left:", data);
});

// Connection error handling
socket.on("connect_error", (error) => {
	console.error("Connection error:", error.message);
});

socket.on("disconnect", (reason) => {
	console.log("Disconnected:", reason);
});

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("Disconnecting from WebSocket server...");
	socket.disconnect();
	process.exit(0);
});

console.log("WebSocket client started. Press Ctrl+C to exit.");
