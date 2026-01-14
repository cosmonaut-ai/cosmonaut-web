<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let animationId: number;

	interface Star {
		x: number;
		y: number;
		baseX: number;
		baseY: number;
		size: number;
		opacity: number;
		speed: number;
		twinkleSpeed: number;
		twinkleOffset: number;
		twinkleIntensity: number;
		// Random flicker timing
		nextFlicker: number;
		flickerDuration: number;
		isFlickering: boolean;
		flickerStart: number;
		// Parallax depth (0 = far/slow, 1 = close/fast)
		depth: number;
	}

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let stars: Star[] = [];
		let width = 0;
		let height = 0;
		let scrollY = 0;
		let targetScrollY = 0;

		function resize() {
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = width;
			canvas.height = height;
			initStars();
		}

		function initStars() {
			const starCount = Math.floor((width * height) / 2500);
			stars = [];

			for (let i = 0; i < starCount; i++) {
				const x = Math.random() * width;
				const y = Math.random() * height;
				const depth = Math.random();

				stars.push({
					x,
					y,
					baseX: x,
					baseY: y,
					size: Math.random() * 1.5 + 0.3 + depth * 0.8,
					opacity: Math.random() * 0.6 + 0.2 + depth * 0.2,
					speed: Math.random() * 0.3 + 0.05,
					twinkleSpeed: Math.random() * 0.015 + 0.005,
					twinkleOffset: Math.random() * Math.PI * 2,
					twinkleIntensity: Math.random() * 0.4 + 0.1,
					nextFlicker: Math.random() * 10000,
					flickerDuration: 0,
					isFlickering: false,
					flickerStart: 0,
					depth
				});
			}
		}

		function handleScroll() {
			targetScrollY = window.scrollY;
		}

		function draw(time: number) {
			if (!ctx) return;

			// Smooth scroll following
			scrollY += (targetScrollY - scrollY) * 0.1;

			ctx.clearRect(0, 0, width, height);

			// Parallax offset for nebulas based on scroll
			const nebulaOffsetY = scrollY * 0.05;

			const gradient = ctx.createRadialGradient(
				width * 0.3,
				height * 0.4 - nebulaOffsetY * 0.5,
				0,
				width * 0.3,
				height * 0.4 - nebulaOffsetY * 0.5,
				width * 0.6
			);
			gradient.addColorStop(0, 'rgba(149, 117, 52, 0.03)');
			gradient.addColorStop(0.5, 'rgba(149, 117, 52, 0.01)');
			gradient.addColorStop(1, 'transparent');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, width, height);

			// Second nebula
			const gradient2 = ctx.createRadialGradient(
				width * 0.7,
				height * 0.6 - nebulaOffsetY * 0.3,
				0,
				width * 0.7,
				height * 0.6 - nebulaOffsetY * 0.3,
				width * 0.5
			);
			gradient2.addColorStop(0, 'rgba(100, 130, 180, 0.02)');
			gradient2.addColorStop(0.5, 'rgba(100, 130, 180, 0.01)');
			gradient2.addColorStop(1, 'transparent');
			ctx.fillStyle = gradient2;
			ctx.fillRect(0, 0, width, height);

			// Draw stars
			for (const star of stars) {
				// Parallax offset based on scroll and star depth
				// Deeper stars (depth closer to 0) move slower
				// Closer stars (depth closer to 1) move faster
				const parallaxY = scrollY * star.depth * 0.15;

				// Update position with parallax
				star.x = star.baseX;
				star.y = star.baseY - parallaxY;

				// Wrap stars that go off screen
				const wrappedY = (((star.y % (height + 100)) + height + 100) % (height + 100)) - 50;

				// Base twinkle (smooth sine wave)
				const baseTwinkle =
					Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * star.twinkleIntensity + 0.8;

				// Random flicker logic
				if (!star.isFlickering && time > star.nextFlicker) {
					star.isFlickering = true;
					star.flickerStart = time;
					star.flickerDuration = Math.random() * 200 + 100;
				}

				let flickerMultiplier = 1;
				if (star.isFlickering) {
					const flickerProgress = (time - star.flickerStart) / star.flickerDuration;
					if (flickerProgress >= 1) {
						star.isFlickering = false;
						star.nextFlicker = time + Math.random() * 8000 + 2000;
					} else {
						// Sharp flicker effect
						flickerMultiplier = 1 + Math.sin(flickerProgress * Math.PI * 4) * 0.5;
						// Random brightness spikes
						if (Math.random() > 0.7) {
							flickerMultiplier *= 0.5 + Math.random();
						}
					}
				}

				const currentOpacity = Math.min(1, star.opacity * baseTwinkle * flickerMultiplier);

				// Star glow
				const glowGradient = ctx.createRadialGradient(
					star.x,
					wrappedY,
					0,
					star.x,
					wrappedY,
					star.size * 3
				);
				glowGradient.addColorStop(0, `rgba(255, 248, 230, ${currentOpacity})`);
				glowGradient.addColorStop(0.5, `rgba(255, 248, 230, ${currentOpacity * 0.3})`);
				glowGradient.addColorStop(1, 'transparent');

				ctx.fillStyle = glowGradient;
				ctx.beginPath();
				ctx.arc(star.x, wrappedY, star.size * 3, 0, Math.PI * 2);
				ctx.fill();

				// Star core
				ctx.fillStyle = `rgba(255, 252, 245, ${currentOpacity})`;
				ctx.beginPath();
				ctx.arc(star.x, wrappedY, star.size, 0, Math.PI * 2);
				ctx.fill();
			}

			animationId = requestAnimationFrame(draw);
		}

		resize();
		window.addEventListener('resize', resize);
		window.addEventListener('scroll', handleScroll, { passive: true });
		animationId = requestAnimationFrame(draw);

		return () => {
			window.removeEventListener('resize', resize);
			window.removeEventListener('scroll', handleScroll);
			cancelAnimationFrame(animationId);
		};
	});
</script>

<canvas bind:this={canvas} class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true"
></canvas>
