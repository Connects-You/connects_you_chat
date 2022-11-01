import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { isEmptyEntity } from '@adarsh-mishra/node-utils/commonHelpers';
import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { RoomModel } from '../../models/rooms.model';

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
