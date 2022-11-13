import { GetRoomUsersRequest, GetRoomUsersResponse } from '@adarsh-mishra/connects_you_services/services/room';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { RoomModel } from '../../../../models/rooms.model';
import { errorCallback } from '../../../../utils';
import { prepareResponseForRoomUsers } from '../_helper';

// below function is a candidate to be separated from this repo, and moved to a repo for shared logic between user and room
export const getRoomUsers = async (
	req: ServerUnaryCall<GetRoomUsersRequest, GetRoomUsersResponse>,
	callback: sendUnaryData<GetRoomUsersResponse>,
) => {
	try {
		const { roomId, requiredDetailedRoomUserData } = req.request;

		if (!roomId) throw new BadRequestError({ error: 'Invalid request. Please provide roomId' });

		const roomObjectId = MongoObjectId(roomId);

		if (!roomObjectId) throw new BadRequestError({ error: 'Invalid request. Please provide valid userId' });

		const roomUsersResponse = await RoomModel.aggregate([
			{
				$match: {
					_id: roomObjectId,
				},
			},
			...(requiredDetailedRoomUserData
				? [
						{
							$lookup: {
								from: 'users',
								localField: 'roomUsers.userId',
								foreignField: '_id',
								as: 'roomUsersDetailed',
							},
						},
						{
							$project: {
								'roomUsers.emailHash': false,
								'roomUsers.fcmToken': false,
								'roomUsers.emailVerified': false,
								'roomUsers.locale': false,
							},
						},
				  ]
				: []),
		]).exec();

		const roomUsersData = await Promise.all(roomUsersResponse.map((room) => prepareResponseForRoomUsers(room)));

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
			data: {
				roomUsers: roomUsersData[0],
			},
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
