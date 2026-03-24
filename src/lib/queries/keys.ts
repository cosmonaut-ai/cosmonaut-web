/**
 * Unified query key factory for TanStack Query.
 *
 * All query/mutation hooks should reference keys from this object so that
 * cache invalidation is predictable and follows a single hierarchical convention.
 *
 * Keys are structured hierarchically: entity → scope → params.
 * This ensures prefix-based invalidation works correctly (e.g., invalidating
 * `queryKeys.nodes.all(worldId)` also invalidates all node detail queries
 * for that world when `exact` is not set).
 */
export const queryKeys = {
	worlds: {
		all: ['worlds'] as const,
		detail: (id: string) => ['worlds', id] as const,
		inviteToken: (id: string) => ['worlds', id, 'invite-token'] as const
	},
	nodes: {
		all: (worldId: string) => ['worlds', worldId, 'nodes'] as const,
		detail: (worldId: string, nodeId: string) => ['worlds', worldId, 'nodes', nodeId] as const,
		progress: (worldId: string) => ['worlds', worldId, 'progress'] as const
	},
	voices: {
		all: ['voices'] as const
	},
	user: {
		all: ['user'] as const
	}
} as const;
