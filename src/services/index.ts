import { getServiceProvider, grpc } from '@adarsh-mishra/connects_you_services/index';
import { ProtoGrpcType as AuthProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/auth';
import { ProtoGrpcType as RoomProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/room';
import { ProtoGrpcType as UserProtoGrpcType } from '@adarsh-mishra/connects_you_services/services/user';
import { Redis } from '@adarsh-mishra/node-utils/redisHelpers';
import { Server, ServerCredentials } from '@grpc/grpc-js';

import { addUsersToGroupRoom } from '../handlers/room/addUsersToGroupRoom';
import { createGroupRoom } from '../handlers/room/createGroupRoom';
import { fetchUserRooms } from '../handlers/room/fetchUserRooms';
import { findOrCreateDuetRoom } from '../handlers/room/findOrCreateDuetRoom';
import { removeUsersFromGroupRoom } from '../handlers/room/removeUserFromGroupRoom';
import { updateGroupRoomDetails } from '../handlers/room/updateGroupRoomDetails';
import { updateUserRoleInGroupRoom } from '../handlers/room/updateUserRoleInGroupRoom';
import { handlerWrapper } from '../helpers/grpcHandlersWrapper';

const ServiceProviders = {
	auth: (getServiceProvider('auth') as unknown as AuthProtoGrpcType).auth,
	user: (getServiceProvider('user') as unknown as UserProtoGrpcType).user,
	room: (getServiceProvider('room') as unknown as RoomProtoGrpcType).room,
};

const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 5);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initializeClient = (service: any, port: number, serviceName: string) => {
	const client = new service(`0.0.0.0:${port}`, grpc.credentials.createInsecure());
	client.waitForReady(deadline, (error) => {
		if (error) {
			/* eslint-disable no-console */
			return console.error(`${serviceName} ->> 0.0.0.0:${port} error`, error);
		}
		console.log(`${serviceName} ->> 0.0.0.0:${port} is ready`);
		/* eslint-enable no-console */
	});
	return client;
};

export const ServiceClients = {
	auth: initializeClient(ServiceProviders.auth.AuthServices, 1000, 'auth'),
	user: initializeClient(ServiceProviders.user.UserServices, 1000, 'user'),
};

const port = `0.0.0.0:${process.env.PORT || 2000}`;

export const createGRPCServer = ({ redisClient }: { redisClient: Redis }) => {
	const server = new Server({ 'grpc.keepalive_permit_without_calls': 1 });

	server.addService(ServiceProviders.room.RoomServices.service, {
		findOrCreateDuetRoom: handlerWrapper(findOrCreateDuetRoom, { redisClient, userClient: ServiceClients.user }),
		CreateGroupRoom: handlerWrapper(createGroupRoom, { redisClient }),
		AddUsersToGroupRoom: handlerWrapper(addUsersToGroupRoom, { redisClient }),
		UpdateUserRoleInGroupRoom: handlerWrapper(updateUserRoleInGroupRoom, { redisClient }),
		FetchUserRooms: handlerWrapper(fetchUserRooms, { redisClient }),
		RemoveUsersFromGroupRoom: handlerWrapper(removeUsersFromGroupRoom, { redisClient }),
		UpdateGroupRoomDetails: handlerWrapper(updateGroupRoomDetails, { redisClient }),
	});

	server.bindAsync(port.toString(), ServerCredentials.createInsecure(), (error, port) => {
		if (error) {
			throw error;
		}
		// eslint-disable-next-line no-console
		console.log(`Server running at ${port}`);
		server.start();
	});
};
