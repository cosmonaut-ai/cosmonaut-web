<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ArrowLeft } from '@lucide/svelte';

	interface Props {
		email: string;
		verificationCode: string;
		isSubmitting: boolean;
		onVerificationCodeChange: (value: string) => void;
		onVerify: () => void;
		onResendCode: () => void;
		onSwitchToSignIn: () => void;
	}

	let {
		email,
		verificationCode,
		isSubmitting,
		onVerificationCodeChange,
		onVerify,
		onResendCode,
		onSwitchToSignIn
	}: Props = $props();
</script>

<div class="space-y-4">
	<p class="text-sm text-muted-foreground">
		We sent a verification code to <strong class="text-foreground">{email}</strong>.
	</p>
	<div class="space-y-2">
		<Label for="verify-code">Verification code</Label>
		<Input
			id="verify-code"
			type="text"
			placeholder="Enter 6-digit code"
			value={verificationCode}
			oninput={(e) => onVerificationCodeChange((e.target as HTMLInputElement).value)}
			disabled={isSubmitting}
			autocomplete="one-time-code"
			class="text-center text-lg tracking-widest"
		/>
	</div>
	<Button class="w-full" onclick={onVerify} disabled={isSubmitting || !verificationCode}>
		{#if isSubmitting}
			<Spinner class="mr-2" />
		{/if}
		Verify Email
	</Button>
	<div class="text-center">
		<button
			type="button"
			class="text-sm text-muted-foreground transition-colors hover:text-primary"
			onclick={onResendCode}
			disabled={isSubmitting}
		>
			Didn't receive a code? Resend
		</button>
	</div>
</div>

<p class="mt-6 text-center text-sm text-muted-foreground">
	<button
		type="button"
		class="inline-flex items-center gap-1 font-medium text-primary hover:underline"
		onclick={onSwitchToSignIn}
	>
		<ArrowLeft class="h-3.5 w-3.5" />
		Back to sign in
	</button>
</p>
