import { dev } from '$app/environment';

export const logger = {
	debug: (...args: unknown[]) => {
		if (dev) console.debug('[cosmonaut]', ...args);
	},
	info: (...args: unknown[]) => {
		if (dev) console.info('[cosmonaut]', ...args);
	},
	warn: (...args: unknown[]) => {
		if (dev) console.warn('[cosmonaut]', ...args);
	},
	error: (...args: unknown[]) => {
		if (dev) console.error('[cosmonaut]', ...args);
	}
};
