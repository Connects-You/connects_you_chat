import { UnauthorizedError } from '@adarsh-mishra/node-utils/httpResponses';
import { Metadata } from '@grpc/grpc-js';

export const validateAccess = (metadata: Metadata) => {
	const apiKey = metadata.get('api-key')[0];
	if (apiKey !== process.env.API_KEY) throw new UnauthorizedError({ error: 'Invalid API key' });
};
