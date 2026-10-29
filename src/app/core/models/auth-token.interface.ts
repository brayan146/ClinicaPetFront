export interface AuthToken {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: string;
}
