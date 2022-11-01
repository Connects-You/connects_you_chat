import { createOrReturnDBConnection } from '@adarsh-mishra/node-utils/mongoHelpers';
import { redisConnection } from '@adarsh-mishra/node-utils/redisHelpers';
import dotenv from 'dotenv';

import { createGRPCServer } from './services';

// import { createGRPCServer } from './services';

dotenv.config();

const isDevEnvironment = process.env.ENV === 'dev';

void createOrReturnDBConnection({
	dbUri: isDevEnvironment ? process.env.DEV_MONGO_URL : process.env.PROD_MONGO_URL,
});

const redisClient = redisConnection({
	redisHost: isDevEnvironment ? process.env.DEV_REDIS_HOST : process.env.PROD_REDIS_HOST,
	redisPort: isDevEnvironment ? process.env.DEV_REDIS_PORT : process.env.PROD_REDIS_PORT,
	redisDB: isDevEnvironment ? process.env.DEV_REDIS_DB : process.env.PROD_REDIS_DB,
	options: {
		password: isDevEnvironment ? undefined : process.env.PROD_REDIS_PASSWORD,
		username: isDevEnvironment ? undefined : process.env.PROD_REDIS_USERNAME,
	},
});

createGRPCServer({ redisClient });
