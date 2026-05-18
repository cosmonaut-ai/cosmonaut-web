<script lang="ts">
	const SITE_NAME = 'Cosmonaut';
	const SITE_URL = 'https://cosmonaut-ai.com';
	const DEFAULT_OG_IMAGE = '/og-image.png';
	const DEFAULT_OG_IMAGE_WIDTH = 2230;
	const DEFAULT_OG_IMAGE_HEIGHT = 1454;

	interface Props {
		title: string;
		description: string;
		path: string;
		ogImage?: string;
		ogImageWidth?: number;
		ogImageHeight?: number;
		ogImageAlt?: string;
		ogType?: string;
		noindex?: boolean;
		jsonLd?: Record<string, unknown>;
	}

	let {
		title,
		description,
		path,
		ogImage = DEFAULT_OG_IMAGE,
		ogImageWidth = DEFAULT_OG_IMAGE_WIDTH,
		ogImageHeight = DEFAULT_OG_IMAGE_HEIGHT,
		ogImageAlt = `${SITE_NAME} — AI choose-your-own-adventure stories for families`,
		ogType = 'website',
		noindex = false,
		jsonLd
	}: Props = $props();

	const canonicalUrl = $derived(`${SITE_URL}${path.endsWith('/') ? path : path + '/'}`);
	const absoluteOgImage = $derived(ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`);

	// Construct JSON-LD script tag as a string to avoid eslint parser issues with <script> in templates
	const jsonLdTag = $derived(
		jsonLd ? `<${'script'} type="application/ld+json">${JSON.stringify(jsonLd)}</${'script'}>` : ''
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:image" content={absoluteOgImage} />
	<meta property="og:image:width" content={String(ogImageWidth)} />
	<meta property="og:image:height" content={String(ogImageHeight)} />
	<meta property="og:image:alt" content={ogImageAlt} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={absoluteOgImage} />
	<meta name="twitter:image:alt" content={ogImageAlt} />

	<!-- JSON-LD structured data (safe: content is developer-controlled, not user input) -->
	{#if jsonLd}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdTag}
	{/if}
</svelte:head>
