import { AddUsersToGroupRoomRequestRoomUsers } from '@adarsh-mishra/connects_you_services/services/room';
import { NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';
import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { RoomModel } from '../../../../models/rooms.model';

export const addUsersToGroupRoomTransaction = async ({
	session,
	roomObjectId,
	roomUsers,
	userObjectIds,
}: {
	session: mongoose.ClientSession;
	roomObjectId: mongoose.Types.ObjectId;
	userObjectIds: Array<mongoose.Types.ObjectId>;
	roomUsers: Array<AddUsersToGroupRoomRequestRoomUsers>;
}) => {
	const userJoiningDate = new Date();

	const updateRoomResponse = await RoomModel.updateOne(
		{
			_id: roomObjectId,
			'roomUsers.userId': {
				$nin: userObjectIds,
			},
		},
		{
			$push: {
				roomUsers: {
					$each: roomUsers.map((user, index) => {
						return {
							userId: userObjectIds[index],
							userRole: user.userRole,
							joinedAt: userJoiningDate,
						};
					}),
				},
			},
		},
		{ session },
	)
		.lean()
		.exec();
	if (updateRoomResponse.modifiedCount !== userObjectIds.length) {
		throw new NotFoundError({
			error: 'Not able to insert user into the room. Possible Reasons: Any of payload roomUsers is/are already exist/s in the room',
		});
	} else {
		await session.commitTransaction();
	}
};
