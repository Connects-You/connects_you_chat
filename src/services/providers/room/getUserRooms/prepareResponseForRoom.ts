import { bulkAesDecrypt } from '@adarsh-mishra/node-utils/commonHelpers';

import { IRoomRaw } from '../../../../types';

export const prepareResponseForRoom = async (room: IRoomRaw) => {
	const decryptedRoomData = await bulkAesDecrypt(
		{
			roomName: room.roomName,
			roomLogoUrl: room.roomLogoUrl,
			roomDescription: room.roomDescription,
		},
		process.env.ENCRYPT_KEY,
	);
	return Object.assign(decryptedRoomData, {
		roomId: room._id.toString(),
		roomType: room.roomType,
		createdByUserId: room.createdByUserId.toString(),
	});
};
