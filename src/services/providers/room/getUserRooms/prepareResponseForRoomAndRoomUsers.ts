import { Room, RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room';

import { IRoomRaw, IUserRaw } from '../../../../types';

import { prepareResponseForRoom } from './prepareResponseForRoom';
import { prepareResponseForRoomUsers } from './prepareResponseForRoomUsers';

type TRoomAndUserDetailed = IRoomRaw & { roomUsersDetailed?: Array<IUserRaw> };

export const prepareResponseForRoomAndRoomUsers = async (room: TRoomAndUserDetailed, userId: string): Promise<Room> => {
	const [decryptedRoomData, decryptedRoomUserData] = await Promise.all([
		prepareResponseForRoom(room),
		prepareResponseForRoomUsers(room),
	]);
	if (decryptedRoomData.roomType === RoomTypesEnum.DUET) {
		const duetRoomParticipantUser = decryptedRoomUserData.find((user) => user.userId !== userId);
		return {
			roomId: decryptedRoomData.roomId,
			roomName: duetRoomParticipantUser?.name ?? decryptedRoomData.roomName,
			roomLogoUrl: duetRoomParticipantUser?.photoUrl ?? decryptedRoomData.roomLogoUrl,
			roomDescription: duetRoomParticipantUser?.description ?? decryptedRoomData.roomDescription,
			roomType: decryptedRoomData.roomType,
			roomUsers: [duetRoomParticipantUser ?? {}],
			createdByUserId: decryptedRoomData.createdByUserId,
		};
	}
	return Object.assign(decryptedRoomData, { roomUsers: decryptedRoomUserData });
};
