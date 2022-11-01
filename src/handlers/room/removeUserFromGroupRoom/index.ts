import { RemoveUsersFromGroupRoomRequest } from '@adarsh-mishra/connects_you_services/services/room/RemoveUsersFromGroupRoomRequest';
import { RemoveUsersFromGroupRoomResponse } from '@adarsh-mishra/connects_you_services/services/room/RemoveUsersFromGroupRoomResponse';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { isEmptyArray } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError, NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId, mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { errorCallback } from '../../../helpers';
import { RoomModel } from '../../../models/rooms.model';
import { isUserAdminOfGroup } from '../../helpers/isUserAdminOfGroup';

export const removeUsersFromGroupRoom = async (
	req: ServerUnaryCall<RemoveUsersFromGroupRoomRequest, RemoveUsersFromGroupRoomResponse>,
	callback: sendUnaryData<RemoveUsersFromGroupRoomResponse>,
) => {
	try {
		const { roomId, userIds, adminUserId } = req.request;
		if (!roomId || !userIds || isEmptyArray(userIds)) {
			throw new BadRequestError({ error: 'roomId and userId are required and roomUsers must not be empty' });
		}

		const roomIdObj = MongoObjectId(roomId);
		const adminUserIdObj = MongoObjectId(adminUserId);

		const userIdObjs: Array<mongoose.Types.ObjectId> = [];
		for (const userId of userIds) {
			const id = MongoObjectId(userId);
			if (id) userIdObjs.push(id);
		}

		if (userIdObjs.length !== userIds.length || !roomIdObj || !adminUserIdObj)
			throw new BadRequestError({
				error: 'Invalid request. Please provide valid userIds or roomId or adminUserId',
			});

		const isCreatorAdminOfGroup = await isUserAdminOfGroup(roomIdObj, adminUserIdObj);

		if (!isCreatorAdminOfGroup) {
			throw new BadRequestError({ error: 'Only admins can remove users from a group' });
		}

		const updateRoomResponse = await RoomModel.updateOne(
			{
				_id: roomIdObj,
				'roomUsers.userId': {
					$all: userIdObjs,
				},
			},
			{
				$pull: {
					roomUsers: { userId: { $in: userIdObjs } },
				},
			},
		)
			.lean()
			.exec();

		if (updateRoomResponse.modifiedCount === 0) {
			throw new NotFoundError({
				error: 'Not able to remove user from the room. Possible Reasons: Any of payload roomUsers is/are not exist/s in the room',
			});
		}

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
