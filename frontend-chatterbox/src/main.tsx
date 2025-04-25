import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Routes, Route } from "react-router";

import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Home from "./pages/Home.tsx";
import User from "./pages/User.tsx";
import PublicChat from "./pages/PublicCHat.tsx";
import PrivateChat from "./pages/PrivateChat.tsx";
import Perms from "./pages/Perms.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<App />} />

				<Route path="login" element={<Login />} />
				<Route path="register" element={<Register />} />

				<Route path="home" element={<Home />}>
					<Route path="user/:userId" element={<User />} />
				</Route>

				<Route path="chat">
					<Route path="public" element={<PublicChat />} />
					<Route path="private" element={<PrivateChat />}>
						<Route path="perms" element={<Perms />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	</StrictMode>
);
