<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Rocket, LogIn } from '@lucide/svelte';
	import { browser } from '$app/environment';

	interface Props {
		onGetStarted?: () => void | Promise<void>;
		onSignIn?: () => void | Promise<void>;
		isLoading?: boolean;
	}

	let { onGetStarted, onSignIn, isLoading = false }: Props = $props();

	// ── Mouse parallax (lerped) ──
	let targetMx = $state(0);
	let targetMy = $state(0);
	let mx = $state(0);
	let my = $state(0);

	const LERP_FACTOR = 0.04;

	const prefersReducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	function handleMouseMove(e: MouseEvent) {
		if (prefersReducedMotion) return;
		targetMx = (e.clientX / window.innerWidth - 0.5) * 2;
		targetMy = (e.clientY / window.innerHeight - 0.5) * 2;
	}

	$effect(() => {
		let frame: number;
		function loop() {
			mx += (targetMx - mx) * LERP_FACTOR;
			my += (targetMy - my) * LERP_FACTOR;
			frame = requestAnimationFrame(loop);
		}
		frame = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(frame);
	});
</script>

<svelte:window onmousemove={handleMouseMove} />

<section
	class="pt:0 relative flex min-h-screen flex-col items-end justify-center overflow-hidden px-6 pb-12 md:pt-40 md:pb-32"
>
	<!-- Gradient overlay for depth -->
	<div
		class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-background/50 to-background"
	></div>

	<!-- Clouds (top-right, mirrored, decorative) -->
	<div
		class="pointer-events-none absolute top-0 right-0 z-20 w-[140vw] max-w-[500px] md:w-[50vw] md:max-w-none"
	>
		<img
			src="/art/clouds.webp"
			alt=""
			class="h-full w-full -scale-x-100 object-contain opacity-80"
		/>
	</div>

	<!-- Two-column layout -->
	<div
		class="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-4 md:grid-cols-2 md:gap-12 lg:gap-16"
	>
		<!-- Left column: Text content -->
		<div class="text-center md:text-left">
			<!-- Decorative stars -->

			<!-- Main title with glow effect -->
			<h1 class="hero-title hero-enter hero-enter-2 mb-3 font-bold tracking-tight md:mb-6">
				<span class="font-orbitron text-xl tracking-widest text-foreground md:text-2xl lg:text-3xl"
					>WELCOME TO</span
				>
				<br />
				<span
					class="font-orbitron text-4xl font-bold tracking-widest text-primary md:text-5xl lg:text-6xl"
					>COSMONAUT</span
				>
			</h1>

			<!-- Subtitle -->
			<p
				class="hero-enter hero-enter-3 mx-auto mb-6 max-w-2xl text-sm text-muted-foreground md:mx-0 md:mb-12 md:text-base lg:text-lg"
			>
				Describe any world - a mystery, a kingdom, a spaceship with a secret - and Cosmonaut builds
				it into a branching story shaped by your choices.
			</p>

			<!-- CTA Buttons -->
			<div
				class="hero-enter hero-enter-4 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start md:gap-4"
			>
				<Button size="lg" class="group gap-2 px-8" onclick={onGetStarted} disabled={isLoading}>
					{#if isLoading}
						<Spinner class="h-5 w-5" />
					{:else}
						<Rocket
							class="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
						/>
					{/if}
					Begin Your Journey
				</Button>
				<Button
					variant="ghost"
					size="lg"
					class="gap-2 text-muted-foreground hover:text-foreground"
					onclick={onSignIn}
					disabled={isLoading}
				>
					{#if isLoading}
						<Spinner class="h-5 w-5" />
						Signing in...
					{:else}
						<LogIn class="h-5 w-5" />
						Sign In
					{/if}
				</Button>
			</div>
		</div>

		<!-- Right column: Art composition (appears first on mobile) -->
		<div
			class="relative order-first mx-auto aspect-square w-full max-w-[220px] md:order-0 md:max-w-none"
		>
			<!-- Parallax layer: Planet 1 (farthest, least movement) -->
			<div
				class="parallax-layer pointer-events-none absolute inset-0"
				style="translate: {mx * -14}px {my * -14}px"
			>
				<div class="planet planet-1 absolute top-[8%] right-[8%] w-[14%]">
					<img src="/art/planet1.webp" alt="" class="h-full w-full object-contain drop-shadow-lg" />
				</div>
			</div>

			<!-- Parallax layer: Planet 2 (mid-ground) -->
			<div
				class="parallax-layer pointer-events-none absolute inset-0"
				style="translate: {mx * -8}px {my * -8}px"
			>
				<div class="planet planet-2 absolute right-[2%] bottom-[25%] w-[11%]">
					<img src="/art/planet2.webp" alt="" class="h-full w-full object-contain drop-shadow-lg" />
				</div>
			</div>

			<!-- Parallax layer: Planet 3 (closest, most movement) -->
			<div
				class="parallax-layer pointer-events-none absolute inset-0"
				style="translate: {mx * -4}px {my * -4}px"
			>
				<div class="planet planet-3 absolute top-[45%] left-[0%] w-[9%]">
					<img src="/art/planet3.webp" alt="" class="h-full w-full object-contain drop-shadow-lg" />
				</div>
			</div>

			<!-- Parallax layer: Astronaut (foreground) -->
			<div class="parallax-layer absolute inset-0" style="translate: {mx * -18}px {my * -18}px">
				<div
					class="astronaut absolute top-[10%] left-1/2 z-10 w-[55%] -translate-x-1/2 md:top-[-20%] md:left-[5%] md:w-[75%] md:translate-x-0"
				>
					<img
						src="/art/astronaut.png"
						alt="Floating astronaut"
						class="h-full w-full object-contain drop-shadow-2xl"
					/>
				</div>
			</div>
		</div>
	</div>

	<!-- Scroll indicator -->
	<div
		class="hero-enter hero-enter-5 absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-center motion-safe:animate-bounce md:block"
	>
		<div class="mx-auto h-14 w-8 rounded-full border-2 border-muted-foreground/30 p-1">
			<div class="mx-auto h-3 w-1.5 rounded-full bg-primary/60"></div>
		</div>
		<p class="mt-3 text-xs tracking-wider text-muted-foreground/60 uppercase">Scroll to explore</p>
	</div>
</section>

<style>
	/* ── Title glow ── */
	.hero-title {
		text-shadow: 0 0 80px oklch(from var(--primary) l c h / 0.15);
	}

	.hero-title span:last-child {
		text-shadow:
			0 0 40px oklch(from var(--primary) l c h / 0.4),
			0 0 80px oklch(from var(--primary) l c h / 0.2);
	}

	/* ── Staggered text entrance animations ── */
	.hero-enter {
		animation: hero-fade-up 0.8s ease-out both;
	}
	.hero-enter-2 {
		animation-delay: 0.25s;
	}
	.hero-enter-3 {
		animation-delay: 0.45s;
	}
	.hero-enter-4 {
		animation-delay: 0.65s;
	}
	.hero-enter-5 {
		animation-delay: 1s;
	}

	@keyframes hero-fade-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ── Parallax layers ── */
	.parallax-layer {
		will-change: translate;
	}

	/* ── Planet floating animations ── */
	.planet {
		animation: planet-float var(--float-duration, 5s) ease-in-out infinite;
		animation-delay: var(--float-delay, 0s);
	}
	.planet-1 {
		--float-duration: 5s;
		--float-delay: 0s;
		--float-distance: 8px;
	}
	.planet-2 {
		--float-duration: 6s;
		--float-delay: 1.5s;
		--float-distance: 6px;
	}
	.planet-3 {
		--float-duration: 7s;
		--float-delay: 3s;
		--float-distance: 4px;
	}

	@keyframes planet-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(calc(-1 * var(--float-distance, 6px)));
		}
	}

	/* ── Astronaut entrance + perpetual float ── */
	.astronaut {
		animation: astronaut-float 4s ease-in-out infinite;
	}

	@keyframes astronaut-enter {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes astronaut-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-16px);
		}
	}

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		.hero-enter {
			animation: none;
			opacity: 1;
		}
		.planet {
			animation: none;
		}
		.astronaut {
			animation: none;
			opacity: 1;
		}
		.parallax-layer {
			will-change: auto;
		}
	}
</style>
