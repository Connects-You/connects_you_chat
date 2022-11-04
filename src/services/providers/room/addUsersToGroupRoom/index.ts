import { AddUsersToGroupRoomRequest } from '@adarsh-mishra/connects_you_services/services/room/AddUsersToGroupRoomRequest';
import { AddUsersToGroupRoomResponse } from '@adarsh-mishra/connects_you_services/services/room/AddUsersToGroupRoomResponse';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { isEmptyArray } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError, NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId, mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { errorCallback, isUserAdminOfGroup } from '../../../../helpers';
import { RoomModel } from '../../../../models/rooms.model';

export const addUsersToGroupRoom = async (
	req: ServerUnaryCall<AddUsersToGroupRoomRequest, AddUsersToGroupRoomResponse>,
	callback: sendUnaryData<AddUsersToGroupRoomResponse>,
) => {
	try {
		const { roomId, roomUsers, adminUserId } = req.request;
		if (!roomId || !roomUsers || isEmptyArray(roomUsers)) {
			throw new BadRequestError({ error: 'roomId and userId are required and roomUsers must not be empty' });
		}

		const roomIdObj = MongoObjectId(roomId);
		const adminUserIdObj = MongoObjectId(adminUserId);

		const userIdObjs: Array<mongoose.Types.ObjectId> = [];
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
			if (id) userIdObjs.push(id);
		}

		if (isUserWithUnexpectedRole) {
			throw new BadRequestError({ error: 'Invalid request. Please provide valid userRole' });
		}
		if (userIdObjs.length !== roomUsers.length || !roomIdObj || !adminUserIdObj)
			throw new BadRequestError({
				error: 'Invalid request. Please provide valid userIds or roomId or adminUserId',
			});

		const isCreatorAdminOfGroup = await isUserAdminOfGroup(roomIdObj, adminUserIdObj);

		if (!isCreatorAdminOfGroup) {
			throw new BadRequestError({ error: 'Only admins can add users to a group' });
		}

		const userJoiningDate = new Date();

		const updateRoomResponse = await RoomModel.updateOne(
			{
				_id: roomIdObj,
				'roomUsers.userId': {
					$nin: userIdObjs,
				},
			},
			{
				$push: {
					roomUsers: {
						$each: roomUsers.map((user, index) => {
							return {
								userId: userIdObjs[index],
								userRole: user.userRole,
								joinedAt: userJoiningDate,
							};
						}),
					},
				},
			},
			{ new: true },
		)
			.lean()
			.exec();

		if (updateRoomResponse.modifiedCount === 0) {
			throw new NotFoundError({
				error: 'Not able to insert user into the room. Possible Reasons: Any of payload roomUsers is/are already exist/s in the room',
			});
		}

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
