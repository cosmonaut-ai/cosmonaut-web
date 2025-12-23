export type GenerationStatus =
	| 'initialized'
	| 'generating_lore'
	| 'generating_start_node'
	| 'completed';

export interface Choice {
	label: string;
	target: string | null;
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
	created_at: string;
	updated_at: string;
}

export interface World {
	id: string;
	title: string | null;
	description: string | null;
	genre: string | null;
	generation_status: GenerationStatus;
	author_id: string | null;
	root_node_id: string | null;
	visibility: string | null;
	world_prompt: string | null;
	setting: string | null;
	characters: string[] | null;
	potential_endings: string[] | null;
	story_background: string | null;
	narrator_profile: string | null;
	node_text_length: number | null;
	world_image_url: string | null;
	world_image_alt_text: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateWorldRequest {
	world_prompt: string;
	narrator_profile?: string;
	node_text_length?: number;
	visibility?: string;
}

export interface ApiError {
	detail: string;
}
