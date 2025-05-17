import { useMutation } from "@tanstack/react-query";
import { deleteSession } from "../lib/api";

const useDeleteSession = (sessionId) => {
	const { mutate, ...rest } = useMutation({
		mutationFn: () => deleteSession(sessionId),
	});

	return { deleteSession: mutate, ...rest };
};

export default useDeleteSession;
