import { NavLink } from "react-router";

function NavBar() {
	return (
		<div className="card">
			<button>
				<NavLink to="/home" end>
					Home
				</NavLink>
			</button>
		</div>
	);
}

export default NavBar;
