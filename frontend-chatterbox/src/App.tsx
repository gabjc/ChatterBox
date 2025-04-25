import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { NavLink } from "react-router";

function App() {
	return (
		<>
			<h1>ChatterBox</h1>
			<div className="card" style={{ display: "flex", gap: "16px" }}>
				<button>
					<NavLink to="/login" end>
						Sign in
					</NavLink>
				</button>
				<button>
					<NavLink to="/register" end>
						Register
					</NavLink>
				</button>
			</div>
		</>
	);
}

export default App;
