// Helper for the JsonLd Svelte component. Lives in a .ts file so the literal
// closing-script sequence below cannot confuse the Svelte template parser.
const END_SCRIPT = '<' + '/';
const ESCAPED = '<\\' + '/';

/**
 * Serialize a JSON-LD schema and wrap it in an inline script tag string.
 * Any "</" inside string fields is escaped so a stray closing-script sequence
 * cannot break out of the surrounding tag.
 */
export function renderJsonLd(schema: Record<string, unknown>): string {
	const json = JSON.stringify(schema).split(END_SCRIPT).join(ESCAPED);
	return `<script type="application/ld+json">${json}</script>`;
}
