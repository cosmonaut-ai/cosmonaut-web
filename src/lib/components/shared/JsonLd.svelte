<script lang="ts">
	import { renderJsonLd } from './jsonLd';

	/**
	 * Renders a JSON-LD structured data block inside <svelte:head>.
	 *
	 * Pass either a single schema object or a top-level @graph object.
	 * Use stable @id URLs (fragment-based on the canonical domain) so entities
	 * can cross-reference each other across pages.
	 */
	interface Props {
		schema: Record<string, unknown>;
	}

	let { schema }: Props = $props();

	const tag = $derived(renderJsonLd(schema));
</script>

<svelte:head>
	<!-- Developer-controlled schema, not user input. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html tag}
</svelte:head>
