import { GetUserRoomsRequest, GetUserRoomsResponse } from '@adarsh-mishra/connects_you_services/services/room';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { RoomModel } from '../../../../models/rooms.model';
import { errorCallback } from '../../../../utils';
import { prepareResponseForRoomAndRoomUsers } from '../_helper';

// below function is a candidate to be separated from this repo, and moved to a repo for shared logic between user and room
export const getUserRooms = async (
	req: ServerUnaryCall<GetUserRoomsRequest, GetUserRoomsResponse>,
	callback: sendUnaryData<GetUserRoomsResponse>,
) => {
	try {
		const { limit, timestamp, userId, onlyDuets, onlyGroups, requiredDetailedRoomUserData } = req.request;

		if (!userId) throw new BadRequestError({ error: 'Invalid request. Please provide userId' });

		if (onlyDuets && onlyGroups)
			throw new BadRequestError({ error: 'onlyDuets and onlyGroups cannot be true at same time' });

		const userObjectId = MongoObjectId(userId);

		if (!userObjectId) throw new BadRequestError({ error: 'Invalid request. Please provide valid userId' });

		const userRoomsResponse = await RoomModel.aggregate([
			{
				$match: {
					'roomUsers.userId': userObjectId,
					...(timestamp && { updatedAt: { $gt: timestamp || new Date() } }),
					...(onlyDuets && { roomType: RoomTypesEnum.DUET }),
					...(onlyGroups && { roomType: RoomTypesEnum.GROUP }),
				},
			},
			...(limit !== undefined ? [{ $limit: limit }] : []),
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

		const roomsData = await Promise.all(
			userRoomsResponse.map((data) => prepareResponseForRoomAndRoomUsers(data, userId)),
		);

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
			data: {
				rooms: roomsData,
			},
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
