import {
	BAD_REQUEST,
	FORBIDDEN,
	NOT_FOUND,
	UNAUTHORIZED,
} from "../constants/http";
import AppError from "./AppError";

export class BadRequestError extends AppError {
	constructor(message: string) {
		super(BAD_REQUEST, message);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string) {
		super(UNAUTHORIZED, message);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string) {
		super(FORBIDDEN, message);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string) {
		super(NOT_FOUND, message);
	}
}
