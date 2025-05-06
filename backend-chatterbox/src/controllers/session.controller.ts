import { z } from "zod";
import { NOT_FOUND, OK } from "../constants/http";
import SessionModel from "../models/session.model";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";

export const getSessionsHandler = catchErrors(async (req, res) => {
	const sessions = await SessionModel.find(
		{
			// once again index.d.ts is not being detected by ts so we will ignore it
			// @ts-ignore
			userId: req.userId,
			expiresAt: { $gt: new Date() },
		},
		{
			_id: 1,
			userAgent: 1,
			createdAt: 1,
		},
		{
			sort: { createdAt: -1 },
		}
	);
	return res.status(OK).json(
		sessions.map((session) => ({
			...session.toObject(),
			// once again index.d.ts is not being detected by ts so we will ignore it
			// @ts-ignore
			...(session.id === req.sessionId && {
				isCurrent: true,
			}),
		}))
	);
});

export const deleteSessionsHandler = catchErrors(async (req, res) => {
	const sessionId = z.string().parse(req.params.id);
	const deleted = await SessionModel.findOneAndDelete({
		_id: sessionId,
		// once again index.d.ts is not being detected by ts so we will ignore it
		// @ts-ignore
		userId: req.userId,
	});
	appAssert(deleted, NOT_FOUND, "Session not found");

	return res.status(OK).json({
		message: "Session deleted successfully",
	});
});
