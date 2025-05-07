import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";
import { NODE_ENV } from "../constants/env";
import mongoose from "mongoose";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, UNAUTHORIZED } from "../constants/http";
import { verifyToken } from "../utils/jwt";
import ChatModel from "../models/chat.model";
import UserModel from "../models/user.model";
import MessageModel from "../models/message.model";

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
			// Join user rooms
			await this.joinUserRooms(socket);

			// Handle chat messages
			socket.on("chat:message", async (data) => {
				try {
					const { chatId, content } = data;

					const canAccess = await this.verifyUserChatAccess(
						socket.userId!,
						chatId
					);

					if (!canAccess) {
						socket.emit("chat:error", "You do not have access to this chat");
						return;
					}

					// Send message to the database
					const message = await MessageModel.create({
						chatId,
						userId: socket.userId,
						content,
						createdAt: new Date(),
					});

					// Populate the message with user information
					const populatedMessage = await MessageModel.findById(
						message._id
					).populate("userId", "email");

					// Emit the message to the chat room
					this.io.to(chatId).emit("chat:message", populatedMessage);
				} catch (error) {
					console.error("Error handling chat message:", error);
					socket.emit("chat:error", "Failed to send message");
				}
			});

			// Handle user typing indicator
			socket.on("chat:typing", (data) => {
				const { chatId, isTyping } = data;

				socket
					.to(chatId)
					.emit("chat:typing", { userId: socket.userId, isTyping });
			});

			// Handle user leaving chat
			socket.on("chat:leave", (chatId) => {
				socket.to(chatId).emit("chat:userLeft", chatId);
			});

			// Handle user joining specific chat
			socket.on("chat:join", async (chatId) => {
				try {
					const canAccess = await this.verifyUserChatAccess(
						socket.userId!,
						chatId
					);
					appAssert(
						canAccess,
						UNAUTHORIZED,
						"You do not have access to this chat"
					);
					socket.join(chatId);

					const messages = await MessageModel.find({ chatId })
						.sort({ createdAt: -1 })
						.limit(50)
						.populate("userId", "email")
						.populate("userId", "email")
						.exec();

					socket.emit("chat:messages", messages.reverse());
				} catch (error) {
					console.error("Error joining chat:", error);
					socket.emit("chat:error", "Failed to join chat");
				}
			});

			socket.on("disconnect", () => {
				console.log(`User disconnected: ${socket.userId}`);
			});
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

	private async verifyUserChatAccess(
		userId: mongoose.Types.ObjectId,
		chatId: string
	): Promise<boolean> {
		try {
			const chat = await ChatModel.findById(chatId);
			appAssert(chat, NOT_FOUND, "Chat not found");

			const user = await UserModel.findById(userId);
			appAssert(user, NOT_FOUND, "User not found");

			const isMember = chat.members.some((member) => member.equals(userId));
			const hasRoleAccess = chat.allowedRoles.includes(user.role);

			return isMember || hasRoleAccess;
		} catch (error) {
			console.error("Access verification error:", error);
			return false;
		}
	}
}

export default WebSocketServer;
