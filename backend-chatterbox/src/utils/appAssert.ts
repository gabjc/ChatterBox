import assert from "node:assert";
import AppError from "./AppError";
import { HttpStatusCode } from "../constants/http";
import AppErrorCode from "../constants/appErrorCode";

type AppAssert = (
	condition: any,
	httpStatusCode: HttpStatusCode,
	message: string,
	appErrorCode?: AppErrorCode
) => asserts condition;

/***
 *
 * asserts a condition adn throws an AppError if condition is falsy
 */
const appAssert: AppAssert = (
	condition,
	httpStatusCode,
	message,
	appErrorCode
) => assert(condition, new AppError(httpStatusCode, message, appErrorCode));

export default appAssert;
