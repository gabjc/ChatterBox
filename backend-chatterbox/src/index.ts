import "dotenv/config";
import http from "http";
import app from "./app";
import connectToDatabase from "./config/db";
import { PORT } from "./constants/env";
import WebSocketServer from "./websocket/websocket";

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Start the server
server.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	console.log(`WebSocket server initialized`);

	// Connect to database
	await connectToDatabase();
});
