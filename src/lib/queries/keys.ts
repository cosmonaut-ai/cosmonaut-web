/**
 * Unified query key factory for TanStack Query.
 *
 * All query/mutation hooks should reference keys from this object so that
 * cache invalidation is predictable and follows a single hierarchical convention.
 *
 * Keys are structured hierarchically: entity → scope → params.
 * This ensures prefix-based invalidation works correctly (e.g., invalidating
 * `queryKeys.nodes.all(sessionId)` also invalidates all node detail queries
 * for that session when `exact` is not set).
 */
export const queryKeys = {
	worlds: {
		featured: ['worlds', 'featured'] as const,
		detail: (id: string) => ['worlds', id] as const,
		inviteToken: (id: string) => ['worlds', id, 'invite-token'] as const
	},
	sessions: {
		all: ['sessions'] as const,
		detail: (sessionId: string) => ['sessions', sessionId] as const,
		handoff: (sessionId: string) => ['sessions', sessionId, 'handoff'] as const
	},
	nodes: {
		all: (sessionId: string) => ['sessions', sessionId, 'nodes'] as const,
		detail: (sessionId: string, nodeId: string) => ['sessions', sessionId, 'nodes', nodeId] as const
	},
	playlists: {
		detail: (id: string) => ['playlists', id] as const
	},
	voices: {
		all: ['voices'] as const
	},
	user: {
		all: ['user'] as const
	}
} as const;
