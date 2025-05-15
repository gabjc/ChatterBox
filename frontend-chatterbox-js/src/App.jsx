import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { NavLink } from "react-router-dom";
import { Routes, Route } from "react-router-dom";

function App() {
	return (
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
	);
}

export default App;
