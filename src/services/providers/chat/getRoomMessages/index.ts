import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/auth';
import { GetRoomMessagesRequest } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MessageModel } from '../../../../models/messages.model';
import { prepareResponseForMessages } from '../_helper';

export const getRoomMessages = async (request: GetRoomMessagesRequest) => {
	const { roomId, limit, offset } = request;

	if (!roomId) throw new BadRequestError({ error: 'roomId is required' });

	const roomObjectId = MongoObjectId(roomId);

	if (!roomObjectId) throw new BadRequestError({ error: 'Invalid request. Please provide valid roomId' });

	const messages = await MessageModel.find({ roomId: roomObjectId, isDeleted: false }, {}, { limit, skip: offset })
		.lean()
		.exec();

	return {
		status: ResponseStatusEnum.SUCCESS,
		data: prepareResponseForMessages(messages),
	};
};
