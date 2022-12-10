import {
	InsertMessageSeenInfoForMessagesRequest,
	ResponseStatusEnum,
} from '@adarsh-mishra/connects_you_services/services/chat';
import { isEmptyArray } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { createSessionTransaction, MongoObjectId, mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { insertMessageSeenInfoForMessageTransaction } from './insertMessageSeenInfoForMessageTransaction';

export const insertMessageSeenInfoForMessage = async (request: InsertMessageSeenInfoForMessagesRequest) => {
	const { messageIds, seenByUserId } = request;

	if (!messageIds || isEmptyArray(messageIds) || !seenByUserId)
		throw new BadRequestError({ error: 'Missing required fields' });

	const seenByUserObjectId = MongoObjectId(seenByUserId);
	const messageObjectIds: Array<mongoose.Types.ObjectId> = [];

	for (const messageId of messageIds) {
		const messageObjectId = MongoObjectId(messageId);

		if (messageObjectId) messageObjectIds.push(messageObjectId);
	}

	if (messageObjectIds.length !== messageIds.length || !seenByUserObjectId)
		throw new BadRequestError({ error: 'Invalid ids' });

	await createSessionTransaction(async (session) =>
		insertMessageSeenInfoForMessageTransaction({ session, messageObjectIds, seenByUserObjectId }),
	);

	return {
		status: ResponseStatusEnum.SUCCESS,
	};
};
