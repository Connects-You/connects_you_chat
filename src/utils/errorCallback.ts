import { InternalServerError, ResponseError } from '@adarsh-mishra/node-utils/httpResponses';
import { ServerErrorResponse, StatusObject } from '@grpc/grpc-js';

export const errorCallback = (
	callback: (error: ServerErrorResponse | Partial<StatusObject> | null) => void,
	error: ResponseError<unknown>,
) => {
	if (error instanceof ResponseError) {
		callback({
			message: error.message,
			name: error.name,
			code: error.statusCode,
			stack: error.stack,
			details: error.error?.toString(),
		});
	} else {
		const internalError = new InternalServerError({ error: JSON.stringify(error) });
		callback({
			message: internalError.message,
			name: internalError.name,
			code: internalError.statusCode,
			stack: internalError.stack,
			details: error,
		});
	}
};
