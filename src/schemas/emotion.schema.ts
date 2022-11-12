import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { IEmotionRaw } from '../types/message';

export const schemaName = 'emotions';

export const schema = new mongoose.Schema<IEmotionRaw>({
	emotionString: {
		type: mongoose.SchemaTypes.String,
		required: true,
	},
	emotionSendByUserId: {
		type: mongoose.SchemaTypes.ObjectId,
		required: true,
	},
	emotionSendAt: {
		type: mongoose.SchemaTypes.Date,
		required: true,
	},
});
