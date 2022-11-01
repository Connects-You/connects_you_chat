import { grpc } from '@adarsh-mishra/connects_you_services';

export const generateGRPCAuthMetaData = () => {
	const meta = new grpc.Metadata();
	meta.add('api-key', process.env.API_KEY);
	return meta;
};
