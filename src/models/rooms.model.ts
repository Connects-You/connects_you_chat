import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { rooms } from '../schemas';
import { IRoomRaw } from '../types';

export const RoomModel = mongoose.model<IRoomRaw>(rooms.schemaName, rooms.schema, rooms.schemaName);
