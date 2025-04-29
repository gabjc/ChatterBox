import "dotenv/config";
import express from "express";
import connectToDatabase from "./config/db";
import cors from "cors";
import { APP_ORIGIN, PORT } from "./constants/env";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import catchErrors from "./utils/catchErrors";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cors({
		origin: APP_ORIGIN,
		credentials: true,
	})
);

app.use(cookieParser());

app.get("/", (req, res, next) => {
	throw new Error("THIS IS AN TEST ERROR");
	res.status(200).json({
		status: "healthy",
	});
});

app.use(errorHandler);

app.listen(4004, async () => {
	console.log(`Server is listening on port ${PORT}`);

	await connectToDatabase();
});
