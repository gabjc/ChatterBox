import { NOT_FOUND, OK } from "../constants/http";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";

export const getUserHandler = catchErrors(async (req, res) => {
	// again index.d.ts is not being detected by ts so we will ignore it
	//@ts-ignore
	const user = await UserModel.findById(req.userId);
	appAssert(user, NOT_FOUND, "User not found");
	return res.status(OK).json(user.omitPassword());
});
