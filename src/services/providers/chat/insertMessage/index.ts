import { InsertMessageRequest, ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MessageModel } from '../../../../models/messages.model';

export const insertMessage = async (request: InsertMessageRequest) => {
	const { messageText, roomId, messageType, senderUserId, receiverUserId, belongsToThreadId } = request;
	if (!messageText || !messageType || !roomId || !senderUserId)
		throw new BadRequestError({ error: 'Missing required fields' });

	const roomObjectId = MongoObjectId(roomId);
	const senderUserObjectId = MongoObjectId(senderUserId);
	const receiverUserObjectId = MongoObjectId(receiverUserId);
	const belongsToThreadObjectId = MongoObjectId(belongsToThreadId);

	if (
		!roomObjectId ||
		!senderUserObjectId ||
		(receiverUserId && !receiverUserObjectId) ||
		(belongsToThreadId && !belongsToThreadObjectId)
	)
		throw new BadRequestError({ error: 'Invalid ids' });

	const messageSendAt = new Date();

	const insertedMessage = await MessageModel.create({
		messageText,
		roomId: roomObjectId,
		messageType,
		senderUserId: senderUserObjectId,
		receiverUserId: receiverUserObjectId,
		belongsToThreadId: belongsToThreadObjectId,
		sendAt: messageSendAt,
		updatedAt: messageSendAt,
	});

	return {
		status: ResponseStatusEnum.SUCCESS,
		data: {
			messageId: insertedMessage._id.toString(),
		},
	};
};
