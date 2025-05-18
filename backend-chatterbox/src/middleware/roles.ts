import { RequestHandler } from "express";
import { FORBIDDEN, NOT_FOUND } from "../constants/http";
import Roles from "../constants/roles";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";

// Check if user is a super user
export const superUserMiddleware: RequestHandler = catchErrors(
	async (req, res, next) => {
		const user = await UserModel.findById(req.userId);
		appAssert(user, NOT_FOUND, "User not found");
		appAssert(
			user.role === Roles.SUPER,
			FORBIDDEN,
			"Super user permissions required"
		);
		next();
	}
);

// Check if user is an admin or super user
export const adminOrSuperMiddleware: RequestHandler = catchErrors(
	async (req, res, next) => {
		const user = await UserModel.findById(req.userId);
		appAssert(user, NOT_FOUND, "User not found");
		appAssert(
			user.role === Roles.ADMIN || user.role === Roles.SUPER,
			FORBIDDEN,
			"Admin or super user permissions required"
		);
		next();
	}
);
