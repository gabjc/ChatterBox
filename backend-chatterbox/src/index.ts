import "dotenv/config";
import http from "http";
import app from "./app";
import connectToDatabase from "./config/db";
import { PORT } from "./constants/env";
import WebSocketServer from "./websocket/websocket";
import { initializeStaticChats } from "./utils/initializeStaticChats";

const server = http.createServer(app);
const wsServer = new WebSocketServer(server);

server.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	console.log(`WebSocket server initialized`);

	await connectToDatabase();
	await initializeStaticChats();
});
