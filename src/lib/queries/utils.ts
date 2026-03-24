/** A value that can be passed directly or as a getter for reactivity */
export type MaybeGetter<T> = T | (() => T);

/** Resolve a value that might be a getter function */
export function resolve<T>(value: MaybeGetter<T>): T {
	return typeof value === 'function' ? (value as () => T)() : value;
}
