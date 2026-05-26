<script lang="ts">
	interface Props {
		options: { value: string; label: string }[];
		value: string;
		onValueChange: (value: string) => void;
		disabled?: boolean;
		label: string;
	}

	let { options, value, onValueChange, disabled = false, label }: Props = $props();
</script>

<div
	class="inline-flex w-full min-w-0 rounded-lg border border-border bg-muted/50 p-1"
	role="radiogroup"
	aria-label={label}
>
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === option.value}
			{disabled}
			onclick={() => onValueChange(option.value)}
			class="min-w-0 flex-1 truncate rounded-md px-3 py-2 text-center text-sm font-medium transition-all
				{value === option.value
				? 'bg-background text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			{option.label}
		</button>
	{/each}
</div>
