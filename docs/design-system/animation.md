# Animation Patterns

## Transitions

Use smooth, space-inspired animations:

```css
/* Standard transition */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Slide transitions for story branches */
transition:
	transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
	opacity 0.3s ease-out;
```

## Motion Guidelines

1. **Enter**: Fade in + slight upward motion
2. **Exit**: Fade out + slide left (for story branches)
3. **Hover**: Subtle scale (1.02) or glow
4. **Focus**: Ring animation

## Starfield Animation

The landing page features an animated starfield background:

- Multiple layers of stars at different speeds
- Subtle parallax on scroll
- Gentle twinkling effect

## Story Slide Transitions

For navigating between story nodes:

```svelte
<script lang="ts">
	import { fly } from 'svelte/transition';

	let direction = $state<'forward' | 'back'>('forward');
</script>

{#key currentNode.id}
	<div
		in:fly={{ x: direction === 'forward' ? 100 : -100, duration: 300 }}
		out:fly={{ x: direction === 'forward' ? -100 : 100, duration: 300 }}
	>
		<StoryCard node={currentNode} />
	</div>
{/key}
```

## Anti-Patterns

- Don't animate everything—be purposeful
- Don't use jarring or fast animations
- Don't forget `prefers-reduced-motion` support
