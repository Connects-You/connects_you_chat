import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/auth';
import { GetRoomMessagesRequest, GetRoomMessagesResponse } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { MessageModel } from '../../../../models/messages.model';
import { errorCallback } from '../../../../utils';
import { prepareResponseForMessages } from '../_helper';

export const getRoomMessages = async (
	req: ServerUnaryCall<GetRoomMessagesRequest, GetRoomMessagesResponse>,
	callback: sendUnaryData<GetRoomMessagesResponse>,
) => {
	try {
		const { roomId, limit = 10, offset = 0 } = req.request;

		if (!roomId) throw new BadRequestError({ error: 'roomId is required' });

		const roomObjectId = MongoObjectId(roomId);

		if (!roomObjectId) throw new BadRequestError({ error: 'Invalid request. Please provide valid roomId' });

		const messages = await MessageModel.find({ roomId: roomObjectId, isDeleted: false })
			.limit(limit)
			.skip(offset)
			.lean()
			.exec();

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
			data: prepareResponseForMessages(messages),
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
