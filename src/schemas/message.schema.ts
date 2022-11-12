import { MessageTypeEnum } from '@adarsh-mishra/connects_you_services/services/chat';
import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { IMessageRaw } from '../types/message';

import { schema as EmotionSchema } from './emotion.schema';
import { schema as MessageSeenInfoSchema } from './messageSeenInfo.schema';

export const schemaName = 'messages';
export const schema = new mongoose.Schema<IMessageRaw>({
	roomId: {
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
	},
	senderUserId: {
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
	},
	receiverUserId: {
		type: mongoose.SchemaTypes.ObjectId,
		required: false,
	},
	messageText: {
		type: mongoose.SchemaTypes.String,
		required: true,
	},
	messageType: {
		type: mongoose.SchemaTypes.String,
		required: true,
		enum: MessageTypeEnum,
	},
	emotionList: {
		type: [EmotionSchema],
		required: false,
		default: [],
	},
	isDeleted: {
		type: mongoose.SchemaTypes.Boolean,
		required: false,
		default: false,
	},
	messageSeenInfo: {
		type: [MessageSeenInfoSchema],
		required: true,
		default: [],
	},
	sendAt: {
		type: mongoose.SchemaTypes.Date,
		required: true,
	},
	updatedAt: {
		type: mongoose.SchemaTypes.Date,
		required: true,
	},
	haveThreadId: {
		type: mongoose.SchemaTypes.ObjectId,
		required: false,
	},
	belongsToThreadId: {
		type: mongoose.SchemaTypes.ObjectId,
		required: false,
	},
});
