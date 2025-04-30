export type CreateAccountParams = {
	email: string;
	password: string;
	userAgent?: string;
};

export const createAccount = async (data: CreateAccountParams) => {
	// Verify existing user doesnt exist
	// Create user
	// Create verification code
	// Send verification emial
	// create session
	// sign access token & refresh token
	// return user & tokens
};
