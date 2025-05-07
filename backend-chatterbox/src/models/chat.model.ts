import mongoose from "mongoose";

export interface ChatDocument extends mongoose.Document {
	name: string;
	description?: string;
	createdBy: mongoose.Types.ObjectId;
	members: mongoose.Types.ObjectId[];
	allowedRoles: string[];
	isPrivate: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const chatSchema = new mongoose.Schema<ChatDocument>(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, trim: true },
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		members: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		allowedRoles: [{ type: String }],
		isPrivate: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

chatSchema.index({ members: 1 });
chatSchema.index({ allowedRoles: 1 });

const ChatModel = mongoose.model<ChatDocument>("Chat", chatSchema);
export default ChatModel;
