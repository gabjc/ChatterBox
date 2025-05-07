import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";
import { NODE_ENV } from "../constants/env";
import mongoose from "mongoose";
import appAssert from "../utils/appAssert";
import { UNAUTHORIZED } from "../constants/http";
import { verifyToken } from "../utils/jwt";
import ChatModel from "../models/chat.model";

interface SocketWithAuth extends Socket {
	userId?: mongoose.Types.ObjectId;
	role?: string;
}

export class WebSocketServer {
	private io: SocketIOServer;

	constructor(server: http.Server) {
		this.io = new SocketIOServer(server, {
			cors: {
				origin: NODE_ENV,
				credentials: true,
			},
		});
		this.initialize();
	}

	private initialize() {
		this.io.use(async (socket: SocketWithAuth, next) => {
			try {
				const token = socket.handshake.auth.token;
				appAssert(token, UNAUTHORIZED, "Authentication required");

				const { payload, error } = verifyToken(token);
				appAssert(payload, UNAUTHORIZED, "Invalid token");

				socket.userId = payload.userId as mongoose.Types.ObjectId;
				socket.role = payload.role;

				return next();
			} catch (error) {
				return next(new Error("Authentication error"));
			}
		});

		this.setUpConnectionHandlers();
	}

	private setUpConnectionHandlers() {
		this.io.on("connection", async (socket: SocketWithAuth) => {
			console.log(`User connected: ${socket.userId}`);
			await this.joinUserRooms(socket);
		});
	}

	private async joinUserRooms(socket: SocketWithAuth) {
		try {
			if (!socket.userId) {
				return;
			}

			const chats = await ChatModel.find({
				$or: [{ members: socket.userId }, { allowedRoles: socket.role }],
			});

			chats.forEach((chat) => {
				socket.join((chat._id as mongoose.Types.ObjectId).toString());
				console.log(`User ${socket.userId} joined room ${chat._id}`);
			});

			socket.emit("chat:list", chats);
		} catch (error) {
			console.error("Error joining user rooms:", error);
		}
	}
}

export default WebSocketServer;
