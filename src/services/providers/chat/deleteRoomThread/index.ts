import { DeleteRoomThreadRequest, DeleteRoomThreadResponse } from '@adarsh-mishra/connects_you_services/services/chat';
import { NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { MessageModel } from '../../../../models/messages.model';
import { errorCallback } from '../../../../utils';

export const deleteRoomThread = async (
	req: ServerUnaryCall<DeleteRoomThreadRequest, DeleteRoomThreadResponse>,
	callback: sendUnaryData<DeleteRoomThreadResponse>,
) => {
	try {
		const { messageId, threadId } = req.request;

		if (!messageId || !threadId) throw new Error('messageId and threadId are required');

		const messageObjectId = MongoObjectId(messageId);
		const threadObjectId = MongoObjectId(threadId);

		if (!messageObjectId || !threadObjectId)
			throw new Error('Invalid request. Please provide valid messageId and threadId');

		const updateResponse1 = await MessageModel.updateOne(
			{ _id: messageObjectId, haveThreadId: threadObjectId },
			{ $set: { haveThreadId: null } },
		)
			.lean()
			.exec();

		if (updateResponse1.modifiedCount !== 0)
			await MessageModel.updateMany({ belongsToThreadId: threadObjectId }, { $set: { isDeleted: true } })
				.lean()
				.exec();
		else {
			throw new NotFoundError({ error: 'Unable to delete thread' });
		}
	} catch (error) {
		return errorCallback(callback, error);
	}
};
