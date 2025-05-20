// Simple script to test WebSocket connection and functionality
const socketIo = require("socket.io-client");

// Configuration
const SERVER_URL = "http://localhost:5000"; // Change this to your server URL
const ACCESS_TOKEN = "YOUR_ACCESS_TOKEN_HERE"; // Replace with a valid access token

// Select chat type to test (public or private)
const CHAT_ID = "public-chat"; // Change to "private-chat" to test private chat

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

	// Get available chats
	socket.on("chat:list", (chats) => {
		console.log("Available chats:", chats);
	});

	// Join a chat after connecting
	console.log(`Joining chat: ${CHAT_ID}`);
	socket.emit("chat:join", CHAT_ID);

	// Send a test message after 2 seconds
	setTimeout(() => {
		console.log("Sending test message...");
		socket.emit("chat:message", {
			chatId: CHAT_ID,
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
	console.log(`Received message history (${messages.length} messages):`);
	messages.forEach((msg, i) => {
		console.log(`[${i + 1}] ${msg.userId?.email || "Unknown"}: ${msg.content}`);
	});
});

// Listen for active users updates
socket.on("chat:activeUsers", (users) => {
	console.log("Active users:", users);
});

// Listen for user joined/left events
socket.on("chat:userJoined", (data) => {
	console.log("User joined:", data);
});

socket.on("chat:userLeft", (data) => {
	console.log("User left:", data);
});

// Listen for typing events
socket.on("chat:typing", (data) => {
	console.log(
		`${data.username || "Someone"} is ${data.isTyping ? "typing..." : "stopped typing"}`
	);
});

// Send typing indicator when typing
const simulateTyping = () => {
	console.log("Simulating typing...");
	socket.emit("chat:typing", { chatId: CHAT_ID, isTyping: true });

	setTimeout(() => {
		console.log("Simulating stopped typing...");
		socket.emit("chat:typing", { chatId: CHAT_ID, isTyping: false });
	}, 3000);
};

setTimeout(simulateTyping, 5000);

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
	socket.emit("chat:leave", CHAT_ID);
	socket.disconnect();
	process.exit(0);
});

console.log("WebSocket client started. Press Ctrl+C to exit.");
