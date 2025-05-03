import mongoose from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";
import Roles from "../constants/roles";

export interface UserDocument extends mongoose.Document {
	email: string;
	password: string;
	verified: boolean;
	role: string;
	createdAt: Date;
	updatedAt: Date;
	comparePassword(val: string): Promise<boolean>;
	omitPassword(): Pick<
		UserDocument,
		"_id" | "email" | "verified" | "createdAt" | "updatedAt"
	>;
}

const userSchema = new mongoose.Schema<UserDocument>(
	{
		email: { type: String, unique: true, required: true },
		password: { type: String, required: true },
		verified: { type: Boolean, required: true, default: false },
		role: { type: String, required: true },
	},
	{
		timestamps: true,
	}
);

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	this.password = await hashValue(this.password);
	next();
});

userSchema.methods.comparePassword = async function (val: string) {
	return compareValue(val, this.password);
};

userSchema.methods.omitPassword = function () {
	const user = this.toObject();
	delete user.password;
	return user;
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
