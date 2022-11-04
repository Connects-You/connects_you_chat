import { getServiceProvider, initialiseServiceAsClient } from '@adarsh-mishra/connects_you_services/index';
import { ProtoGrpcType as AuthProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/auth';
import { ProtoGrpcType as RoomProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/room';
import { ProtoGrpcType as UserProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/user';
import { Redis } from '@adarsh-mishra/node-utils/redisHelpers';
import { Server, ServerCredentials } from '@grpc/grpc-js';
import dotenv from 'dotenv';

import { handlerWrapper } from '../helpers';

import { addUsersToGroupRoom } from './providers/room/addUsersToGroupRoom';
import { createGroupRoom } from './providers/room/createGroupRoom';
import { fetchUserRooms } from './providers/room/fetchUserRooms';
import { findOrCreateDuetRoom } from './providers/room/findOrCreateDuetRoom';
import { removeUsersFromGroupRoom } from './providers/room/removeUserFromGroupRoom';
import { updateGroupRoomDetails } from './providers/room/updateGroupRoomDetails';
import { updateUserRoleInGroupRoom } from './providers/room/updateUserRoleInGroupRoom';

const ServiceProviders = {
	auth: (getServiceProvider('auth') as unknown as AuthProtoGrpcType).auth,
	user: (getServiceProvider('user') as unknown as UserProtoGrpcType).user,
	room: (getServiceProvider('room') as unknown as RoomProtoGrpcType).room,
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

export const createGRPCServer = ({ redisClient }: { redisClient: Redis }) => {
	const server = new Server({ 'grpc.keepalive_permit_without_calls': 1, 'grpc.max_reconnect_backoff_ms': 10000 });

	server.addService(ServiceProviders.room.RoomServices.service, {
		findOrCreateDuetRoom: handlerWrapper(findOrCreateDuetRoom, { redisClient, userClient: ServiceClients.user }),
		CreateGroupRoom: handlerWrapper(createGroupRoom, { redisClient }),
		AddUsersToGroupRoom: handlerWrapper(addUsersToGroupRoom, { redisClient }),
		UpdateUserRoleInGroupRoom: handlerWrapper(updateUserRoleInGroupRoom, { redisClient }),
		FetchUserRooms: handlerWrapper(fetchUserRooms, { redisClient }),
		RemoveUsersFromGroupRoom: handlerWrapper(removeUsersFromGroupRoom, { redisClient }),
		UpdateGroupRoomDetails: handlerWrapper(updateGroupRoomDetails, { redisClient }),
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
