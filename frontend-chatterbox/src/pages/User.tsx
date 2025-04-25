import { useState } from "react";

function User() {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>ChatterBox</h1>
			<div className="card">
				<p>User </p>
			</div>
		</>
	);
}

export default User;
