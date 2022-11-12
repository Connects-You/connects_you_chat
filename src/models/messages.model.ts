import { mongoose } from '@adarsh-mishra/node-utils/mongoHelpers';

import { messages } from '../schemas';
import { IMessageRaw } from '../types/message';

export const MessageModel = mongoose.model<IMessageRaw>(messages.schemaName, messages.schema, messages.schemaName);
