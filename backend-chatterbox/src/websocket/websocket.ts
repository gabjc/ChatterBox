import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";
import { APP_ORIGIN } from "../constants/env";
import mongoose from "mongoose";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, UNAUTHORIZED } from "../constants/http";
import { verifyToken } from "../utils/jwt";
import UserModel from "../models/user.model";
import MessageModel from "../models/message.model";
import Roles from "../constants/roles";
import { STATIC_CHAT_IDS } from "../utils/initializeStaticChats";

interface SocketWithAuth extends Socket {
	userId?: mongoose.Types.ObjectId;
	role?: string;
	user?: {
		email: string;
		role: string;
	};
}

export class WebSocketServer {
	private io: SocketIOServer;
	private userSockets: Map<string, SocketWithAuth> = new Map();

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
				socket.user = {
					email: user.email,
					role: user.role,
				};

				return next();
			} catch (error) {
				return next(new Error("Authentication error"));
			}
		});

		this.setUpConnectionHandlers();
	}

	private async getActiveUsers(chatId: string): Promise<any[]> {
		const activeUsers: any = [];

		this.userSockets.forEach((socket) => {
			// Check if the socket is in the given chat room
			if (socket.rooms.has(chatId)) {
				activeUsers.push({
					userId: socket.userId,
					email: socket.user?.email,
					role: socket.user?.role,
				});
			}
		});

		return activeUsers;
	}

	private setUpConnectionHandlers() {
		this.io.on("connection", async (socket: SocketWithAuth) => {
			console.log(`User connected: ${socket.userId}, Role: ${socket.role}`);

			// Store user socket for active users tracking
			this.userSockets.set(socket.id, socket);

			// Determine which chats this user can access
			const accessibleChats = [];

			// Everyone can access the public chat
			accessibleChats.push(STATIC_CHAT_IDS.PUBLIC);

			// Only ADMIN and SUPER can access the private chat
			if (socket.role === Roles.ADMIN || socket.role === Roles.SUPER) {
				accessibleChats.push(STATIC_CHAT_IDS.PRIVATE);
			}

			// Emit the list of accessible chats to the user
			socket.emit("chat:list", accessibleChats);

			// Handle chat messages
			socket.on("chat:message", async (data) => {
				try {
					const { chatId, content } = data;

					// Validate the chat ID is one of our static chats
					if (
						chatId !== STATIC_CHAT_IDS.PUBLIC &&
						chatId !== STATIC_CHAT_IDS.PRIVATE
					) {
						socket.emit("chat:error", "Invalid chat ID");
						return;
					}

					// Ensure user has access to this chat
					const canAccess =
						chatId === STATIC_CHAT_IDS.PUBLIC ||
						(chatId === STATIC_CHAT_IDS.PRIVATE &&
							(socket.role === Roles.ADMIN || socket.role === Roles.SUPER));

					if (!canAccess) {
						socket.emit("chat:error", "You do not have access to this chat");
						return;
					}

					// Create and save the message
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
				} catch (error) {
					console.error("Error handling chat message:", error);
					socket.emit("chat:error", "Failed to send message");
				}
			});

			// Handle user typing indicator
			socket.on("chat:typing", async (data) => {
				const { chatId, isTyping } = data;

				// Validate the chat ID is one of our static chats
				if (
					chatId !== STATIC_CHAT_IDS.PUBLIC &&
					chatId !== STATIC_CHAT_IDS.PRIVATE
				) {
					return;
				}

				// Ensure user has access to this chat
				const canAccess =
					chatId === STATIC_CHAT_IDS.PUBLIC ||
					(chatId === STATIC_CHAT_IDS.PRIVATE &&
						(socket.role === Roles.ADMIN || socket.role === Roles.SUPER));

				if (!canAccess) {
					return;
				}

				socket.to(chatId).emit("chat:typing", {
					userId: socket.userId,
					username: socket.user?.email,
					isTyping,
				});
			});

			// Handle user joining specific chat
			socket.on("chat:join", async (chatId) => {
				try {
					// Validate the chat ID is one of our static chats
					if (
						chatId !== STATIC_CHAT_IDS.PUBLIC &&
						chatId !== STATIC_CHAT_IDS.PRIVATE
					) {
						socket.emit("chat:error", "Invalid chat ID");
						return;
					}

					// Check if user can access this chat
					const canAccess =
						chatId === STATIC_CHAT_IDS.PUBLIC ||
						(chatId === STATIC_CHAT_IDS.PRIVATE &&
							(socket.role === Roles.ADMIN || socket.role === Roles.SUPER));

					if (!canAccess) {
						socket.emit("chat:error", "You do not have access to this chat");
						return;
					}

					// Join the chat room
					socket.join(chatId);

					// Get recent messages
					const messages = await MessageModel.find({ chatId })
						.sort({ createdAt: -1 })
						.limit(50)
						.populate("userId", "email role")
						.exec();

					// Send message history to the user
					socket.emit("chat:messages", messages.reverse());

					// Get active users and send to the user
					const activeUsers = await this.getActiveUsers(chatId);
					this.io.to(chatId).emit("chat:activeUsers", activeUsers);

					// Broadcast user joined event to other users in chat
					socket.to(chatId).emit("chat:userJoined", {
						userId: socket.userId,
						email: socket.user?.email,
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
					email: socket.user?.email,
					timestamp: new Date(),
				});

				// Update active users
				const activeUsers = await this.getActiveUsers(chatId);
				this.io.to(chatId).emit("chat:activeUsers", activeUsers);
			});

			socket.on("disconnect", () => {
				console.log(`User disconnected: ${socket.userId}`);

				// Remove from tracking and update active users in each room
				this.userSockets.delete(socket.id);

				// Notify both chat rooms that the user has left
				[STATIC_CHAT_IDS.PUBLIC, STATIC_CHAT_IDS.PRIVATE].forEach(
					async (chatId) => {
						if (socket.rooms?.has(chatId)) {
							this.io.to(chatId).emit("chat:userLeft", {
								userId: socket.userId,
								email: socket.user?.email,
								timestamp: new Date(),
							});

							// Update active users
							const activeUsers = await this.getActiveUsers(chatId);
							this.io.to(chatId).emit("chat:activeUsers", activeUsers);
						}
					}
				);
			});
		});
	}
}

export default WebSocketServer;
