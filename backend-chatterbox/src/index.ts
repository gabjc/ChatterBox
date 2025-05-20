import "dotenv/config";
import http from "http";
import app from "./app";
import connectToDatabase from "./config/db";
import { PORT, APP_ORIGIN } from "./constants/env";
import WebSocketServer from "./websocket/websocket";
import { initializeStaticChats } from "./utils/initializeStaticChats";

const server = http.createServer(app);
const wsServer = new WebSocketServer(server);

server.listen(PORT, async () => {
	console.log(`=================================`);
	console.log(`Server is listening on port ${PORT}`);
	console.log(`WebSocket server initialized`);
	console.log(`CORS origin: ${APP_ORIGIN}`);
	console.log(`=================================`);

	try {
		await connectToDatabase();
		await initializeStaticChats();
	} catch (error) {
		console.error("Error during server initialization:", error);
	}
});

process.on("SIGINT", () => {
	console.log("Shutting down server...");
	server.close(() => {
		console.log("Server shut down successfully");
		process.exit(0);
	});
});
