import { FindOrCreateDuetRoomRequest } from '@adarsh-mishra/connects_you_services/services/room/FindOrCreateDuetRoomRequest';
import { FindOrCreateDuetRoomResponse } from '@adarsh-mishra/connects_you_services/services/room/FindOrCreateDuetRoomResponse';
import { ResponseStatusEnum } from '@adarsh-mishra/connects_you_services/services/room/ResponseStatusEnum';
import { RoomTypesEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomTypesEnum';
import { RoomUserRoleEnum } from '@adarsh-mishra/connects_you_services/services/room/RoomUserRoleEnum';
import { UserServicesClient } from '@adarsh-mishra/connects_you_services/services/user/UserServices';
import { isEmptyEntity } from '@adarsh-mishra/node-utils/commonHelpers';
import { BadRequestError } from '@adarsh-mishra/node-utils/httpResponses';
import { MongoObjectId } from '@adarsh-mishra/node-utils/mongoHelpers';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';

import { RoomModel } from '../../../../models/rooms.model';
import { errorCallback } from '../../../../utils';
import { getUserDetails } from '../_helper';

import { checkExistedRoom } from './checkExistedRoom';

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

		const creatorUserObjectId = MongoObjectId(createdByUserId);
		const participantUserObjectId = MongoObjectId(participantUserId);

		if (!creatorUserObjectId || !participantUserObjectId) {
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

		const existedRoom = await checkExistedRoom(creatorUserObjectId, participantUserObjectId);

		if (existedRoom)
			return callback(null, {
				status: ResponseStatusEnum.SUCCESS,
				data: {
					room: {
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
			createdByUserId: creatorUserObjectId,
			roomUsers: [
				{
					userId: creatorUserObjectId,
					userRole: RoomUserRoleEnum.DUET_CREATOR,
					joinedAt: userJoiningDate,
				},
				{
					userId: participantUserObjectId,
					userRole: RoomUserRoleEnum.DUET_PARTICIPANT,
					joinedAt: userJoiningDate,
				},
			],
		});

		return callback(null, {
			status: ResponseStatusEnum.SUCCESS,
			data: {
				room: {
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
