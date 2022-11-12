import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { validateAccess } from '../middlewares';

export const handlerWrapper =
	<TReq, TRes>(
		handler: (req: ServerUnaryCall<TReq, TRes>, callback: sendUnaryData<TRes>, wrappers: object) => void,
		wrappers?: object,
		validationRequired = true,
	) =>
	(req: ServerUnaryCall<TReq, TRes>, callback: sendUnaryData<TRes>) => {
		if (validationRequired) validateAccess(req);
		handler(req, callback, wrappers ?? {});
	};
