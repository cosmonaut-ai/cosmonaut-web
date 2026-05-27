export interface ElevenLabsAlignment {
	characters?: string[];
	character_start_times_seconds?: number[];
	character_end_times_seconds?: number[];
}

export interface CaptionWord {
	type: 'word';
	id: string;
	text: string;
	start: number;
	end: number;
	wordIndex: number;
	emphasized: boolean;
}

export interface CaptionSpace {
	type: 'space';
	id: string;
	text: string;
}

export type CaptionToken = CaptionWord | CaptionSpace;

export interface CaptionParagraph {
	id: string;
	tokens: CaptionToken[];
}

interface RawParagraph {
	text: string;
	startIndex: number;
}

interface DisplayChar {
	char: string;
	rawIndex: number;
	emphasized: boolean;
}

interface WordDraft {
	text: string;
	rawStart: number;
	rawEnd: number;
	emphasized: boolean;
}

const FALLBACK_WORD_SECONDS = 0.35;
const ACTIVE_WORD_LEEWAY_SECONDS = 0.08;

function normalizeStoryText(text: string): string {
	return text.replace(/\r\n/g, '\n').trim();
}

function splitRawParagraphs(text: string): RawParagraph[] {
	const paragraphs: RawParagraph[] = [];
	let startIndex = 0;

	for (const match of text.matchAll(/\n\s*\n/g)) {
		const boundaryIndex = match.index ?? 0;
		const rawParagraph = text.slice(startIndex, boundaryIndex);
		const leadingWhitespace = rawParagraph.search(/\S/);

		if (leadingWhitespace >= 0) {
			const trimmedEnd = rawParagraph.search(/\s*$/);
			const endIndex = trimmedEnd >= 0 ? trimmedEnd : rawParagraph.length;
			paragraphs.push({
				text: rawParagraph.slice(leadingWhitespace, endIndex),
				startIndex: startIndex + leadingWhitespace
			});
		}

		startIndex = boundaryIndex + match[0].length;
	}

	const tail = text.slice(startIndex);
	const leadingWhitespace = tail.search(/\S/);
	if (leadingWhitespace >= 0) {
		const trimmedEnd = tail.search(/\s*$/);
		const endIndex = trimmedEnd >= 0 ? trimmedEnd : tail.length;
		paragraphs.push({
			text: tail.slice(leadingWhitespace, endIndex),
			startIndex: startIndex + leadingWhitespace
		});
	}

	return paragraphs;
}

function toDisplayChars(rawText: string, rawStartIndex: number): DisplayChar[] {
	const chars: DisplayChar[] = [];
	let emphasized = false;

	for (let i = 0; i < rawText.length; i++) {
		const char = rawText[i];

		if (char === '*') {
			emphasized = !emphasized;
			continue;
		}

		chars.push({
			char,
			rawIndex: rawStartIndex + i,
			emphasized
		});
	}

	return chars;
}

function alignmentOffset(alignmentText: string, storyText: string): number {
	const exactOffset = alignmentText.indexOf(storyText);
	if (exactOffset >= 0) return exactOffset;

	const compactAlignment = alignmentText.replace(/\s+/g, ' ').trim();
	const compactStory = storyText.replace(/\s+/g, ' ').trim();
	const compactOffset = compactAlignment.indexOf(compactStory);

	return compactOffset >= 0 ? compactOffset : 0;
}

function firstFiniteAtOrAfter(
	values: number[],
	startIndex: number,
	endIndex: number
): number | null {
	for (let i = Math.max(0, startIndex); i <= Math.min(values.length - 1, endIndex); i++) {
		const value = values[i];
		if (Number.isFinite(value)) return value;
	}
	return null;
}

function lastFiniteAtOrBefore(
	values: number[],
	startIndex: number,
	endIndex: number
): number | null {
	for (let i = Math.min(values.length - 1, startIndex); i >= Math.max(0, endIndex); i--) {
		const value = values[i];
		if (Number.isFinite(value)) return value;
	}
	return null;
}

function pushWordToken(
	tokens: CaptionToken[],
	draft: WordDraft | null,
	starts: number[],
	ends: number[],
	offset: number,
	wordIndex: number,
	previousEnd: number
): { wordIndex: number; previousEnd: number } {
	if (!draft) return { wordIndex, previousEnd };

	const alignmentStart = draft.rawStart + offset;
	const alignmentEnd = draft.rawEnd + offset;
	const start = firstFiniteAtOrAfter(starts, alignmentStart, alignmentEnd) ?? previousEnd;
	const end =
		lastFiniteAtOrBefore(ends, alignmentEnd, alignmentStart) ??
		Math.max(start + FALLBACK_WORD_SECONDS, previousEnd + FALLBACK_WORD_SECONDS);

	if (!Number.isFinite(start) || !Number.isFinite(end)) {
		return { wordIndex, previousEnd };
	}

	const normalizedEnd = end <= start ? start + FALLBACK_WORD_SECONDS : end;

	tokens.push({
		type: 'word',
		id: `word-${wordIndex}-${draft.rawStart}`,
		text: draft.text,
		start,
		end: normalizedEnd,
		wordIndex,
		emphasized: draft.emphasized
	});

	return {
		wordIndex: wordIndex + 1,
		previousEnd: normalizedEnd
	};
}

export function isCaptionWord(token: CaptionToken): token is CaptionWord {
	return token.type === 'word';
}

export function buildCaptionParagraphs(
	text: string,
	alignment: ElevenLabsAlignment
): CaptionParagraph[] {
	const storyText = normalizeStoryText(text);
	const starts = alignment.character_start_times_seconds ?? [];
	const ends = alignment.character_end_times_seconds ?? [];
	const characters = alignment.characters ?? [];

	if (!storyText || starts.length === 0 || ends.length === 0 || characters.length === 0) {
		return [];
	}

	const offset = alignmentOffset(characters.join(''), storyText);
	let previousEnd = 0;
	let wordIndex = 0;

	return splitRawParagraphs(storyText).flatMap((paragraph, paragraphIndex) => {
		const displayChars = toDisplayChars(paragraph.text, paragraph.startIndex);
		const tokens: CaptionToken[] = [];
		let currentWord: WordDraft | null = null;

		for (const displayChar of displayChars) {
			if (/\s/.test(displayChar.char)) {
				const result = pushWordToken(
					tokens,
					currentWord,
					starts,
					ends,
					offset,
					wordIndex,
					previousEnd
				);
				wordIndex = result.wordIndex;
				previousEnd = result.previousEnd;
				currentWord = null;

				if (tokens.length > 0 && tokens[tokens.length - 1].type !== 'space') {
					tokens.push({
						type: 'space',
						id: `space-${paragraphIndex}-${displayChar.rawIndex}`,
						text: ' '
					});
				}
				continue;
			}

			if (!currentWord) {
				currentWord = {
					text: displayChar.char,
					rawStart: displayChar.rawIndex,
					rawEnd: displayChar.rawIndex,
					emphasized: displayChar.emphasized
				};
			} else {
				currentWord.text += displayChar.char;
				currentWord.rawEnd = displayChar.rawIndex;
				currentWord.emphasized = currentWord.emphasized || displayChar.emphasized;
			}
		}

		const result = pushWordToken(tokens, currentWord, starts, ends, offset, wordIndex, previousEnd);
		wordIndex = result.wordIndex;
		previousEnd = result.previousEnd;

		if (tokens[tokens.length - 1]?.type === 'space') {
			tokens.pop();
		}

		if (tokens.length === 0) return [];

		return [
			{
				id: `paragraph-${paragraphIndex}-${paragraph.startIndex}`,
				tokens
			}
		];
	});
}

export function getCaptionWords(paragraphs: CaptionParagraph[]): CaptionWord[] {
	return paragraphs.flatMap((paragraph) => paragraph.tokens.filter(isCaptionWord));
}

export function findActiveCaptionWordIndex(words: CaptionWord[], currentTime: number): number {
	if (words.length === 0) return -1;

	const time = Number.isFinite(currentTime) ? currentTime : 0;
	const directMatch = words.find(
		(word) => time >= word.start - ACTIVE_WORD_LEEWAY_SECONDS && time <= word.end + 0.02
	);

	if (directMatch) return directMatch.wordIndex;
	if (time < words[0].start) return words[0].wordIndex;

	for (let i = words.length - 1; i >= 0; i--) {
		if (time >= words[i].start) return words[i].wordIndex;
	}

	return words[0].wordIndex;
}
