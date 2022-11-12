import { getServiceProvider, initialiseServiceAsClient } from '@adarsh-mishra/connects_you_services';
import { ProtoGrpcType as AuthProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/auth';
import { ProtoGrpcType as ChatProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/chat';
import { ProtoGrpcType as RoomProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/room';
import { ProtoGrpcType as UserProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/user';
import { Server, ServerCredentials } from '@grpc/grpc-js';
import dotenv from 'dotenv';

import { handlerWrapper } from '../utils';

import { createMessageThread } from './providers/chat/createMessageThread';
import { deleteRoomThread } from './providers/chat/deleteRoomThread';
import { editMessage } from './providers/chat/editMessage';
import { getRoomMessages } from './providers/chat/getRoomMessages';
import { getRoomThreads } from './providers/chat/getRoomThreads';
import { getThreadMessages } from './providers/chat/getThreadMessages';
import { getUserMessages } from './providers/chat/getUserMessages';
import { insertEmotionForMessage } from './providers/chat/insertEmotionForMessage';
import { insertMessage } from './providers/chat/insertMessage';
import { insertMessageSeenInfoForMessage } from './providers/chat/insertMessageSeenInfoForMessage';
import { removeEmotionForMessage } from './providers/chat/removeEmotionForMessage';
import { removeMessages } from './providers/chat/removeMessages';
import { addUsersToGroupRoom } from './providers/room/addUsersToGroupRoom';
import { createGroupRoom } from './providers/room/createGroupRoom';
import { findOrCreateDuetRoom } from './providers/room/findOrCreateDuetRoom';
import { getUserRooms } from './providers/room/getUserRooms';
import { removeUsersFromGroupRoom } from './providers/room/removeUserFromGroupRoom';
import { updateGroupRoomDetails } from './providers/room/updateGroupRoomDetails';
import { updateUserRoleInGroupRoom } from './providers/room/updateUserRoleInGroupRoom';

const ServiceProviders = {
	auth: (getServiceProvider('auth') as unknown as AuthProtoGrpcType).auth,
	user: (getServiceProvider('user') as unknown as UserProtoGrpcType).user,
	room: (getServiceProvider('room') as unknown as RoomProtoGrpcType).room,
	chat: (getServiceProvider('chat') as unknown as ChatProtoGrpcType).chat,
};

const getServiceClients = () => {
	dotenv.config();
	const user = initialiseServiceAsClient({
		service: ServiceProviders.user.UserServices,
		address: process.env.AUTH_SERVICE_URL,
	});
	return { user };
};

export const ServiceClients = getServiceClients();

export const createGRPCServer = () => {
	const server = new Server({ 'grpc.keepalive_permit_without_calls': 1, 'grpc.max_reconnect_backoff_ms': 10000 });

	server.addService(ServiceProviders.room.RoomServices.service, {
		findOrCreateDuetRoom: handlerWrapper(findOrCreateDuetRoom, { userClient: ServiceClients.user }),
		createGroupRoom: handlerWrapper(createGroupRoom),
		addUsersToGroupRoom: handlerWrapper(addUsersToGroupRoom),
		updateUserRoleInGroupRoom: handlerWrapper(updateUserRoleInGroupRoom),
		getUserRooms: handlerWrapper(getUserRooms),
		removeUsersFromGroupRoom: handlerWrapper(removeUsersFromGroupRoom),
		updateGroupRoomDetails: handlerWrapper(updateGroupRoomDetails),
	});

	server.addService(ServiceProviders.chat.ChatServices.service, {
		insertMessage: handlerWrapper(insertMessage),
		getRoomMessages: handlerWrapper(getRoomMessages),
		removeMessages: handlerWrapper(removeMessages),
		editMessage: handlerWrapper(editMessage),
		getUserMessages: handlerWrapper(getUserMessages),
		insertMessageSeenInfoForMessages: handlerWrapper(insertMessageSeenInfoForMessage),
		createMessageThread: handlerWrapper(createMessageThread),
		getThreadMessages: handlerWrapper(getThreadMessages),
		getRoomThreads: handlerWrapper(getRoomThreads),
		deleteRoomThread: handlerWrapper(deleteRoomThread),
		insertEmotionForMessage: handlerWrapper(insertEmotionForMessage),
		removeEmotionForMessage: handlerWrapper(removeEmotionForMessage),
	});

	server.bindAsync(process.env.URL, ServerCredentials.createInsecure(), (error, port) => {
		if (error) {
			throw error;
		}
		// eslint-disable-next-line no-console
		console.log(`Server running at ${port}`);
		server.start();
	});
};
