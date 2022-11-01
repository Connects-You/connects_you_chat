import { UnauthorizedError } from '@adarsh-mishra/node-utils/httpResponses';
import { ServerUnaryCall } from '@grpc/grpc-js';

export const validateAccess = (req: ServerUnaryCall<unknown, unknown>) => {
	const apiKey = req.metadata.get('api-key')[0];
	if (apiKey !== process.env.API_KEY) throw new UnauthorizedError({ error: 'Invalid API key' });
};
