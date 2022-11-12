import { NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';

import { MessageModel } from '../../../../models/messages.model';

export const insertMessageSeenInfoForMessageTransaction = async ({ session, messageObjectIds, seenByUserObjectId }) => {
	const seenAt = new Date();

	const updateResponse = await MessageModel.updateMany(
		{ _id: { $in: messageObjectIds }, 'messageSeenInfo.seenByUserId': seenByUserObjectId },
		{
			$push: {
				messageSeenInfo: {
					seenByUserId: seenByUserObjectId,
					seenAt,
				},
			},
		},
		{ session },
	)
		.lean()
		.exec();

	if (updateResponse.modifiedCount !== messageObjectIds.length) {
		throw new NotFoundError({ error: 'Unable to insert messages ' });
	} else {
		await session.commitTransaction();
	}
};
