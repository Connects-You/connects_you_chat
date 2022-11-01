import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

export interface IUserBase {
	email: string;
	emailHash: string;
	name: string;
	photoUrl?: string;
	description?: string;
	publicKey: string;
	fcmToken: string;
	emailVerified: boolean;
	authProvider: string;
	locale: string;
}

export interface IUserClean extends IUserBase {
	userId: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface IUserRaw extends IUserBase {
	_id: mongoose.Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}
