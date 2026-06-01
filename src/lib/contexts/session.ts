import { getContext, setContext } from 'svelte';
import type { CreateQueryResult } from '@tanstack/svelte-query';
import type { WorldSession } from '$lib/types/api';

const SESSION_CONTEXT_KEY = Symbol('session-query');

type SessionQueryResult = CreateQueryResult<WorldSession, Error>;

export function setSessionContext(query: SessionQueryResult) {
	setContext(SESSION_CONTEXT_KEY, query);
}

export function getSessionContext(): SessionQueryResult {
	return getContext<SessionQueryResult>(SESSION_CONTEXT_KEY);
}
