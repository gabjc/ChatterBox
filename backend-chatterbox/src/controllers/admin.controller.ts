import { FORBIDDEN, NOT_FOUND, OK } from "../constants/http";
import Roles from "../constants/roles";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";

export const getAllUsersHandler = catchErrors(async (req, res) => {
	const adminUser = await UserModel.findById(req.userId);
	appAssert(adminUser, NOT_FOUND, "Admin user not found");

	appAssert(
		adminUser.role === Roles.ADMIN || adminUser.role === Roles.SUPER,
		FORBIDDEN,
		"Admin or super user permissions required"
	);

	const users = await UserModel.find({}, { password: 0 }).sort({
		createdAt: -1,
	});

	return res.status(OK).json(users);
});

export const getUserDetailsHandler = catchErrors(async (req, res) => {
	const adminUser = await UserModel.findById(req.userId);
	appAssert(adminUser, NOT_FOUND, "Admin user not found");

	appAssert(
		adminUser.role === Roles.ADMIN || adminUser.role === Roles.SUPER,
		FORBIDDEN,
		"Admin or super user permissions required"
	);

	const targetUserId = req.params.userId;
	const user = await UserModel.findById(targetUserId);
	appAssert(user, NOT_FOUND, "User not found");

	return res.status(OK).json(user.omitPassword());
});
