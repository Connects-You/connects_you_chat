import { RemoveEmotionForMessageRequest, ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError, NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MessageModel } from '../../../../models/messages.model';

export const removeEmotionForMessage = async (request: RemoveEmotionForMessageRequest) => {
	const { emotionId, messageId } = request;

	if (!emotionId || !messageId) throw new BadRequestError({ error: 'Required fields are missing.' });

	const emotionObjectId = MongoObjectId(emotionId);
	const messageObjectId = MongoObjectId(messageId);

	const updateResponse = await MessageModel.updateOne(
		{
			_id: messageObjectId,
			'emotionList._id': emotionObjectId,
		},
		{
			$pull: {
				emotionList: {
					_id: emotionObjectId,
				},
			},
		},
	)
		.lean()
		.exec();

	if (updateResponse.modifiedCount === 0) throw new NotFoundError({ error: 'Emotion already exists.' });

	return {
		status: ResponseStatusEnum.SUCCESS,
	};
};
