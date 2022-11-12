import { IMessageRaw } from '../../../types/message';

export const prepareResponseForMessages = (messages: Array<IMessageRaw>) => {
	return {
		messages: messages.map((message) => ({
			messageId: message._id.toString(),
			messageText: message.messageText,
			createdAt: message.sendAt.toISOString(),
			roomId: message.roomId.toString(),
			senderUserId: message.senderUserId.toString(),
			receiverUserId: message.receiverUserId?.toString(),
			emotionList: message.emotionList,
			haveThreadId: message.haveThreadId?.toString(),
			belongsToThreadId: message.belongsToThreadId?.toString(),
			messageSeenInfo: message.messageSeenInfo?.map((messageSeenInfo) => ({
				seenByUserId: messageSeenInfo.seenByUserId.toString(),
				seenAt: messageSeenInfo.seenAt.toISOString(),
			})),
			sendAt: message.sendAt.toISOString(),
			updatedAt: message.updatedAt.toISOString(),
		})),
	};
};
