export type GenerationStatus =
	| 'initialized'
	| 'generating_lore'
	| 'generating_narrator_profile'
	| 'generating_start_node'
	| 'completed'
	| 'failed';

export type StoryNodeProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type WorldVisibility = 'private' | 'public';

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

export interface StoryNode {
	id: string;
	world_id: string;
	title: string | null;
	text: string;
	story_summary: string | null;
	choices: Choice[];
	parent_id: string | null;
	ancestors: string[];
	processing_status: StoryNodeProcessingStatus;
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
}

export interface UpdateWorldSharingRequest {
	shared_with?: string[] | null;
	visibility?: WorldVisibility | null;
}

export interface ApiError {
	detail: string;
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
