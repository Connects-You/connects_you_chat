import { RemoveUsersFromGroupRoomRequest } from '@adarsh-mishra/connects_you_services/services/room/RemoveUsersFromGroupRoomRequest';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { isEmptyArray } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError, NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId, mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { RoomModel } from '../../../../models/rooms.model';
import { isUserAdminOfGroup } from '../_helper';

export const removeUsersFromGroupRoom = async (request: RemoveUsersFromGroupRoomRequest) => {
	const { roomId, userIds, adminUserId } = request;
	if (!roomId || !userIds || isEmptyArray(userIds)) {
		throw new BadRequestError({ error: 'roomId and userId are required and roomUsers must not be empty' });
	}

	const roomObjectId = MongoObjectId(roomId);
	const adminUserObjectId = MongoObjectId(adminUserId);

	const userObjectIds: Array<mongoose.Types.ObjectId> = [];
	for (const userId of userIds) {
		const id = MongoObjectId(userId);
		if (id) userObjectIds.push(id);
	}

	if (userObjectIds.length !== userIds.length || !roomObjectId || !adminUserObjectId)
		throw new BadRequestError({
			error: 'Invalid request. Please provide valid userIds or roomId or adminUserId',
		});

	const isCreatorAdminOfGroup = await isUserAdminOfGroup(roomObjectId, adminUserObjectId);

	if (!isCreatorAdminOfGroup) {
		throw new BadRequestError({ error: 'Only admins can remove users from a group' });
	}

	const updateRoomResponse = await RoomModel.updateOne(
		{
			_id: roomObjectId,
			'roomUsers.userId': {
				$all: userObjectIds,
			},
		},
		{
			$pull: {
				roomUsers: { userId: { $in: userObjectIds } },
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

	return {
		status: ResponseStatusEnum.SUCCESS,
	};
};
