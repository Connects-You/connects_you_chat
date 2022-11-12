import { bulkAesDecrypt } from '@adarsh-mishra/node-utils/commonHelpers';

import { IRoomRaw, IRoomUserRaw, IUserRaw } from '../../../../types';

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
