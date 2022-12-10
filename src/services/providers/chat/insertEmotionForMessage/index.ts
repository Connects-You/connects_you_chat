import { InsertEmotionForMessageRequest, ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/chat';
import { BadRequestError, NotFoundError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';

import { MessageModel } from '../../../../models/messages.model';

export const insertEmotionForMessage = async (request: InsertEmotionForMessageRequest) => {
	const { emotionSendByUserId, emotionString, messageId } = request;

	if (!emotionSendByUserId || !emotionString || !messageId)
		throw new BadRequestError({ error: 'Required fields are missing.' });

	const emotionSendByUserObjectId = MongoObjectId(emotionSendByUserId);
	const messageObjectId = MongoObjectId(messageId);

	const updateResponse = await MessageModel.updateOne(
		{
			_id: messageObjectId,
			$and: [
				{ 'emotionList.emotionSendByUserId': emotionSendByUserObjectId },
				{ 'emotionList.emotionString': emotionString },
			],
		},
		{
			$push: {
				emotionList: {
					emotionSendByUserId: emotionSendByUserObjectId,
					emotionString,
					emotionSendAt: new Date(),
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
