import { UserDetails } from '@adarsh-mishra/connects_you_services/services/user/UserDetails';
import { UserServicesClient } from '@adarsh-mishra/connects_you_services/services/user/UserServices';

import { generateGRPCAuthMetaData } from './generateGRPCAuthMetaData';

export const getUserDetails = async (userId: string, userClient: UserServicesClient) => {
	return new Promise<UserDetails | null | undefined>((resolve, reject) => {
		const meta = generateGRPCAuthMetaData();

		userClient.getUserDetails({ userId }, meta, (err, user) => {
			if (err) {
				reject(err);
			}
			resolve(user?.data?.user);
		});
	});
};
