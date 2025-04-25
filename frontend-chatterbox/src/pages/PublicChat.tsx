import { useState } from "react";

function PublicChat() {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>ChatterBox</h1>
			<div className="card">
				<p>Public</p>
			</div>
		</>
	);
}

export default PublicChat;
