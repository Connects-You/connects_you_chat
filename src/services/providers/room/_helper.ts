import { Room, RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { UserDetails } from '@adarsh-mishra/connects_you_services/services/user/UserDetails';
import { UserServicesClient } from '@adarsh-mishra/connects_you_services/services/user/UserServices';
import { bulkAesDecrypt, isEmptyEntity } from '@adarsh-mishra/node-utils/commonHelpers';
import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { RoomModel } from '../../../models/rooms.model';
import { IRoomRaw, IUserRaw, IRoomUserRaw } from '../../../types';
import { generateGRPCUserMetaData } from '../../../utils';

export const isUserAdminOfGroup = async (roomId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) => {
	const roomData = await RoomModel.findOne({
		_id: roomId,
		roomType: RoomTypesEnum.GROUP,
		'roomUsers.userId': userId,
		'roomUsers.userRole': RoomUserRoleEnum.GROUP_ADMIN,
	})
		.lean()
		.exec();
	return !isEmptyEntity(roomData);
};

export const getUserDetails = async (userId: string, userClient: UserServicesClient) => {
	return new Promise<UserDetails | null | undefined>((resolve, reject) => {
		const meta = generateGRPCUserMetaData();

		userClient.getUserDetails({ userId }, meta, (error, user) => {
			if (error) {
				reject(error);
			}
			resolve(user?.data?.user);
		});
	});
};

type TRoomAndUserDetailed = IRoomRaw & { roomUsersDetailed?: Array<IUserRaw> };

const prepareResponseForUser = async (user: IRoomUserRaw, userDetailed?: IUserRaw) => {
	const decryptedUserData =
		userDetailed &&
		(await bulkAesDecrypt(
			{
				email: userDetailed.email,
				name: userDetailed.name,
				photoUrl: userDetailed.photoUrl,
				publicKey: userDetailed.publicKey,
				description: userDetailed.description,
			},
			process.env.ENCRYPT_KEY,
		));
	return {
		userId: user._id.toString(),
		joinedAt: user.joinedAt.toISOString(),
		userRole: user.userRole,
		...decryptedUserData,
	};
};

export const prepareResponseForRoomUsers = async (room: TRoomAndUserDetailed) =>
	Promise.all(
		room.roomUsers.map((roomUser, index) => prepareResponseForUser(roomUser, room.roomUsersDetailed?.[index])),
	);

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

export const prepareResponseForRoomAndRoomUsers = async (
	room: TRoomAndUserDetailed,
	userId?: string,
): Promise<Room> => {
	const [decryptedRoomData, decryptedRoomUserData] = await Promise.all([
		prepareResponseForRoom(room),
		prepareResponseForRoomUsers(room),
	]);
	if (decryptedRoomData.roomType === RoomTypesEnum.DUET && userId) {
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
