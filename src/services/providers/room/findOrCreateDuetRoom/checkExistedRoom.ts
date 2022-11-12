import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room';
import { isEmptyEntity } from '@adarsh-mishra/node-utils/commonHelpers';
import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { RoomModel } from '../../../../models/rooms.model';

export const checkExistedRoom = async (userId1: mongoose.Types.ObjectId, userId2: mongoose.Types.ObjectId) => {
	const existedRoom = await RoomModel.findOne({
		roomType: RoomTypesEnum.DUET,
		$or: [
			{ 'roomUsers.0.userId': userId1, 'roomUsers.1.userId': userId2 },
			{ 'roomUsers.1.userId': userId1, 'roomUsers.0.userId': userId2 },
		],
	})
		.lean()
		.exec();
	if (existedRoom && !isEmptyEntity(existedRoom)) {
		Object.assign(existedRoom, { roomId: existedRoom._id.toString() });
		return existedRoom;
	}
	return undefined;
};
