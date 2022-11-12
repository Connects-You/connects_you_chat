import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { UpdateUserRoleInGroupRoomRequest } from '@adarsh-mishra/connects_you_services/services/room/UpdateUserRoleInGroupRoomRequest';
import { UpdateUserRoleInGroupRoomResponse } from '@adarsh-mishra/connects_you_services/services/room/UpdateUserRoleInGroupRoomResponse';
import { BadRequestError, NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { RoomModel } from '../../../../models/rooms.model';
import { errorCallback } from '../../../../utils';
import { isUserAdminOfGroup } from '../_helper';

export const updateUserRoleInGroupRoom = async (
	req: ServerUnaryCall<UpdateUserRoleInGroupRoomRequest, UpdateUserRoleInGroupRoomResponse>,
	callback: sendUnaryData<UpdateUserRoleInGroupRoomResponse>,
) => {
	try {
		const { roomId, userId, userRole, adminUserId } = req.request;
		if (
			!roomId ||
			!userId ||
			!adminUserId ||
			!userRole ||
			![RoomUserRoleEnum.GROUP_ADMIN, RoomUserRoleEnum.GROUP_MEMBER].includes(userRole as RoomUserRoleEnum)
		) {
			throw new BadRequestError({ error: 'roomId and userId are required, and userRole must be valid' });
		}

		const roomObjectId = MongoObjectId(roomId);
		const adminUserObjectId = MongoObjectId(adminUserId);

		const userObjectId = MongoObjectId(userId);

		if (!userObjectId || !roomObjectId || !adminUserObjectId)
			throw new BadRequestError({
				error: 'Invalid request. Please provide valid userId or roomId or adminUserId',
			});

		const isCreatorAdminOfGroup = await isUserAdminOfGroup(roomObjectId, adminUserObjectId);

		if (!isCreatorAdminOfGroup) {
			throw new BadRequestError({ error: 'Only admins can update userRole in groups' });
		}

		const updateRoomResponse = await RoomModel.updateOne(
			{
				_id: roomObjectId,
				'roomUsers.userId': userObjectId,
			},
			{
				$set: {
					'roomUsers.$.userRole': userRole,
				},
			},
			{ new: true },
		)
			.lean()
			.exec();

		if (updateRoomResponse.modifiedCount === 0) {
			throw new NotFoundError({ error: 'User role not updated' });
		}

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
