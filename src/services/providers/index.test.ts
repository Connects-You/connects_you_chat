import { createOrReturnDBConnection } from '@adarsh-mishra/node-utils/mongoHelpers';
import dotenv from 'dotenv';

// import { authenticateTest } from './auth/authenticate/__test';
// import { refreshTokenTest } from './auth/refreshToken/__test';

dotenv.config();

describe('connects_you_user', () => {
	let db;
	beforeAll(async () => {
		db = await createOrReturnDBConnection({ dbUri: process.env.DEV_MONGO_URL });
	});
	// authenticateTest();
	// refreshTokenTest();
	afterAll(() => {
		db.destroy();
	});
});
