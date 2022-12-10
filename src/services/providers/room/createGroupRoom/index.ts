import { CreateGroupRoomRequest } from '@adarsh-mishra/connects_you_services/services/room/CreateGroupRoomRequest';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { bulkAesEncrypt, isEmptyArray } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MAX_ROOM_USERS_ALLOWED } from '../../../../constants';
import { RoomModel } from '../../../../models/rooms.model';

export const createGroupRoom = async (request: CreateGroupRoomRequest) => {
	const { createdByUserId, roomUserIds, roomDescription, roomLogoUrl, roomName } = request;
	if (!roomName || !createdByUserId || !roomUserIds || isEmptyArray(roomUserIds))
		throw new BadRequestError({ error: 'Requires Fields are missing' });

	if (roomUserIds.length > MAX_ROOM_USERS_ALLOWED) {
		throw new BadRequestError({ error: `Room can have only ${MAX_ROOM_USERS_ALLOWED} users` });
	}

	if (roomUserIds.includes(createdByUserId)) {
		throw new BadRequestError({ error: 'creatorUserId should not be in roomUserIds' });
	}

	const creatorUserObjectId = MongoObjectId(createdByUserId);
	if (!creatorUserObjectId) {
		throw new BadRequestError({ error: 'Invalid User Id' });
	}

	const userJoiningDate = new Date();

	const roomUsers = [
		{
			userId: creatorUserObjectId,
			userRole: RoomUserRoleEnum.GROUP_ADMIN,
			joinedAt: userJoiningDate,
		},
	];

	for (const id of roomUserIds) {
		const userObjectId = MongoObjectId(id);
		if (!userObjectId) {
			throw new BadRequestError({ error: 'Invalid User Id in roomUsers' });
		}
		roomUsers.push({
			userId: userObjectId,
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
		createdByUserId: creatorUserObjectId,
		roomUsers,
		...encryptedRoomData,
	});

	return {
		status: ResponseStatusEnum.SUCCESS,
		data: {
			room: {
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
	};
};
