export const DEFAULT_ROOT_STORY_WORDS = 260;
export const DEFAULT_BRANCH_STORY_WORDS = 180;
export const DEFAULT_NARRATION_GENERATION_MS = 5_000;

const MIN_STORY_TARGET_WORDS = 80;
const MAX_STORY_TARGET_WORDS = 420;
const STORY_OVERALL_SHARE = 0.7;
const NARRATION_OVERALL_SHARE = 1 - STORY_OVERALL_SHARE;

interface StoryGenerationProgressInput {
	text: string | null | undefined;
	isGenerating: boolean;
	isComplete?: boolean;
	targetWords?: number | null;
}

interface NarrationGenerationProgressInput {
	isGenerating: boolean;
	generationStartedAt: number | null | undefined;
	now: number;
	estimatedMs?: number;
}

interface InteractiveStoryProgressInput {
	storyProgress: number;
	isStoryGenerating: boolean;
	isStoryComplete: boolean;
	narrationProgress: number;
	isNarrationGenerating: boolean;
	hasNarration: boolean;
}

function clamp(value: number, min = 0, max = 100): number {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, value));
}

function countWords(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeTargetWords(targetWords: number | null | undefined): number {
	if (!targetWords || !Number.isFinite(targetWords)) return DEFAULT_BRANCH_STORY_WORDS;
	return clamp(targetWords, MIN_STORY_TARGET_WORDS, MAX_STORY_TARGET_WORDS);
}

/**
 * The browser receives extracted story text rather than raw XML. The XML order is
 * still useful as milestones: no story text means plan/pre-story, first text means
 * the stream reached <story>, and done means metadata was parsed and persisted.
 */
export function estimateStoryGenerationProgress({
	text,
	isGenerating,
	isComplete = false,
	targetWords
}: StoryGenerationProgressInput): number {
	if (isComplete) return 100;
	if (!isGenerating) return 0;

	const storyText = text?.trim() ?? '';
	if (!storyText) return 8;

	const target = normalizeTargetWords(targetWords);
	const wordRatio = clamp(countWords(storyText) / target, 0, 1);
	const easedStoryRatio = 1 - Math.pow(1 - wordRatio, 1.35);

	return clamp(18 + easedStoryRatio * 74, 18, 92);
}

export function estimateNarrationGenerationProgress({
	isGenerating,
	generationStartedAt,
	now,
	estimatedMs = DEFAULT_NARRATION_GENERATION_MS
}: NarrationGenerationProgressInput): number {
	if (!isGenerating) return 0;
	if (!generationStartedAt) return 4;

	const elapsed = Math.max(0, now - generationStartedAt);
	const estimate = Math.max(1, estimatedMs);

	return clamp((elapsed / estimate) * 100, 4, 96);
}

export function estimateInteractiveStoryLoadingProgress({
	storyProgress,
	isStoryGenerating,
	isStoryComplete,
	narrationProgress,
	isNarrationGenerating,
	hasNarration
}: InteractiveStoryProgressInput): number {
	if (hasNarration) return 100;

	if (isStoryGenerating || !isStoryComplete) {
		return clamp(storyProgress * STORY_OVERALL_SHARE, 3, STORY_OVERALL_SHARE * 100);
	}

	if (isNarrationGenerating) {
		return clamp(
			STORY_OVERALL_SHARE * 100 + narrationProgress * NARRATION_OVERALL_SHARE,
			STORY_OVERALL_SHARE * 100,
			99
		);
	}

	return STORY_OVERALL_SHARE * 100;
}
