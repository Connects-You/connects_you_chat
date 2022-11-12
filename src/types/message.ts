import { Emotion, MessageTypeEnum } from '@adarsh-mishra/connects_you_services/services/chat';
import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

export interface IMessageBase {
	messageText: string;
	messageType: MessageTypeEnum;
	emotionList?: Array<Emotion>;
	isDeleted?: boolean;
}

export interface IMessageRaw extends IMessageBase {
	_id: mongoose.Types.ObjectId;
	roomId: mongoose.Types.ObjectId;
	senderUserId: mongoose.Types.ObjectId;
	receiverUserId?: mongoose.Types.ObjectId;
	haveThreadId?: mongoose.Types.ObjectId;
	belongsToThreadId?: mongoose.Types.ObjectId;
	sendAt: Date;
	updatedAt: Date;
	messageSeenInfo?: Array<IMessageSeenInfoRaw>;
}

export interface IMessageClean extends IMessageBase {
	messageId: string;
	roomId: string;
	senderUserId: string;
	receiverUserId?: string;
	haveThreadId?: string;
	belongsToThreadId?: string;
	sendAt: string;
	updatedAt: string;
	messageSeenInfo?: Array<IMessageSeenInfoClean>;
}

export interface IMessageSeenInfoRaw {
	seenByUserId: mongoose.Types.ObjectId;
	seenAt: Date;
}

export interface IMessageSeenInfoClean {
	seenByUserId: string;
	seenAt: string;
}

export interface IEmotionBase {
	emotionString: string;
}

export interface IEmotionRaw extends IEmotionBase {
	emotionSendByUserId: mongoose.Types.ObjectId;
	emotionSendAt: Date;
}

export interface IEmotionClean extends IEmotionBase {
	emotionSendByUserId: string;
	emotionSendAt: string;
}
