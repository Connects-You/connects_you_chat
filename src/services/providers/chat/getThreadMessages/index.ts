import { GetThreadMessagesRequest } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MessageModel } from '../../../../models/messages.model';
import { prepareResponseForMessages } from '../_helper';

export const getThreadMessages = async (request: GetThreadMessagesRequest) => {
	const { threadId, limit, offset } = request;

	if (!threadId) throw new BadRequestError({ error: 'threadId is required' });

	const threadObjectId = MongoObjectId(threadId);

	if (!threadObjectId) throw new BadRequestError({ error: 'threadId is invalid' });

	const messages = await MessageModel.find({ belongsToThreadId: threadObjectId }, undefined, {
		limit,
		skip: offset,
	})
		.lean()
		.exec();

	return {
		status: 'SUCCESS',
		data: prepareResponseForMessages(messages),
	};
};
