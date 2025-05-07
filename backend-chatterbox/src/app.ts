import "dotenv/config";
import express from "express";
import connectToDatabase from "./config/db";
import cors from "cors";
import { APP_ORIGIN, PORT } from "./constants/env";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import catchErrors from "./utils/catchErrors";
import { OK } from "./constants/http";
import authRoutes from "./routes/auth.route";
import authenticate from "./middleware/authenticate";
import userRoutes from "./routes/user.route";
import sessionRoutes from "./routes/session.route";
import { Server } from "socket.io";
import { createServer } from "http";

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
	res.status(OK).json({
		status: "healthy",
	});
});

// auth routes
app.use("/auth", authRoutes);

//protected rotues
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);

app.use(errorHandler);

export default app;

// app.listen(PORT, async () => {
// 	console.log(`Server is listening on port ${PORT}`);

// 	await connectToDatabase();
// });
