import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** MSW server for Node/Vitest environment. Requirements: 16.4 */
export const server = setupServer(...handlers);
