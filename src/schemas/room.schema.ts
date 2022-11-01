import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { IRoomRaw } from '../types';

import { schema as roomUsersSchema } from './roomUsers.schema';

export const schemaName = 'rooms';
export const schema = new mongoose.Schema<IRoomRaw>(
	{
		roomName: {
			type: mongoose.SchemaTypes.String,
			required: false,
		},
		roomType: {
			type: mongoose.SchemaTypes.String,
			required: true,
			enum: RoomTypesEnum,
		},
		roomDescription: {
			type: mongoose.SchemaTypes.String,
			required: false,
		},
		roomLogoUrl: {
			type: mongoose.SchemaTypes.String,
			required: false,
		},
		createdByUserId: {
			type: mongoose.SchemaTypes.ObjectId,
			required: true,
		},
		roomUsers: {
			type: [roomUsersSchema],
			required: false,
			default: [],
		},
	},
	{ timestamps: true, collection: schemaName },
);
