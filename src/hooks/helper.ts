import { DEBUG } from '../config/env';

// Debug logging function
const log = (...args: any) => {
    if (DEBUG) {
        console.log(...args);
    }
};

export {log}