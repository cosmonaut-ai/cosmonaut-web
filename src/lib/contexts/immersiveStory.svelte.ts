import { getContext, setContext } from 'svelte';
import type { Choice } from '$lib/types/api';

const IMMERSIVE_STORY_CONTEXT_KEY = Symbol('immersive-story');

export interface ImmersiveStoryModel {
	nodeId: string;
	text: string;
	choices: Choice[];
	currentTime: number;
	duration: number;
	ended: boolean;
	timestampsUrl: string | null;
	isNarrationGenerating: boolean;
	isStoryGenerating: boolean;
	worldImageUrl?: string | null;
	worldImageAlt?: string | null;
	title?: string | null;
	loadingProgress: number;
	isEnding: boolean;
	isLoading: boolean;
	isAtQuotaLimit: boolean;
	showCustomChoice: boolean;
	wordSeekEnabled: boolean;
	canGoBack: boolean;
	onBack?: () => void;
	onOpenMap?: () => void;
	onChoiceSelect?: (targetId: string) => void;
	onCustomChoice?: (text: string) => void;
	onRestart?: () => void;
	onWordSeek?: (time: number) => void;
}

export class ImmersiveStoryState {
	active = $state(false);
	model = $state.raw<ImmersiveStoryModel | null>(null);

	setActive(active: boolean) {
		this.active = active;
	}

	publish(model: ImmersiveStoryModel) {
		this.model = model;
	}
}

export function setImmersiveStoryContext() {
	const state = new ImmersiveStoryState();
	setContext(IMMERSIVE_STORY_CONTEXT_KEY, state);
	return state;
}

export function getImmersiveStoryContext(): ImmersiveStoryState {
	return getContext<ImmersiveStoryState>(IMMERSIVE_STORY_CONTEXT_KEY);
}
