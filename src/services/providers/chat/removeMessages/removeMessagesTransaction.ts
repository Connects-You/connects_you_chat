import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MessageModel } from '../../../../models/messages.model';

export const removeMessagesTransaction = async ({
	session,
	messageObjectIds,
}: {
	session: mongoose.ClientSession;
	messageObjectIds: Array<mongoose.Types.ObjectId>;
}) => {
	const updateResponse = await MessageModel.updateMany(
		{
			_id: { $in: messageObjectIds },
		},
		{
			$set: {
				isDeleted: true,
			},
		},

		{ session },
	)
		.lean()
		.exec();

	if (updateResponse.modifiedCount !== messageObjectIds.length) {
		throw new Error('Error deleting messages');
	} else {
		await session.commitTransaction();
	}
};
