import API from "../config/apiClient";
// Auth-related functions
export const login = async (data) => API.post("/auth/login", data);
export const logout = async () => API.get("/auth/logout");
export const register = async (data) => {
	API.post("auth/register", data);
};
export const verifyEmail = async (verificationCode) =>
	API.get(`/auth/email/verify/${verificationCode}`);
export const sendPasswordResetEmail = async (email) =>
	API.get(`/auth/password/forgot`, { email });
export const resetPassword = async ({ verificationCode, password }) =>
	API.post("/auth/password/reset", { verificationCode, password });
export const getUser = async () => API.get("/user");
export const getSessions = async () => API.get("/sessions");
export const deleteSession = async (id) => API.delete(`/sessions/${id}`);

// Chat-related functions
export const getChats = async () => API.get("/chats");
export const getChatById = async (chatId) => API.get(`/chats/${chatId}`);
export const getChatMessages = async (chatId, limit = 50, before) => {
	const params = { limit };
	if (before) params.before = before;
	return API.get(`/chats/${chatId}/messages`, { params });
};

export const createChat = async (chatData) => API.post("/chats", chatData);
export const updateChat = async (chatId, chatData) =>
	API.put(`/chats/${chatId}`, chatData);
export const deleteChat = async (chatId) => API.delete(`/chats/${chatId}`);

export const addChatMember = async (chatId, userId) =>
	API.post(`/chats/${chatId}/members`, { userId });
export const removeChatMember = async (chatId, userId) =>
	API.delete(`/chats/${chatId}/members`, { data: { userId } });

export const updateUserRole = async (userId, role) =>
	API.put(`/user/${userId}/role`, { role });
