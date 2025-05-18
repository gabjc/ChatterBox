import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";
import { APP_ORIGIN, NODE_ENV } from "../constants/env";
import mongoose from "mongoose";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, UNAUTHORIZED } from "../constants/http";
import { verifyToken } from "../utils/jwt";
import ChatModel, { ChatType } from "../models/chat.model";
import UserModel from "../models/user.model";
import MessageModel from "../models/message.model";
import Roles from "../constants/roles";

interface SocketWithAuth extends Socket {
	userId?: mongoose.Types.ObjectId;
	role?: string;
}

export class WebSocketServer {
	private io: SocketIOServer;

	constructor(server: http.Server) {
		this.io = new SocketIOServer(server, {
			cors: {
				origin: APP_ORIGIN,
				credentials: true,
				methods: ["GET", "POST"],
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

				const user = await UserModel.findById(payload.userId);
				appAssert(user, NOT_FOUND, "User not found");
				socket.role = user.role;

				return next();
			} catch (error) {
				return next(new Error("Authentication error"));
			}
		});

		this.setUpConnectionHandlers();
	}

	private setUpConnectionHandlers() {
		this.io.on("connection", async (socket: SocketWithAuth) => {
			console.log(`User connected: ${socket.userId}, Role: ${socket.role}`);

			// Join user rooms
			await this.joinUserRooms(socket);

			// Handle chat messages
			socket.on("chat:message", async (data) => {
				try {
					const { chatId, content } = data;

					const canAccess = await this.verifyUserChatAccess(
						socket.userId!,
						chatId,
						socket.role!
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
					).populate("userId", "email role");

					// Emit the message to the chat room
					this.io.to(chatId).emit("chat:message", populatedMessage);

					// Update chat's updatedAt time
					await ChatModel.findByIdAndUpdate(chatId, { updatedAt: new Date() });
				} catch (error) {
					console.error("Error handling chat message:", error);
					socket.emit("chat:error", "Failed to send message");
				}
			});

			// Handle user typing indicator
			socket.on("chat:typing", async (data) => {
				const { chatId, isTyping } = data;

				// Verify access before broadcasting typing status
				const canAccess = await this.verifyUserChatAccess(
					socket.userId!,
					chatId,
					socket.role!
				);

				if (!canAccess) {
					socket.emit("chat:error", "You do not have access to this chat");
					return;
				}

				socket
					.to(chatId)
					.emit("chat:typing", { userId: socket.userId, isTyping });
			});

			// Handle user joining specific chat
			socket.on("chat:join", async (chatId) => {
				try {
					const canAccess = await this.verifyUserChatAccess(
						socket.userId!,
						chatId,
						socket.role!
					);

					if (!canAccess) {
						socket.emit("chat:error", "You do not have access to this chat");
						return;
					}

					socket.join(chatId);

					const messages = await MessageModel.find({ chatId })
						.sort({ createdAt: -1 })
						.limit(50)
						.populate("userId", "email role")
						.exec();

					socket.emit("chat:messages", messages.reverse());

					// Broadcast user joined event to other users in chat
					socket.to(chatId).emit("chat:userJoined", {
						userId: socket.userId,
						timestamp: new Date(),
					});
				} catch (error) {
					console.error("Error joining chat:", error);
					socket.emit("chat:error", "Failed to join chat");
				}
			});

			// Handle user leaving chat
			socket.on("chat:leave", async (chatId) => {
				socket.leave(chatId);
				socket.to(chatId).emit("chat:userLeft", {
					userId: socket.userId,
					timestamp: new Date(),
				});
			});

			socket.on("disconnect", () => {
				console.log(`User disconnected: ${socket.userId}`);
			});
		});
	}

	private async joinUserRooms(socket: SocketWithAuth) {
		try {
			if (!socket.userId || !socket.role) {
				return;
			}

			const query: any = { $or: [{ members: socket.userId }] };

			// Add role-based criteria
			if (socket.role === Roles.USER) {
				query.$or.push({
					chatType: ChatType.PUBLIC,
					allowedRoles: socket.role,
				});
			} else if (socket.role === Roles.ADMIN || socket.role === Roles.SUPER) {
				query.$or.push({
					allowedRoles: socket.role,
				});
			}

			const chats = await ChatModel.find(query);

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
		chatId: string,
		userRole: string
	): Promise<boolean> {
		try {
			const chat = await ChatModel.findById(chatId);
			if (!chat) {
				return false;
			}

			const isMember = chat.members.some((member) => member.equals(userId));
			if (isMember) {
				return true;
			}

			// Check role-based access
			if (chat.allowedRoles && chat.allowedRoles.length > 0) {
				if (chat.chatType === ChatType.PRIVATE) {
					return userRole === Roles.ADMIN || userRole === Roles.SUPER;
				}

				return chat.allowedRoles.includes(userRole);
			}

			return chat.chatType === ChatType.PUBLIC;
		} catch (error) {
			console.error("Access verification error:", error);
			return false;
		}
	}
}

export default WebSocketServer;
