import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { UpdateGroupRoomDetailsRequest } from '@adarsh-mishra/connects_you_services/services/room/UpdateGroupRoomDetailsRequest';
import { bulkAesEncrypt } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError, NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';

import { RoomModel } from '../../../../models/rooms.model';

export const updateGroupRoomDetails = async (request: UpdateGroupRoomDetailsRequest) => {
	const { roomDescription, roomId, roomLogoUrl, roomName } = request;
	if (!roomId || !roomName) {
		throw new BadRequestError({ error: 'roomId and roomName are required' });
	}
	const roomObjectId = MongoObjectId(roomId);

	if (!roomObjectId) {
		throw new BadRequestError({ error: 'Invalid roomId or adminUserId' });
	}

	const encryptedRoomDetails = await bulkAesEncrypt(
		{
			...(roomName && { roomName }),
			...(roomLogoUrl && { roomLogoUrl }),
			...(roomDescription && { roomDescription }),
		},
		process.env.ENCRYPT_KEY,
	);

	const updatedRoom = await RoomModel.updateOne(
		{ _id: roomObjectId, roomType: RoomTypesEnum.GROUP },
		{ $set: encryptedRoomDetails },
	)
		.lean()
		.exec();
	if (updatedRoom.modifiedCount === 0) {
		throw new NotFoundError({
			error: 'Room details not updated. Possible Reasons: 1. roomId is not of a group',
		});
	}

	return {
		status: ResponseStatusEnum.SUCCESS,
	};
};
