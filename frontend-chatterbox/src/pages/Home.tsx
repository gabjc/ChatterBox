import { useState } from "react";

function Home() {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>ChatterBox</h1>
			<div className="card">
				<p>Home</p>
			</div>
		</>
	);
}

export default Home;
