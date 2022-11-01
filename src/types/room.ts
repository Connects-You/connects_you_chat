import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

export interface IRoomBase {
	roomName: string;
	roomType: RoomTypesEnum;
	createdByUserId: mongoose.Types.ObjectId;
	roomLogoUrl?: string;
	roomDescription?: string;
	roomUsers: Array<IRoomUserRaw>;
}

export interface IRoomRaw extends IRoomBase {
	_id: mongoose.Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface IRoomClean extends IRoomBase {
	roomId: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface IRoomUserBase {
	userId: mongoose.Types.ObjectId;
	userRole: RoomUserRoleEnum;
}

export interface IRoomUserRaw extends IRoomUserBase {
	_id: mongoose.Types.ObjectId;
	joinedAt: Date;
}

export interface IRoomUserClean extends IRoomUserBase {
	roomUserId: string;
	joinedAt: string;
}
