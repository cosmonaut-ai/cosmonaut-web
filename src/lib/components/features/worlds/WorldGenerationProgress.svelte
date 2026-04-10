<script lang="ts">
	import { goto } from '$app/navigation';
	import { useCyclingText } from '$lib/utils/useCyclingText.svelte';
	import type { WorldGenerationStatus } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
	import { Check, ArrowLeft } from '@lucide/svelte';

	interface Props {
		generationStatus: WorldGenerationStatus;
	}

	let { generationStatus }: Props = $props();

	// Steps with evocative labels
	const steps: { status: WorldGenerationStatus; label: string }[] = [
		{ status: 'initialized', label: 'Igniting the spark' },
		{ status: 'generating_lore', label: 'Weaving lore & history' },
		{ status: 'generating_narrator_profile', label: 'Summoning the narrator' },
		{ status: 'completed', label: 'World forged' }
	];

	// Atmospheric cycling flavor text per status
	const flavorTexts: Record<string, string[]> = {
		initialized: [
			'Gathering stardust...',
			'Charting the cosmic void...',
			'Calibrating dimensional frequencies...'
		],
		generating_lore: [
			'Etching myths into stone...',
			'Mapping ancient trade routes...',
			'Seeding civilizations across continents...',
			'Forging alliances and rivalries...',
			'Writing the songs of forgotten ages...'
		],
		generating_narrator_profile: [
			'Finding the right voice...',
			'Tuning the narrative lens...',
			'Choosing words with care...'
		],
		completed: ['Your world awaits.'],
		failed: ['Something went wrong.']
	};

	const flavor = useCyclingText(() => flavorTexts[generationStatus] ?? ['Processing...']);

	$effect(() => {
		void generationStatus;
		flavor.resetIndex();
	});

	function getProgress(status: WorldGenerationStatus): number {
		switch (status) {
			case 'initialized':
				return 15;
			case 'generating_lore':
				return 45;
			case 'generating_narrator_profile':
				return 75;
			case 'completed':
				return 100;
			case 'failed':
				return 100;
			default:
				return 0;
		}
	}

	function isStepComplete(status: WorldGenerationStatus): boolean {
		return getProgress(generationStatus) > getProgress(status) || generationStatus === 'completed';
	}

	function isStepActive(status: WorldGenerationStatus): boolean {
		return status === generationStatus;
	}

	const progress = $derived(getProgress(generationStatus));
	const isDone = $derived(generationStatus === 'completed');
</script>

<div class="gen-root">
	<!-- Ambient nebula background -->
	<div class="gen-bg" aria-hidden="true">
		<div class="gen-nebula gen-nebula-1"></div>
		<div class="gen-nebula gen-nebula-2"></div>
		<!-- Floating star motes -->
		<div class="gen-mote gen-mote-1"></div>
		<div class="gen-mote gen-mote-2"></div>
		<div class="gen-mote gen-mote-3"></div>
		<div class="gen-mote gen-mote-4"></div>
		<div class="gen-mote gen-mote-5"></div>
	</div>

	<!-- Floating back button -->
	<nav class="gen-nav">
		<Button
			variant="ghost"
			size="sm"
			onclick={() => goto('/dashboard')}
			class="gap-2 text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="h-4 w-4" />
			Back
		</Button>
	</nav>

	<!-- Centered content -->
	<main class="gen-main">
		<!-- Cosmic orb assembly -->
		<div class="gen-cosmos" aria-hidden="true">
			<div class="gen-orbit gen-orbit-1">
				<div class="gen-particle"></div>
			</div>
			<div class="gen-orbit gen-orbit-2">
				<div class="gen-particle"></div>
			</div>
			<div class="gen-orbit gen-orbit-3">
				<div class="gen-particle"></div>
				<div class="gen-particle gen-particle-alt"></div>
			</div>
			<!-- Central orb -->
			<div class="gen-orb" class:gen-orb-done={isDone}>
				<div class="gen-orb-sheen"></div>
			</div>
		</div>

		<!-- Text block -->
		<div class="gen-text">
			<h2 class="gen-title">
				{#if isDone}
					World Forged
				{:else}
					Forging Your World
				{/if}
			</h2>
			<p
				class="gen-flavor"
				class:gen-flavor-visible={flavor.visible}
				role="status"
				aria-live="polite"
			>
				{flavor.text}
			</p>
			{#if !isDone}
				<p class="gen-estimate">This may take 1–2 minutes.</p>
			{/if}
		</div>

		<!-- Progress bar -->
		<div
			class="gen-bar-track"
			role="progressbar"
			aria-valuenow={progress}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label="World generation progress"
		>
			<div class="gen-bar-fill" style="width: {progress}%">
				<div class="gen-bar-glow"></div>
			</div>
		</div>

		<!-- Step timeline -->
		<ol class="gen-steps" aria-label="Generation steps">
			{#each steps as step (step.status)}
				{@const active = isStepActive(step.status)}
				{@const complete = isStepComplete(step.status)}
				<li
					class="gen-step"
					class:gen-step-active={active}
					class:gen-step-complete={complete}
					aria-current={active ? 'step' : undefined}
				>
					<div class="gen-step-icon" aria-hidden="true">
						{#if complete}
							<Check class="h-3 w-3" />
						{:else if active}
							<span class="gen-step-pulse"></span>
						{:else}
							<span class="gen-step-idle"></span>
						{/if}
					</div>
					<span class="gen-step-label">
						{step.label}
						{#if complete}<span class="sr-only">(complete)</span>{/if}
						{#if active}<span class="sr-only">(in progress)</span>{/if}
					</span>
				</li>
			{/each}
		</ol>
	</main>
</div>

<style>
	/* ── Root layout ── */
	.gen-root {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	/* ── Ambient background ── */
	.gen-bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.gen-nebula {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
	}
	.gen-nebula-1 {
		width: 550px;
		height: 550px;
		top: -15%;
		left: 50%;
		transform: translateX(-50%);
		background: radial-gradient(circle, oklch(0.45 0.12 260 / 0.15) 0%, transparent 70%);
	}
	.gen-nebula-2 {
		width: 400px;
		height: 400px;
		bottom: -10%;
		right: -8%;
		background: radial-gradient(circle, oklch(0.55 0.09 98 / 0.07) 0%, transparent 70%);
	}

	/* Floating motes */
	.gen-mote {
		position: absolute;
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: oklch(0.9 0.06 98 / 0.5);
		animation: mote-drift 20s ease-in-out infinite;
	}
	.gen-mote-1 {
		top: 18%;
		left: 12%;
		animation-delay: 0s;
		animation-duration: 22s;
	}
	.gen-mote-2 {
		top: 35%;
		right: 15%;
		animation-delay: -4s;
		animation-duration: 18s;
		width: 3px;
		height: 3px;
	}
	.gen-mote-3 {
		bottom: 28%;
		left: 22%;
		animation-delay: -8s;
		animation-duration: 25s;
	}
	.gen-mote-4 {
		top: 55%;
		right: 28%;
		animation-delay: -12s;
		animation-duration: 20s;
		width: 2.5px;
		height: 2.5px;
	}
	.gen-mote-5 {
		bottom: 15%;
		left: 65%;
		animation-delay: -16s;
		animation-duration: 24s;
	}

	/* ── Navigation ── */
	.gen-nav {
		position: relative;
		z-index: 10;
		padding: 1rem 1.5rem;
	}

	/* ── Main content ── */
	.gen-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0 1.5rem 4rem;
		position: relative;
		z-index: 10;
		gap: 1.75rem;
	}

	/* ── Cosmic orb assembly ── */
	.gen-cosmos {
		position: relative;
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* Orbit rings */
	.gen-orbit {
		position: absolute;
		border-radius: 50%;
		border: 1px solid oklch(0.7 0.05 260 / 0.12);
		inset: 0;
		margin: auto;
	}
	.gen-orbit-1 {
		width: 110px;
		height: 110px;
		animation: spin 14s linear infinite;
	}
	.gen-orbit-2 {
		width: 150px;
		height: 150px;
		animation: spin-reverse 20s linear infinite;
		border-style: dashed;
		border-color: oklch(0.7 0.05 260 / 0.08);
	}
	.gen-orbit-3 {
		width: 190px;
		height: 190px;
		animation: spin 28s linear infinite;
		border-color: oklch(0.7 0.05 260 / 0.06);
	}

	/* Orbit particles */
	.gen-particle {
		position: absolute;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: oklch(0.95 0.08 98);
		box-shadow: 0 0 6px 2px oklch(0.95 0.08 98 / 0.5);
		top: -2px;
		left: 50%;
		transform: translateX(-50%);
	}
	.gen-particle-alt {
		top: auto;
		bottom: -1.5px;
		left: 50%;
		width: 3px;
		height: 3px;
		opacity: 0.7;
	}

	/* Central orb */
	.gen-orb {
		position: relative;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: radial-gradient(
			circle at 38% 32%,
			oklch(0.95 0.09 98 / 0.85) 0%,
			oklch(0.65 0.12 260 / 0.55) 55%,
			oklch(0.35 0.1 260 / 0.25) 100%
		);
		box-shadow:
			0 0 24px 6px oklch(0.95 0.08 98 / 0.18),
			0 0 50px 16px oklch(0.65 0.1 260 / 0.08);
		animation: orb-pulse 3.5s ease-in-out infinite;
		transition:
			box-shadow 0.8s ease,
			background 0.8s ease;
	}
	.gen-orb-done {
		background: radial-gradient(
			circle at 38% 32%,
			oklch(0.98 0.09 98) 0%,
			oklch(0.82 0.1 98 / 0.7) 55%,
			oklch(0.55 0.09 98 / 0.3) 100%
		);
		box-shadow:
			0 0 35px 10px oklch(0.95 0.08 98 / 0.3),
			0 0 70px 25px oklch(0.8 0.09 98 / 0.12);
	}
	.gen-orb-sheen {
		position: absolute;
		inset: 3px;
		border-radius: 50%;
		background: radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.55) 0%, transparent 55%);
	}

	/* ── Text ── */
	.gen-text {
		text-align: center;
		max-width: 320px;
	}
	.gen-title {
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--foreground);
		margin: 0 0 0.375rem;
		letter-spacing: -0.02em;
	}
	.gen-flavor {
		font-size: 0.8125rem;
		color: var(--muted-foreground);
		font-style: italic;
		transition: opacity 0.35s ease;
		min-height: 1.25rem;
		opacity: 0;
		margin: 0;
	}
	.gen-flavor-visible {
		opacity: 1;
	}
	.gen-estimate {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		opacity: 0.6;
		margin: 0.5rem 0 0;
	}

	/* ── Progress bar ── */
	.gen-bar-track {
		width: 100%;
		max-width: 260px;
		height: 3px;
		background: oklch(0.3 0.03 245 / 0.4);
		border-radius: 999px;
		overflow: hidden;
	}
	.gen-bar-fill {
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, oklch(0.6 0.1 260), oklch(0.95 0.08 98));
		transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}
	.gen-bar-glow {
		position: absolute;
		right: -1px;
		top: 50%;
		transform: translateY(-50%);
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: oklch(0.95 0.08 98);
		filter: blur(4px);
		opacity: 0.7;
	}

	/* ── Steps ── */
	.gen-steps {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.gen-step {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}
	.gen-step-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		flex-shrink: 0;
		transition: all 0.3s ease;
		border: 1px solid oklch(0.45 0.03 245);
		background: transparent;
	}
	.gen-step-complete .gen-step-icon {
		background: var(--primary);
		border-color: var(--primary);
		color: var(--primary-foreground);
	}
	.gen-step-active .gen-step-icon {
		border-color: var(--primary);
		background: oklch(0.95 0.08 98 / 0.12);
	}
	.gen-step-pulse {
		display: block;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--primary);
		animation: dot-pulse 1.5s ease-in-out infinite;
	}
	.gen-step-idle {
		display: block;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: oklch(0.45 0.03 245);
	}
	.gen-step-label {
		font-size: 0.8125rem;
		line-height: 1;
		transition: color 0.3s ease;
		color: var(--muted-foreground);
	}
	.gen-step-complete .gen-step-label {
		color: var(--primary);
	}
	.gen-step-active .gen-step-label {
		color: var(--foreground);
		font-weight: 500;
	}

	/* ── Keyframes ── */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes spin-reverse {
		to {
			transform: rotate(-360deg);
		}
	}
	@keyframes orb-pulse {
		0%,
		100% {
			transform: scale(1);
			filter: brightness(1);
		}
		50% {
			transform: scale(1.06);
			filter: brightness(1.15);
		}
	}
	@keyframes dot-pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.4;
			transform: scale(0.7);
		}
	}
	@keyframes mote-drift {
		0%,
		100% {
			transform: translate(0, 0);
			opacity: 0.3;
		}
		25% {
			transform: translate(12px, -18px);
			opacity: 0.7;
		}
		50% {
			transform: translate(-8px, -10px);
			opacity: 0.4;
		}
		75% {
			transform: translate(6px, 8px);
			opacity: 0.6;
		}
	}

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		.gen-orbit-1,
		.gen-orbit-2,
		.gen-orbit-3 {
			animation: none;
		}
		.gen-orb {
			animation: none;
		}
		.gen-step-pulse {
			animation: none;
		}
		.gen-mote {
			animation: none;
			opacity: 0.4;
		}
		.gen-flavor {
			transition: none;
			opacity: 1;
		}
	}
</style>
