import { useState } from "react";

function Register() {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>ChatterBox</h1>
			<div className="card">
				<p>REGISTER</p>
			</div>
		</>
	);
}

export default Register;
