<script lang="ts">
	import { browser } from '$app/environment';
	import { prefersReducedMotion } from '$lib/utils/media';

	interface Props {
		percentage: number;
		label?: string;
		size?: number;
		planetSrc?: string;
		class?: string;
	}

	let {
		percentage,
		label = 'Loading',
		size = 176,
		planetSrc = '/art/planet1.webp',
		class: className = ''
	}: Props = $props();

	const viewBoxSize = 160;
	const center = viewBoxSize / 2;
	const orbitRadius = 61;
	const strokeWidth = 5;
	const planetSize = 22;
	const circumference = 2 * Math.PI * orbitRadius;
	const progressPlanetGap = planetSize / 2 + strokeWidth / 2 + 3;
	const MIN_ANIMATION_DURATION_MS = 260;
	const MAX_ANIMATION_DURATION_MS = 700;

	const clampedPercentage = $derived(
		Number.isFinite(percentage) ? Math.min(100, Math.max(0, percentage)) : 0
	);
	let animatedPercentage = $state(0);
	let currentAnimatedPercentage = 0;
	let hasInitializedAnimation = false;
	let animationFrame: number | null = null;

	const displayPercentage = $derived(Math.round(animatedPercentage));
	const progressRatio = $derived(animatedPercentage / 100);
	const completedArc = $derived(Math.max(0, circumference * progressRatio - progressPlanetGap));
	const remainingArc = $derived(Math.max(0, circumference - completedArc));
	const planetAngle = $derived(progressRatio * Math.PI * 2 - Math.PI / 2);
	const planetCenterX = $derived(center + orbitRadius * Math.cos(planetAngle));
	const planetCenterY = $derived(center + orbitRadius * Math.sin(planetAngle));
	const loaderStyle = $derived(
		`width: min(${size}px, 100%); --orbit-loader-font-size: ${Math.max(size * 0.18, 24)}px;`
	);

	function cancelProgressAnimation() {
		if (animationFrame === null) return;

		cancelAnimationFrame(animationFrame);
		animationFrame = null;
	}

	function setAnimatedPercentage(value: number) {
		currentAnimatedPercentage = value;
		animatedPercentage = value;
	}

	function easeOutCubic(progress: number) {
		return 1 - Math.pow(1 - progress, 3);
	}

	$effect(() => {
		const targetPercentage = clampedPercentage;

		if (!browser || prefersReducedMotion) {
			cancelProgressAnimation();
			hasInitializedAnimation = true;
			setAnimatedPercentage(targetPercentage);
			return;
		}

		if (!hasInitializedAnimation) {
			hasInitializedAnimation = true;
			setAnimatedPercentage(targetPercentage);
			return;
		}

		const startPercentage = currentAnimatedPercentage;
		const distance = targetPercentage - startPercentage;

		cancelProgressAnimation();

		if (Math.abs(distance) < 0.1) {
			setAnimatedPercentage(targetPercentage);
			return;
		}

		const duration = Math.min(
			MAX_ANIMATION_DURATION_MS,
			Math.max(MIN_ANIMATION_DURATION_MS, Math.abs(distance) * 8)
		);
		const start = performance.now();

		const step = (now: number) => {
			const progress = Math.min((now - start) / duration, 1);
			setAnimatedPercentage(startPercentage + distance * easeOutCubic(progress));

			if (progress < 1) {
				animationFrame = requestAnimationFrame(step);
			} else {
				animationFrame = null;
				setAnimatedPercentage(targetPercentage);
			}
		};

		animationFrame = requestAnimationFrame(step);

		return () => {
			cancelProgressAnimation();
		};
	});
</script>

<div
	class="orbit-loader {className}"
	style={loaderStyle}
	role="progressbar"
	aria-label={label}
	aria-valuemin="0"
	aria-valuemax="100"
	aria-valuenow={displayPercentage}
	aria-valuetext={`${displayPercentage}% ${label}`}
>
	<svg class="orbit-loader__svg" viewBox="0 0 {viewBoxSize} {viewBoxSize}" aria-hidden="true">
		<circle
			class="orbit-loader__track"
			cx={center}
			cy={center}
			r={orbitRadius}
			fill="none"
			stroke-width={strokeWidth}
			stroke-dasharray="2 9"
			transform="rotate(-90 {center} {center})"
		/>

		{#if completedArc > 0.5}
			<circle
				class="orbit-loader__progress"
				cx={center}
				cy={center}
				r={orbitRadius}
				fill="none"
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-dasharray={`${completedArc} ${remainingArc}`}
				transform="rotate(-90 {center} {center})"
			/>
		{/if}

		<foreignObject
			class="orbit-loader__planet-object"
			x={planetCenterX - planetSize / 2}
			y={planetCenterY - planetSize / 2}
			width={planetSize}
			height={planetSize}
		>
			<img class="orbit-loader__planet-image" src={planetSrc} alt="" />
		</foreignObject>
	</svg>

	<div class="orbit-loader__center" aria-hidden="true">
		<span>{displayPercentage}%</span>
	</div>
</div>

<style>
	.orbit-loader {
		position: relative;
		display: grid;
		aspect-ratio: 1;
		place-items: center;
		color: inherit;
	}

	.orbit-loader__svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.orbit-loader__track {
		stroke: currentColor;
		opacity: 0.28;
	}

	.orbit-loader__progress {
		stroke: var(--primary);
		filter: drop-shadow(0 0 8px oklch(from var(--primary) l c h / 0.42));
	}

	.orbit-loader__planet-object {
		filter: drop-shadow(0 4px 10px rgb(0 0 0 / 0.32));
	}

	.orbit-loader__planet-image {
		width: 100%;
		height: 100%;
		border-radius: 9999px;
		object-fit: cover;
		object-position: 50% 48%;
	}

	.orbit-loader__center {
		position: absolute;
		inset: 27%;
		display: grid;
		place-items: center;
	}

	.orbit-loader__center span {
		font-family: var(--font-orbitron);
		font-size: var(--orbit-loader-font-size);
		font-weight: 750;
		line-height: 1;
		letter-spacing: 0;
		color: currentColor;
		text-shadow:
			0 2px 10px rgb(0 0 0 / 0.55),
			0 0 18px oklch(from var(--primary) l c h / 0.24);
	}
</style>
