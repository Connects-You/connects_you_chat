import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { IRoomUserRaw } from '../types';

export const schemaName = 'roomUsers';
export const schema = new mongoose.Schema<IRoomUserRaw>(
	{
		joinedAt: {
			type: mongoose.SchemaTypes.Date,
			required: true,
		},
		userId: {
			type: mongoose.SchemaTypes.ObjectId,
			required: true,
		},
		userRole: {
			type: mongoose.SchemaTypes.String,
			required: true,
			enum: RoomUserRoleEnum,
		},
	},
	{ timestamps: true },
);
