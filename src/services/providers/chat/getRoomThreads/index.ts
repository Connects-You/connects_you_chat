import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/auth';
import { GetRoomThreadsRequest, GetRoomThreadsResponse } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { MessageModel } from '../../../../models/messages.model';
import { errorCallback } from '../../../../utils';

export const getRoomThreads = async (
	req: ServerUnaryCall<GetRoomThreadsRequest, GetRoomThreadsResponse>,
	callback: sendUnaryData<GetRoomThreadsResponse>,
) => {
	try {
		const { roomId, limit = 10, offset = 0 } = req.request;

		if (!roomId) throw new BadRequestError({ error: 'roomId is required' });

		const roomObjectId = MongoObjectId(roomId);

		if (!roomObjectId) throw new BadRequestError({ error: 'roomId is invalid' });

		const messagesHavingThreads = await MessageModel.find({ roomId: roomObjectId, haveThreadId: { $exists: true } })
			.limit(limit)
			.skip(offset)
			.lean()
			.exec();

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
			data: {
				threads: messagesHavingThreads.map((message) => ({
					threadId: message.haveThreadId!.toString(),
					roomId: message.roomId.toString(),
					messageId: message._id.toString(),
				})),
			},
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
