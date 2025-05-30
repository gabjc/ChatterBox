import { APP_ORIGIN, JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import {
	CONFLICT,
	INTERNAL_SERVER_ERROR,
	NOT_FOUND,
	TOO_MANY_REQUESTS,
	UNAUTHORIZED,
} from "../constants/http";
import Roles from "../constants/roles";
import VerificationCodeType from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAssert";
import {
	oneYearFromNow,
	ONE_DAY_MS,
	thirtyDaysFromNow,
	fiveMinutesAgo,
	oneHourFromNow,
} from "../utils/date";
import jwt from "jsonwebtoken";
import {
	RefreshTokenPayload,
	refreshTokenSignOptions,
	signToken,
	verifyToken,
} from "../utils/jwt";
import { NOTFOUND } from "dns";
import { sendMail } from "../utils/sendMail";
import {
	getPasswordResetTemplate,
	getVerifyEmailTemplate,
} from "../utils/emailTemplates";
import { hashValue } from "../utils/bcrypt";

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
		role: Roles.USER,
	});

	const userId = user._id;
	const userRole = user.role as Roles;

	// Create verification code
	const verificationCode = await VerificationCodeModel.create({
		userId: userId,
		type: VerificationCodeType.EmailVerification,
		expiresAt: oneYearFromNow(),
	});

	// Send verification email
	const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;
	const { error } = await sendMail({
		to: user.email,
		...getVerifyEmailTemplate(url),
	});
	if (error) {
		console.log(error);
	}

	// create session
	const session = await SessionModel.create({
		userId: userId,
		userAgent: data.userAgent,
	});

	// sign access token & refresh token
	const refreshToken = signToken(
		{
			sessionId: session._id,
		},
		refreshTokenSignOptions
	);

	const accessToken = signToken({
		userId: userId,
		sessionId: session._id,
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
	const userRole = user.role as Roles;
	const session = await SessionModel.create({ userId, userAgent });

	const sessionInfo = {
		sessionId: session._id,
	};

	// sign access token & refresh token
	const refreshToken = signToken(
		{
			sessionId: session._id,
		},
		refreshTokenSignOptions
	);

	const accessToken = signToken({
		...sessionInfo,
		userId: user._id,
	});

	// return user & tokens
	return {
		user: user.omitPassword(),
		accessToken,
		refreshToken,
	};
};

export const refreshUserAccessToken = async (refreshToken: string) => {
	const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
		secret: refreshTokenSignOptions.secret,
	});
	appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

	const session = await SessionModel.findByIdAndDelete(payload.sessionId);
	const now = Date.now();
	appAssert(
		session && session.expiresAt.getTime() > now,
		UNAUTHORIZED,
		"Session expired"
	);

	//refresh session if expires in next 24 hours
	const sessionNeedsRefresh = session.expiresAt.getTime() - now < ONE_DAY_MS;
	if (sessionNeedsRefresh) {
		session.expiresAt = thirtyDaysFromNow();
		await session.save();
	}

	const newRefreshToken = sessionNeedsRefresh
		? signToken(
				{
					sessionId: session._id,
				},
				refreshTokenSignOptions
			)
		: undefined;

	const accessToken = signToken({
		userId: session.userId,
		sessionId: session._id,
	});
	return {
		accessToken,
		newRefreshToken: newRefreshToken,
	};
};

export const verifyEmai = async (code: string) => {
	// get verification code
	const validCode = await VerificationCodeModel.findOne({
		_id: code,
		type: VerificationCodeType.EmailVerification,
		expiresAt: { $gt: new Date() },
	});
	appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

	// update user to verified true, if not found then that means couldnt find user
	const updatedUser = await UserModel.findByIdAndUpdate(
		validCode.userId,
		{
			verified: true,
		},
		{ new: true }
	);
	appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email");

	// delete verification code
	await validCode.deleteOne();

	// return user
	return {
		user: updatedUser.omitPassword(),
	};
};

export const sendPasswordResetEmail = async (email: string) => {
	// Catch any errors that were thrown and log them (but always return a success)
	// This will prevent leaking sensitive data back to the client (e.g. user not found, email not sent).
	try {
		const user = await UserModel.findOne({ email });
		appAssert(user, NOT_FOUND, "User not found");

		// check for max password reset requests (2 emails in 5min)
		const fiveMinAgo = fiveMinutesAgo();
		const count = await VerificationCodeModel.countDocuments({
			userId: user._id,
			type: VerificationCodeType.PasswordReset,
			createdAt: { $gt: fiveMinAgo },
		});
		appAssert(
			count <= 1,
			TOO_MANY_REQUESTS,
			"Too many requests, please try again later"
		);

		const expiresAt = oneHourFromNow();
		const verificationCode = await VerificationCodeModel.create({
			userId: user._id,
			type: VerificationCodeType.PasswordReset,
			expiresAt,
		});

		const url = `${APP_ORIGIN}/password/reset?code=${
			verificationCode._id
		}&exp=${expiresAt.getTime()}`;

		const { data, error } = await sendMail({
			to: email,
			...getPasswordResetTemplate(url),
		});

		appAssert(
			data?.id,
			INTERNAL_SERVER_ERROR,
			`${error?.name} - ${error?.message}`
		);
		return {
			url,
			emailId: data.id,
		};
	} catch (error: any) {
		console.log("SendPasswordResetError:", error.message);
		return {};
	}
};

type resetPasswordParams = {
	password: string;
	verificationCode: string;
};
export const resetPassword = async ({
	password,
	verificationCode,
}: resetPasswordParams) => {
	// get verification code
	const validCode = await VerificationCodeModel.findOne({
		_id: verificationCode,
		type: VerificationCodeType.PasswordReset,
		expiresAt: { $gt: new Date() },
	});
	appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");
	// update the users password
	const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
		password: await hashValue(password),
	});
	appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password");

	// delete the verification code
	await validCode.deleteOne();
	// delete all sessions
	await SessionModel.deleteMany({ userId: validCode.userId });

	return {
		user: updatedUser.omitPassword(),
	};
};
