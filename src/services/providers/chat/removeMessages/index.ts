import {
	RemoveMessagesRequest,
	RemoveMessagesResponse,
	ResponseStatusEnum,
} from '@adarsh-mishra/connects_you_services/services/chat';
import { isEmptyArray } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { createSessionTransaction, MongoObjectId, mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { MessageModel } from '../../../../models/messages.model';
import { errorCallback } from '../../../../utils';

export const removeMessages = async (
	req: ServerUnaryCall<RemoveMessagesRequest, RemoveMessagesResponse>,
	callback: sendUnaryData<RemoveMessagesResponse>,
) => {
	try {
		const { messageIds } = req.request;

		if (!messageIds || isEmptyArray(messageIds)) throw new BadRequestError({ error: 'Missing required fields' });

		const messageObjectIds: Array<mongoose.Types.ObjectId> = [];

		messageIds.forEach((messageId) => {
			const messageObjectId = MongoObjectId(messageId);
			if (messageObjectId) messageObjectIds.push(messageObjectId);
		});

		if (messageObjectIds.length !== messageIds.length) throw new BadRequestError({ error: 'Invalid ids' });

		await createSessionTransaction(async (session) => {
			const updateResponse = await MessageModel.updateMany(
				{
					_id: { $in: messageObjectIds },
				},
				{
					$set: {
						isDeleted: true,
					},
				},

				{ session },
			)
				.lean()
				.exec();

			if (updateResponse.modifiedCount !== messageObjectIds.length) {
				throw new Error('Error deleting messages');
			} else {
				await session.commitTransaction();
			}
		});

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
