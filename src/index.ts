import { createOrReturnDBConnection } from '@adarsh-mishra/node-utils/mongoHelpers';
import dotenv from 'dotenv';

import { createGRPCServer } from './services';

dotenv.config();

const isDevEnvironment = process.env.ENV === 'dev';

void createOrReturnDBConnection({
	dbUri: isDevEnvironment ? process.env.DEV_MONGO_URL : process.env.PROD_MONGO_URL,
});

createGRPCServer();
