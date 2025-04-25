import { useState } from "react";

function Login() {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>ChatterBox</h1>
			<div className="card">
				<p>LOGIN</p>
			</div>
		</>
	);
}

export default Login;
