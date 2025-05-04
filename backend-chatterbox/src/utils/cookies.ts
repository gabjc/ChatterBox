import { CookieOptions, Response } from "express";
import { fifteenMinuetsFromNow, thirtyDaysFromNow } from "./date";
import { OK } from "../constants/http";
const secure = process.env.NODE_ENV !== "development";
export const REFRESH_PATH = "/auth/refresh";

const defaults: CookieOptions = {
	sameSite: "strict",
	httpOnly: true,
	secure,
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
	...defaults,
	expires: fifteenMinuetsFromNow(),
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
	...defaults,
	expires: thirtyDaysFromNow(),
	path: REFRESH_PATH,
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

export const clearAuthcookies = (res: Response) =>
	res.clearCookie("accessToken").clearCookie("refreshToken", {
		path: REFRESH_PATH,
	});
