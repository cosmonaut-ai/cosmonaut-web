<script lang="ts">
	import { TriangleAlert } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';

	interface Props {
		variant?: 'inline' | 'page';
	}

	let { variant = 'page' }: Props = $props();
</script>

{#if variant === 'inline'}
	<div class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm text-destructive">
		<p class="font-medium">Account suspended</p>
		<p class="mt-1.5 leading-relaxed">
			This account has been suspended due to a violation of our <a
				href="/terms"
				class="underline hover:opacity-80">Terms of Service</a
			>. If you have questions, please email <a
				href="mailto:support@cosmonaut-ai.com"
				class="underline hover:opacity-80">support@cosmonaut-ai.com</a
			>.
		</p>
	</div>
{:else}
	<div class="flex w-full flex-col items-center">
		<div
			class="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10"
		>
			<TriangleAlert class="h-6 w-6 text-destructive" />
		</div>
		<h2 class="mb-1.5 text-base font-semibold text-foreground">Account suspended</h2>
		<p class="mb-6 text-center text-sm text-muted-foreground">
			This account has been suspended due to a violation of our <a
				href="/terms"
				class="underline hover:opacity-80">Terms of Service</a
			>. If you have questions, please email <a
				href="mailto:support@cosmonaut-ai.com"
				class="underline hover:opacity-80">support@cosmonaut-ai.com</a
			>.
		</p>
		<Button onclick={() => goto('/')}>Return Home</Button>
	</div>
{/if}
