/**
 * Canonical metadata for each Cosmonaut guide essay.
 *
 * Source of truth for the dates and identifiers used in the Blog / BlogPosting
 * JSON-LD on /guides and the individual essay routes. Cross-page @id values
 * must match exactly so structured-data consumers can link the entities.
 *
 * Dates were taken from git history at first publication. Update `dateModified`
 * when the essay's prose changes.
 */
export interface GuideMeta {
	/** Slug-style route under the site root (no leading slash, no trailing slash). */
	slug: string;
	/** Stable @id fragment URL for the BlogPosting entity. */
	id: string;
	/** Canonical URL for the essay (with trailing slash, matches our routing). */
	url: string;
	headline: string;
	description: string;
	datePublished: string;
	dateModified: string;
}

export const GUIDES: GuideMeta[] = [
	{
		slug: 'ai-choose-your-own-adventure',
		id: 'https://cosmonaut-ai.com/ai-choose-your-own-adventure/#article',
		url: 'https://cosmonaut-ai.com/ai-choose-your-own-adventure/',
		headline: 'AI choose-your-own-adventure, in a longer lineage',
		description:
			'A short essay on the choose-your-own-adventure form, from the 1979 paperbacks to the AI-written branching stories Cosmonaut writes today.',
		datePublished: '2026-05-18',
		dateModified: '2026-05-18'
	},
	{
		slug: 'ai-bedtime-stories',
		id: 'https://cosmonaut-ai.com/ai-bedtime-stories/#article',
		url: 'https://cosmonaut-ai.com/ai-bedtime-stories/',
		headline: 'A bedtime story that gets to know your kid',
		description:
			'A short essay on custom AI bedtime stories, what one looks like in practice, and how Cosmonaut writes them.',
		datePublished: '2026-05-18',
		dateModified: '2026-05-18'
	},
	{
		slug: 'ai-interactive-fiction',
		id: 'https://cosmonaut-ai.com/ai-interactive-fiction/#article',
		url: 'https://cosmonaut-ai.com/ai-interactive-fiction/',
		headline: 'Interactive fiction for readers',
		description:
			'An essay on AI interactive fiction as a literary form, why Cosmonaut is prose-first rather than chat-first, and what makes a branching story worth reading.',
		datePublished: '2026-05-18',
		dateModified: '2026-05-18'
	}
];

export const BLOG_ID = 'https://cosmonaut-ai.com/guides/#blog';
export const ORG_ID = 'https://cosmonaut-ai.com/#organization';
export const WEBSITE_ID = 'https://cosmonaut-ai.com/#website';

export function getGuide(slug: string): GuideMeta {
	const guide = GUIDES.find((g) => g.slug === slug);
	if (!guide) throw new Error(`Unknown guide slug: ${slug}`);
	return guide;
}
