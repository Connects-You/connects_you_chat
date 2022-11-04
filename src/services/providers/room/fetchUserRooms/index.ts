import { FetchUserRoomsRequest } from '@adarsh-mishra/connects_you_services/services/room/FetchUserRoomsRequest';
import { FetchUserRoomsResponse } from '@adarsh-mishra/connects_you_services/services/room/FetchUserRoomsResponse';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { Room } from '@adarsh-mishra/connects_you_services/services/room/Room';
import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { bulkAesDecrypt } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { errorCallback } from '../../../../helpers';
import { RoomModel } from '../../../../models/rooms.model';
import { IRoomRaw, IRoomUserRaw, IUserRaw } from '../../../../types';

type TRoomAndUserDetailed = IRoomRaw & { roomUsersDetailed?: Array<IUserRaw> };
type TRoomAndUserAggregateResponse = Array<TRoomAndUserDetailed>;

const prepareResponseForRoom = async (room: IRoomRaw) => {
	const decryptedRoomData = await bulkAesDecrypt(
		{
			roomName: room.roomName,
			roomLogoUrl: room.roomLogoUrl,
			roomDescription: room.roomDescription,
		},
		process.env.ENCRYPT_KEY,
	);
	return Object.assign(decryptedRoomData, {
		roomId: room._id.toString(),
		roomType: room.roomType,
		createdByUserId: room.createdByUserId.toString(),
	});
};

const prepareResponseForUser = async (user: IRoomUserRaw, userDetailed?: IUserRaw) => {
	const decryptedUserData =
		userDetailed &&
		(await bulkAesDecrypt(
			{
				email: userDetailed.email,
				name: userDetailed.name,
				photoUrl: userDetailed.photoUrl,
				publicKey: userDetailed.publicKey,
				description: userDetailed.description,
			},
			process.env.ENCRYPT_KEY,
		));
	return {
		userId: user._id.toString(),
		joinedAt: user.joinedAt.toISOString(),
		userRole: user.userRole,
		...decryptedUserData,
	};
};

const prepareResponseForRoomUsers = async (room: TRoomAndUserDetailed) =>
	Promise.all(
		room.roomUsers.map((roomUser, index) => prepareResponseForUser(roomUser, room.roomUsersDetailed?.[index])),
	);

const prepareResponseForRoomAndRoomUsers = async (room: TRoomAndUserDetailed, userId: string): Promise<Room> => {
	const [decryptedRoomData, decryptedRoomUserData] = await Promise.all([
		prepareResponseForRoom(room),
		prepareResponseForRoomUsers(room),
	]);
	if (decryptedRoomData.roomType === RoomTypesEnum.DUET) {
		const duetRoomParticipantUser = decryptedRoomUserData.find((user) => user.userId !== userId);
		return {
			roomId: decryptedRoomData.roomId,
			roomName: duetRoomParticipantUser?.name ?? decryptedRoomData.roomName,
			roomLogoUrl: duetRoomParticipantUser?.photoUrl ?? decryptedRoomData.roomLogoUrl,
			roomDescription: duetRoomParticipantUser?.description ?? decryptedRoomData.roomDescription,
			roomType: decryptedRoomData.roomType,
			roomUsers: [duetRoomParticipantUser ?? {}],
			createdByUserId: decryptedRoomData.createdByUserId,
		};
	}
	return Object.assign(decryptedRoomData, { roomUsers: decryptedRoomUserData });
};

// below function is a candidate to be separated from this repo, and moved to a repo for shared logic between user and room
export const fetchUserRooms = async (
	req: ServerUnaryCall<FetchUserRoomsRequest, FetchUserRoomsResponse>,
	callback: sendUnaryData<FetchUserRoomsResponse>,
) => {
	try {
		const { limit, timestamp, userId, onlyDuets, onlyGroups, requiredDetailedRoomUserData } = req.request;

		if (!userId) throw new BadRequestError({ error: 'Invalid request. Please provide userId' });

		if (onlyDuets && onlyGroups)
			throw new BadRequestError({ error: 'onlyDuets and onlyGroups cannot be true at same time' });

		const userIdObj = MongoObjectId(userId);

		if (!userIdObj) throw new BadRequestError({ error: 'Invalid request. Please provide valid userId' });

		const userRoomsResponse: TRoomAndUserAggregateResponse = await RoomModel.aggregate([
			{
				$match: {
					'roomUsers.userId': userIdObj,
					...(timestamp && { updatedAt: { $gt: timestamp || new Date() } }),
					...(onlyDuets && { roomType: RoomTypesEnum.DUET }),
					...(onlyGroups && { roomType: RoomTypesEnum.GROUP }),
				},
			},
			...(limit !== undefined ? [{ $limit: limit }] : []),
			...(requiredDetailedRoomUserData
				? [
						{
							$lookup: {
								from: 'users',
								localField: 'roomUsers.userId',
								foreignField: '_id',
								as: 'roomUsersDetailed',
							},
						},
						{
							$project: {
								'roomUsers.emailHash': false,
								'roomUsers.fcmToken': false,
								'roomUsers.emailVerified': false,
								'roomUsers.locale': false,
							},
						},
				  ]
				: []),
		]).exec();

		const roomsData = await Promise.all(
			userRoomsResponse.map((data) => prepareResponseForRoomAndRoomUsers(data, userId)),
		);

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
			data: {
				rooms: roomsData,
			},
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
