import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import { CONFLICT, UNAUTHORIZED } from "../constants/http";
import Roles from "../constants/roles";
import VerificationCodeType from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAssert";
import { oneYearFromNow } from "../utils/date";
import jwt from "jsonwebtoken";
import { refreshTokenSignOptions, signToken } from "../utils/jwt";

export type CreateAccountParams = {
	email: string;
	password: string;
	userAgent?: string;
};

export const createAccount = async (data: CreateAccountParams) => {
	// Verify existing user doesnt exist
	const existingUser = await UserModel.exists({
		email: data.email,
	});

	appAssert(!existingUser, CONFLICT, "Email already in use");
	// Create user
	const user = await UserModel.create({
		email: data.email,
		password: data.password,
		role: Roles.SUPER,
	});

	const userId = user._id;
	const userRole = user.role;

	// Create verification code
	const verificationCode = await VerificationCodeModel.create({
		userId: userId,
		type: VerificationCodeType.EmailVerification,
		expiresAt: oneYearFromNow(),
	});

	// Send verification email

	// create session
	const session = await SessionModel.create({
		userId: userId,
		userAgent: data.userAgent,
	});

	// sign access token & refresh token
	const refreshToken = signToken(
		{
			sessionId: session._id,
			role: userRole,
		},
		refreshTokenSignOptions
	);

	const accessToken = signToken({
		userId: userId,
		sessionId: session._id,
		role: userRole,
	});
	// return user & tokens
	return {
		user: user.omitPassword(),
		accessToken,
		refreshToken,
	};
};

export type LoginParams = {
	email: string;
	password: string;
	userAgent?: string;
};

export const loginUser = async ({
	email,
	password,
	userAgent,
}: LoginParams) => {
	// get user by email and verify they exist
	const user = await UserModel.findOne({ email });
	appAssert(user, UNAUTHORIZED, "Invalid email or password");

	// validate password from request
	const isValid = await user.comparePassword(password);
	appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

	// create a session
	const userId = user._id;
	const userRole = user.role;
	const session = await SessionModel.create({ userId, userAgent });

	const sessionInfo = {
		sessionId: session._id,
	};

	// sign access token & refresh token
	const refreshToken = signToken(
		{
			sessionId: session._id,
			role: userRole,
		},
		refreshTokenSignOptions
	);

	const accessToken = signToken({
		...sessionInfo,
		userId: user._id,
		role: userRole,
	});

	// return user & tokens
	return {
		user: user.omitPassword(),
		accessToken,
		refreshToken,
	};
};
