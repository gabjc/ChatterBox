import mongoose from "mongoose";

export interface MessageDocument extends mongoose.Document {
	chatId: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	isRead: boolean;
}

const messageSchema = new mongoose.Schema<MessageDocument>(
	{
		chatId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chat",
			required: true,
			index: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		content: { type: String, required: true },
		isRead: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

messageSchema.index({ chatId: 1, createdAt: -1 });

const MessageModel = mongoose.model<MessageDocument>("Message", messageSchema);
export default MessageModel;
