import { grpc } from '@adarsh-mishra/connects_you_services';

export const generateGRPCAuthMetaData = () => {
	const meta = new grpc.Metadata();
	meta.add('api-key', process.env.AUTH_SERVICE_API_KEY);
	return meta;
};

export const generateGRPCUserMetaData = () => {
	const meta = new grpc.Metadata();
	meta.add('api-key', process.env.USER_SERVICE_API_KEY);
	return meta;
};
