import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { validateAccess } from '../middlewares';

import { errorCallback } from './errorCallback';

export const handlerWrapper =
	<TReq extends object, TRes extends object>(
		handler: (request: TReq, wrappers?: object) => Promise<TRes>,
		wrappers?: object,
		validationRequired = true,
	) =>
	async (req: ServerUnaryCall<TReq, TRes>, callback: sendUnaryData<TRes>) => {
		// eslint-disable-next-line no-console
		console.log('Service path->>', req.getPath());
		try {
			if (validationRequired) validateAccess(req.metadata);
			const response = await handler(req.request, wrappers);
			callback(null, response);
		} catch (error) {
			errorCallback(callback, error);
		}
	};
