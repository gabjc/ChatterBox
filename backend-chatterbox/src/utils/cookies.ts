import { CookieOptions, Response } from "express";
import { fifteenMinuetsFromNow, thirtyDaysFromNow } from "./date";
import { OK } from "../constants/http";
const secure = process.env.NODE_ENV !== "development";

const defaults: CookieOptions = {
	sameSite: "strict",
	httpOnly: true,
	secure,
};

const getAccessTokenCookieOptions = (): CookieOptions => ({
	...defaults,
	expires: fifteenMinuetsFromNow(),
});

const getRefreshTokenCookieOptions = (): CookieOptions => ({
	...defaults,
	expires: thirtyDaysFromNow(),
	path: "/auth/refresh",
});

type Params = {
	res: Response;
	accessToken: string;
	refreshToken: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
	res
		.cookie("accessToken", accessToken, getAccessTokenCookieOptions())
		.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
