import { getContext, setContext } from 'svelte';
import type { CreateQueryResult } from '@tanstack/svelte-query';
import type { World } from '$lib/types/api';

const WORLD_CONTEXT_KEY = Symbol('world-query');

type WorldQueryResult = CreateQueryResult<World, Error>;

export function setWorldContext(query: WorldQueryResult) {
	setContext(WORLD_CONTEXT_KEY, query);
}

export function getWorldContext(): WorldQueryResult {
	return getContext<WorldQueryResult>(WORLD_CONTEXT_KEY);
}
