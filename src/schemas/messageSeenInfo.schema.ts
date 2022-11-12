import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { IMessageSeenInfoRaw } from '../types/message';

export const schemaName = 'messageSeenInfo';

export const schema = new mongoose.Schema<IMessageSeenInfoRaw>({
	seenByUserId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	seenAt: {
		type: mongoose.Schema.Types.Date,
		required: true,
	},
});
