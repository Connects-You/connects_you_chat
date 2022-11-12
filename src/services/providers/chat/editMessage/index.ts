import {
	EditMessageRequest,
	EditMessageResponse,
	ResponseStatusEnum,
} from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { MessageModel } from '../../../../models/messages.model';
import { errorCallback } from '../../../../utils';

export const editMessage = async (
	req: ServerUnaryCall<EditMessageRequest, EditMessageResponse>,
	callback: sendUnaryData<EditMessageResponse>,
) => {
	try {
		const { messageId, messageText } = req.request;
		if (!messageId || !messageText) throw new BadRequestError({ error: 'messageId and messageText are required' });

		const messageObjectId = MongoObjectId(messageId);
		if (!messageObjectId) throw new BadRequestError({ error: 'Invalid request. Please provide valid messageId' });

		const updatedResponse = await MessageModel.updateOne(
			{
				_id: messageObjectId,
			},
			{
				$set: {
					messageText,
				},
			},
		)
			.lean()
			.exec();

		if (updatedResponse.modifiedCount === 0) throw new BadRequestError({ error: 'Unable to update message' });

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
