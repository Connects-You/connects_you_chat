import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/auth';
import { GetUserMessagesRequest, GetUserMessagesResponse } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { MessageModel } from '../../../../models/messages.model';
import { RoomModel } from '../../../../models/rooms.model';
import { errorCallback } from '../../../../utils';
import { prepareResponseForMessages } from '../_helper';

export const getUserMessages = async (
	req: ServerUnaryCall<GetUserMessagesRequest, GetUserMessagesResponse>,
	callback: sendUnaryData<GetUserMessagesResponse>,
) => {
	try {
		const { userId, limit = 10, offset = 0 } = req.request; // add only group, only duet;

		if (!userId) throw new BadRequestError({ error: 'userId is required' });

		const userObjectId = MongoObjectId(userId);

		if (!userObjectId) throw new BadRequestError({ error: 'userId is invalid' });

		const userRooms = await RoomModel.find({ 'roomUsers.userId': userObjectId }).lean().exec();

		const messages = await MessageModel.find({
			roomId: { $in: userRooms.map((room) => room._id) },
		})
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
