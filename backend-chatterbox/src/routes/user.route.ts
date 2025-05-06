import { Router } from "express";
import { getUserHandler } from "../controllers/user.controller";

const userRoutes = Router();

//prefix: /auth

userRoutes.get("/", getUserHandler);

export default userRoutes;
