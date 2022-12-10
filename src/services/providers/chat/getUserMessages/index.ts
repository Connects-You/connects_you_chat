import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/auth';
import { GetUserMessagesRequest } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MessageModel } from '../../../../models/messages.model';
import { RoomModel } from '../../../../models/rooms.model';
import { prepareResponseForMessages } from '../_helper';

export const getUserMessages = async (request: GetUserMessagesRequest) => {
	const { userId, limit, offset } = request; // add only group, only duet;

	if (!userId) throw new BadRequestError({ error: 'userId is required' });

	const userObjectId = MongoObjectId(userId);

	if (!userObjectId) throw new BadRequestError({ error: 'userId is invalid' });

	const userRooms = await RoomModel.find({ 'roomUsers.userId': userObjectId }).lean().exec();

	const messages = await MessageModel.find(
		{
			roomId: { $in: userRooms.map((room) => room._id) },
		},
		undefined,
		{ limit, skip: offset },
	)
		.lean()
		.exec();

	return {
		status: ResponseStatusEnum.SUCCESS,
		data: prepareResponseForMessages(messages),
	};
};
