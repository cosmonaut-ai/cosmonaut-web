<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Home, LayoutDashboard } from '@lucide/svelte';

	const status = $derived(page.status ?? 500);
	const error = $derived(page.error);

	const is404 = $derived(status === 404);
	const title = $derived(is404 ? 'Lost in the Void' : 'A Cosmic Hiccup');
	const message = $derived(
		is404
			? "This corner of the universe hasn't been charted yet. The page you're looking for doesn't exist or has drifted away."
			: 'Something went sideways in the control room. Our crew is on it — try again in a moment.'
	);
	const illustration = $derived(is404 ? '/art/404-astronaut.webp' : '/art/error-astronaut.webp');

	const prefersReducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;
</script>

<div class="error-root flex min-h-dvh flex-col items-center justify-center bg-background px-6">
	<!-- Ambient glow -->
	<div class="error-glow" aria-hidden="true"></div>

	<!-- Illustration -->
	<div class="error-illustration relative mb-8">
		<img
			src={illustration}
			alt=""
			class="error-float relative z-10 h-48 w-auto object-contain sm:h-56 md:h-64"
			class:error-float-disabled={prefersReducedMotion}
		/>
	</div>

	<!-- Content -->
	<div class="relative z-10 max-w-md text-center">
		<p class="mb-3 text-xs font-medium tracking-[0.3em] text-primary/60 uppercase">
			✦ Error {status} ✦
		</p>
		<h1 class="mb-3 text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
		<p class="mb-8 leading-relaxed text-muted-foreground">{message}</p>
		{#if error?.message && !is404}
			<p
				class="mb-6 rounded-lg border border-border/50 bg-card/50 px-4 py-2 font-mono text-xs text-muted-foreground/70"
			>
				{error.message}
			</p>
		{/if}
		<div class="flex flex-col justify-center gap-3 sm:flex-row">
			<Button href="/" variant="default" class="gap-2">
				<Home class="h-4 w-4" />
				Return Home
			</Button>
			<Button href="/dashboard" variant="outline" class="gap-2">
				<LayoutDashboard class="h-4 w-4" />
				Go to Dashboard
			</Button>
		</div>
	</div>
</div>

<style>
	.error-glow {
		position: absolute;
		top: 25%;
		left: 50%;
		transform: translateX(-50%);
		width: 400px;
		height: 400px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			oklch(from var(--primary) l c h / 0.06) 0%,
			transparent 70%
		);
		filter: blur(60px);
		pointer-events: none;
	}

	.error-float {
		animation: error-float 4s ease-in-out infinite;
	}

	.error-float-disabled {
		animation: none;
	}

	@keyframes error-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-12px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.error-float {
			animation: none;
		}
	}
</style>
