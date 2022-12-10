import { CreateMessageThreadRequest, ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId, mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MessageModel } from '../../../../models/messages.model';

export const createMessageThread = async (request: CreateMessageThreadRequest) => {
	const { messageId } = request;

	if (!messageId) throw new BadRequestError({ error: 'messageId are required' });

	const messageObjectId = MongoObjectId(messageId);

	if (!messageObjectId) throw new BadRequestError({ error: 'Invalid request. Please provide valid messageId' });

	const threadId = new mongoose.Types.ObjectId();

	const updateResponse = await MessageModel.updateOne(
		{
			_id: messageObjectId,
			$or: [{ belongsToThreadId: { $exists: false } }, { belongsToThreadId: null }],
		},
		{
			$set: {
				haveThreadId: threadId,
			},
		},
	)
		.lean()
		.exec();

	if (updateResponse.modifiedCount === 0)
		throw new BadRequestError({ error: 'Invalid request. Please provide valid messageId' });

	return {
		status: ResponseStatusEnum.SUCCESS,
	};
};
