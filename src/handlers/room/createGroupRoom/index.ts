import { CreateGroupRoomRequest } from '@adarsh-mishra/connects_you_services/services/room/CreateGroupRoomRequest';
import { CreateGroupRoomResponse } from '@adarsh-mishra/connects_you_services/services/room/CreateGroupRoomResponse';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { bulkAesEncrypt, isEmptyArray } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { errorCallback } from '../../../helpers';
import { RoomModel } from '../../../models/rooms.model';

export const createGroupRoom = async (
	req: ServerUnaryCall<CreateGroupRoomRequest, CreateGroupRoomResponse>,
	callback: sendUnaryData<CreateGroupRoomResponse>,
) => {
	try {
		const { createdByUserId, roomUserIds, roomDescription, roomLogoUrl, roomName } = req.request;
		if (!roomName || !createdByUserId || !roomUserIds || isEmptyArray(roomUserIds))
			throw new BadRequestError({ error: 'Requires Fields are missing' });

		if (roomUserIds.includes(createdByUserId)) {
			throw new BadRequestError({ error: 'creatorUserId should not be in roomUserIds' });
		}

		const creatorUserIdObj = MongoObjectId(createdByUserId);
		if (!creatorUserIdObj) {
			throw new BadRequestError({ error: 'Invalid User Id' });
		}

		const userJoiningDate = new Date();

		const roomUsers = [
			{
				userId: creatorUserIdObj,
				userRole: RoomUserRoleEnum.GROUP_ADMIN,
				joinedAt: userJoiningDate,
			},
		];

		for (const id of roomUserIds) {
			const userIdObj = MongoObjectId(id);
			if (!userIdObj) {
				throw new BadRequestError({ error: 'Invalid User Id in roomUsers' });
			}
			roomUsers.push({
				userId: userIdObj,
				userRole: RoomUserRoleEnum.GROUP_MEMBER,
				joinedAt: userJoiningDate,
			});
		}

		const encryptedRoomData = await bulkAesEncrypt(
			{
				roomName,
				roomLogoUrl,
				roomDescription,
			},
			process.env.ENCRYPT_KEY,
		);

		const roomData = await RoomModel.create({
			roomType: RoomTypesEnum.GROUP,
			createdByUserId: creatorUserIdObj,
			roomUsers,
			...encryptedRoomData,
		});

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
			data: {
				rooms: {
					roomName: roomData.roomName,
					roomLogoUrl: roomData.roomLogoUrl,
					roomDescription: roomData.roomDescription,
					roomId: roomData._id.toString(),
					roomType: roomData.roomType,
					createdByUserId: roomData.createdByUserId.toString(),
					roomUsers: roomData.roomUsers.map((user) => ({
						userId: user._id.toString(),
						userRole: user.userRole,
						joinedAt: user.joinedAt.toISOString(),
					})),
				},
			},
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
