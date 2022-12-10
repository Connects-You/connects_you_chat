import { AddUsersToGroupRoomRequest } from '@adarsh-mishra/connects_you_services/services/room/AddUsersToGroupRoomRequest';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { isEmptyArray } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { createSessionTransaction, MongoObjectId, mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MAX_ROOM_USERS_ALLOWED } from '../../../../constants';
import { RoomModel } from '../../../../models/rooms.model';
import { isUserAdminOfGroup } from '../_helper';

import { addUsersToGroupRoomTransaction } from './addUsersToGroupRoomTransaction';

export const addUsersToGroupRoom = async (request: AddUsersToGroupRoomRequest) => {
	const { roomId, roomUsers, adminUserId } = request;
	if (!roomId || !roomUsers || isEmptyArray(roomUsers)) {
		throw new BadRequestError({ error: 'roomId and userId are required and roomUsers must not be empty' });
	}

	const roomObjectId = MongoObjectId(roomId);
	const adminUserObjectId = MongoObjectId(adminUserId);

	const userObjectIds: Array<mongoose.Types.ObjectId> = [];
	let isUserWithUnexpectedRole = false;
	for (const roomUser of roomUsers) {
		if (
			!roomUser.userRole ||
			![RoomUserRoleEnum.GROUP_ADMIN, RoomUserRoleEnum.GROUP_MEMBER].includes(
				roomUser.userRole as RoomUserRoleEnum,
			)
		) {
			isUserWithUnexpectedRole = true;
			break;
		}

		const id = MongoObjectId(roomUser.userId);
		if (id) userObjectIds.push(id);
	}

	if (isUserWithUnexpectedRole) {
		throw new BadRequestError({ error: 'Invalid request. Please provide valid userRole' });
	}
	if (userObjectIds.length !== roomUsers.length || !roomObjectId || !adminUserObjectId)
		throw new BadRequestError({
			error: 'Invalid request. Please provide valid userIds or roomId or adminUserId',
		});

	const [isCreatorAdminOfGroup, roomUserCount] = await Promise.all([
		isUserAdminOfGroup(roomObjectId, adminUserObjectId),
		RoomModel.aggregate([
			{
				$match: {
					_id: roomObjectId,
				},
			},
			{
				$project: {
					count: {
						$size: '$roomUsers',
					},
				},
			},
		]).exec(),
	]);

	if (!isCreatorAdminOfGroup) {
		throw new BadRequestError({ error: 'Only admins can add users to a group' });
	}
	if (roomUserCount[0].count === MAX_ROOM_USERS_ALLOWED) {
		throw new BadRequestError({ error: 'Room is full' });
	}

	await createSessionTransaction(async (session) =>
		addUsersToGroupRoomTransaction({ session, roomObjectId, roomUsers, userObjectIds }),
	);

	return {
		status: ResponseStatusEnum.SUCCESS,
	};
};
