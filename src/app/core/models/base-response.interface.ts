export interface BaseResponse<T = unknown> {
	success: boolean;
	data: T;
	message?: string;
}
