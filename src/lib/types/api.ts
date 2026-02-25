export type WorldGenerationStatus =
	| 'initialized'
	| 'generating_lore'
	| 'generating_narrator_profile'
	| 'completed'
	| 'failed';

/** @deprecated Use WorldGenerationStatus instead */
export type GenerationStatus = WorldGenerationStatus;

export type StoryNodeProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type StoryNodeGenerationStatus = 'initialized' | 'generating' | 'completed' | 'failed';

export type WorldVisibility = 'private' | 'public';

export type WorldLength = 'short' | 'medium' | 'long';

export interface Choice {
	label: string;
	outcome?: string | null;
	target: string | null;
	is_created?: boolean;
	is_custom?: boolean;
	creator?: string | null;
}

export interface Character {
	name: string | null;
	description: string | null;
	relationships: string[] | null;
}

export interface Location {
	name: string | null;
	description: string | null;
	connections: string[] | null;
}

export interface Voice {
	id: string;
	display_name: string;
	description: string;
	sample_url: string;
}

export interface StoryNode {
	id: string;
	world_id: string;
	title: string | null;
	text: string | null;
	story_summary: string | null;
	choices: Choice[];
	parent_id: string | null;
	parent_choice: Choice | null;
	ancestors: string[];
	processing_status: StoryNodeProcessingStatus;
	generation_status: StoryNodeGenerationStatus;
	/** Map of voice_id → CDN audio URL for generated narrations */
	audio: Record<string, string>;
	created_at: string;
	updated_at?: string;
}

export interface World {
	id: string;
	title: string | null;
	description: string | null;
	genre: string | null;
	score: string | null;
	generation_status: GenerationStatus;
	author_id: string | null;
	root_node_id: string | null;
	visibility: WorldVisibility | null;
	shared_with: string[] | null;
	world_prompt: string | null;
	setting: string | null;
	narrative_context: string | null;
	characters: Character[] | null;
	locations: Location[] | null;
	potential_endings: string[] | null;
	narrator_profile: string | null;
	node_text_length: number | null;
	story_max_nodes: number | null;
	world_length: WorldLength | null;
	family_friendly: boolean;
	world_image_url: string | null;
	world_image_alt_text: string | null;
	world_image_width: string | null;
	world_image_height: string | null;
	world_image_size: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateWorldRequest {
	world_prompt: string;
	visibility?: WorldVisibility;
	world_length?: WorldLength;
	family_friendly?: boolean;
}

export interface UpdateWorldSharingRequest {
	shared_with?: string[] | null;
	visibility?: WorldVisibility | null;
}

/**
 * Typed API error that carries the HTTP status code.
 * Thrown by `handleResponse` and the SSE parser so callers can branch
 * on status (e.g. `err.isQuotaExceeded`) instead of string-matching.
 */
export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly detail: string
	) {
		super(detail);
		this.name = 'ApiError';
	}

	get isQuotaExceeded(): boolean {
		return this.status === 429;
	}

	get isStorageQuotaExceeded(): boolean {
		return this.status === 403;
	}

	get isForbidden(): boolean {
		return this.status === 403;
	}

	get isNotFound(): boolean {
		return this.status === 404;
	}

	get isUnauthorized(): boolean {
		return this.status === 401;
	}

	/**
	 * Whether the error indicates the node has already been processed (completed/generating).
	 * This can happen in two scenarios:
	 * - A network error mid-stream: the server finishes but the client retries (HTTP 400)
	 * - A race condition where two requests both pass the pre-check and the second
	 *   fails at the atomic status transition, returning via SSE error (status 500)
	 * We match on the message pattern only, since the status code varies by error path.
	 */
	get isNodeAlreadyProcessed(): boolean {
		return /Cannot generate text for node .+ with status (completed|generating)/i.test(
			this.detail
		);
	}

	/**
	 * Whether the error indicates a node processing conflict (409 Conflict).
	 * Returned by the /choose endpoint when the target node has a processing error
	 * (e.g. failed fact extraction). The node can be recovered via /retry-processing.
	 */
	get isNodeProcessingConflict(): boolean {
		return this.status === 409;
	}
}

/**
 * Request body for the choose endpoint
 * Exactly one of choice_index or custom_choice must be set
 */
export interface ChooseRequest {
	choice_index: number | null;
	custom_choice: string | null;
}

/**
 * Callback for streaming text updates
 */
export type StreamingCallback = (text: string, done: boolean) => void;
