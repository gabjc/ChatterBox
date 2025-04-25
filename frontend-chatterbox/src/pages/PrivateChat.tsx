import { useState } from "react";

function PrivateChat() {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>ChatterBox</h1>
			<div className="card">
				<p>Private</p>
			</div>
		</>
	);
}

export default PrivateChat;
