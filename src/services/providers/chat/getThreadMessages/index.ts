import {
	GetThreadMessagesRequest,
	GetThreadMessagesResponse,
} from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { MessageModel } from '../../../../models/messages.model';
import { errorCallback } from '../../../../utils';
import { prepareResponseForMessages } from '../_helper';

export const getThreadMessages = async (
	req: ServerUnaryCall<GetThreadMessagesRequest, GetThreadMessagesResponse>,
	callback: sendUnaryData<GetThreadMessagesResponse>,
) => {
	try {
		const { threadId, limit = 10, offset = 0 } = req.request;

		if (!threadId) throw new BadRequestError({ error: 'threadId is required' });

		const threadObjectId = MongoObjectId(threadId);

		if (!threadObjectId) throw new BadRequestError({ error: 'threadId is invalid' });

		const messages = await MessageModel.find({ belongsToThreadId: threadObjectId })
			.limit(limit)
			.skip(offset)
			.lean()
			.exec();

		return callback(null, {
			status: 'SUCCESS',
			data: prepareResponseForMessages(messages),
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
