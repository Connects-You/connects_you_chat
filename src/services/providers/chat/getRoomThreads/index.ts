import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/auth';
import { GetRoomThreadsRequest } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MessageModel } from '../../../../models/messages.model';

export const getRoomThreads = async (request: GetRoomThreadsRequest) => {
	const { roomId, limit, offset } = request;

	if (!roomId) throw new BadRequestError({ error: 'roomId is required' });

	const roomObjectId = MongoObjectId(roomId);

	if (!roomObjectId) throw new BadRequestError({ error: 'roomId is invalid' });

	const messagesHavingThreads = await MessageModel.find(
		{ roomId: roomObjectId, haveThreadId: { $exists: true } },
		undefined,
		{ limit, skip: offset },
	)
		.lean()
		.exec();

	return {
		status: ResponseStatusEnum.SUCCESS,
		data: {
			threads: messagesHavingThreads.map((message) => ({
				threadId: message.haveThreadId!.toString(),
				roomId: message.roomId.toString(),
				messageId: message._id.toString(),
			})),
		},
	};
};
