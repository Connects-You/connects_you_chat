import { FindOrCreateDuetRoomRequest } from '@adarsh-mishra/connects_you_services/services/room/FindOrCreateDuetRoomRequest';
import { FindOrCreateDuetRoomResponse } from '@adarsh-mishra/connects_you_services/services/room/FindOrCreateDuetRoomResponse';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { UserServicesClient } from '@adarsh-mishra/connects_you_services/services/user/UserServices';
import { isEmptyEntity } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId, mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { errorCallback, getUserDetails } from '../../../../helpers';
import { RoomModel } from '../../../../models/rooms.model';

const checkExistedRoom = async (userId1: mongoose.Types.ObjectId, userId2: mongoose.Types.ObjectId) => {
	const existedRoom = await RoomModel.findOne({
		roomType: RoomTypesEnum.DUET,
		$or: [
			{ 'roomUsers.0.userId': userId1, 'roomUsers.1.userId': userId2 },
			{ 'roomUsers.1.userId': userId1, 'roomUsers.0.userId': userId2 },
		],
	})
		.lean()
		.exec();
	if (existedRoom && !isEmptyEntity(existedRoom)) {
		Object.assign(existedRoom, { roomId: existedRoom._id.toString() });
		return existedRoom;
	}
	return undefined;
};

export const findOrCreateDuetRoom = async (
	req: ServerUnaryCall<FindOrCreateDuetRoomRequest, FindOrCreateDuetRoomResponse>,
	callback: sendUnaryData<FindOrCreateDuetRoomResponse>,
	wrappers: { userClient: UserServicesClient },
) => {
	try {
		const { createdByUserId, participantUserId } = req.request;
		const { userClient } = wrappers;

		if (!createdByUserId || !participantUserId)
			throw new BadRequestError({
				error: 'Invalid request. Please provide createdByUserId and participantUserId',
			});

		const creatorUserIdObj = MongoObjectId(createdByUserId);
		const participantUserIdObj = MongoObjectId(participantUserId);

		if (!creatorUserIdObj || !participantUserIdObj) {
			throw new BadRequestError({
				error: 'Invalid request. Please provide valid createdByUserId and participantUserId',
			});
		}

		const participantUserDetails = await getUserDetails(participantUserId, userClient);
		if (isEmptyEntity(participantUserDetails)) {
			throw new BadRequestError({
				error: 'Invalid request. Please provide valid participantUserId',
			});
		}

		const existedRoom = await checkExistedRoom(creatorUserIdObj, participantUserIdObj);

		if (existedRoom)
			return callback(null, {
				status: ResponseStatusEnum.SUCCESS,
				data: {
					rooms: {
						roomName: participantUserDetails?.name,
						roomLogoUrl: participantUserDetails?.photoUrl,
						roomDescription: participantUserDetails?.description,
						roomId: existedRoom._id.toString(),
						roomType: existedRoom.roomType,
						createdByUserId: existedRoom.createdByUserId.toString(),
						roomUsers: existedRoom.roomUsers.map((user) => ({
							userId: user._id.toString(),
							userRole: user.userRole,
							joinedAt: user.joinedAt.toISOString(),
						})),
					},
				},
			});

		const userJoiningDate = new Date();

		const roomData = await RoomModel.create({
			roomType: RoomTypesEnum.DUET,
			createdByUserId: creatorUserIdObj,
			roomUsers: [
				{
					userId: creatorUserIdObj,
					userRole: RoomUserRoleEnum.DUET_CREATOR,
					joinedAt: userJoiningDate,
				},
				{
					userId: participantUserIdObj,
					userRole: RoomUserRoleEnum.DUET_PARTICIPANT,
					joinedAt: userJoiningDate,
				},
			],
		});

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
			data: {
				rooms: {
					roomName: participantUserDetails?.name,
					roomLogoUrl: participantUserDetails?.photoUrl,
					roomDescription: participantUserDetails?.description,
					roomId: roomData._id.toString(),
					roomType: roomData.roomType,
					createdByUserId: roomData.createdByUserId.toString(),
					roomUsers: roomData.roomUsers.map((user) => ({
						userId: user._id.toString(),
						userRole: user.userRole,
						joinedAt: user.joinedAt.toISOString(),
					})),
				},
			},
		});
	} catch (error) {
		return errorCallback(callback, error);
	}
};
