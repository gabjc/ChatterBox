import { useNavigate } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AppContainer from "./components/AppContainer";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { setNavigate } from "./lib/navigation";
import Home from "./pages/Home";

function App() {
	// set the navigate function on our API client for use in the axios error interceptor
	// this allows us to redirect to the login page when an auth error occurs
	const navigate = useNavigate();
	setNavigate(navigate);
	return (
		<Routes>
			{/* <Route path="/" element={<Home />} /> */}

			<Route path="/" element={<AppContainer />}>
				<Route index element={<Home />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="settings" element={<Settings />} />

				{/* <Route path="/chat/:chatType" element={<ChatContainer />} /> */}
			</Route>

			<Route path="login" element={<Login />} />
			<Route path="register" element={<Register />} />
			<Route path="/email/verify/:code" element={<VerifyEmail />} />
			<Route path="/password/forgot" element={<ForgotPassword />} />
			<Route path="/password/rest" element={<ResetPassword />} />

			{/* <Route path="user/:userId" element={<User />} />
			</Route>

			<Route path="chat">
				<Route path="public" element={<PublicChat />} />
				<Route path="private" element={<PrivateChat />}>
					<Route path="perms" element={<Perms />} />
				</Route>
			</Route>  */}
		</Routes>
	);
}

export default App;
