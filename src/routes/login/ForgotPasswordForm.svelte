<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ArrowLeft } from '@lucide/svelte';

	type ForgotView = 'forgot' | 'reset';

	interface Props {
		view: ForgotView;
		email: string;
		verificationCode: string;
		newPassword: string;
		confirmNewPassword: string;
		isSubmitting: boolean;
		onEmailChange: (value: string) => void;
		onVerificationCodeChange: (value: string) => void;
		onNewPasswordChange: (value: string) => void;
		onConfirmNewPasswordChange: (value: string) => void;
		onForgotPassword: () => void;
		onResetPassword: () => void;
		onSwitchToSignIn: () => void;
	}

	let {
		view,
		email,
		verificationCode,
		newPassword,
		confirmNewPassword,
		isSubmitting,
		onEmailChange,
		onVerificationCodeChange,
		onNewPasswordChange,
		onConfirmNewPasswordChange,
		onForgotPassword,
		onResetPassword,
		onSwitchToSignIn
	}: Props = $props();

	const passwordsMatch = $derived(newPassword === confirmNewPassword && confirmNewPassword.length > 0);
</script>

{#if view === 'forgot'}
	<div class="space-y-4">
		<p class="text-sm text-muted-foreground">
			Enter your email address and we'll send you a code to reset your password.
		</p>
		<div class="space-y-2">
			<Label for="forgot-email">Email</Label>
			<Input
				id="forgot-email"
				type="email"
				placeholder="you@example.com"
				value={email}
				oninput={(e) => onEmailChange((e.target as HTMLInputElement).value)}
				disabled={isSubmitting}
				autocomplete="email"
			/>
		</div>
		<Button class="w-full" onclick={onForgotPassword} disabled={isSubmitting || !email}>
			{#if isSubmitting}
				<Spinner class="mr-2" />
			{/if}
			Send Reset Code
		</Button>
	</div>
{:else}
	<div class="space-y-4">
		<p class="text-sm text-muted-foreground">
			Enter the code sent to <strong class="text-foreground">{email}</strong> and choose a new
			password.
		</p>
		<div class="space-y-2">
			<Label for="reset-code">Reset code</Label>
			<Input
				id="reset-code"
				type="text"
				placeholder="Enter 6-digit code"
				value={verificationCode}
				oninput={(e) => onVerificationCodeChange((e.target as HTMLInputElement).value)}
				disabled={isSubmitting}
				autocomplete="one-time-code"
				class="text-center text-lg tracking-widest"
			/>
		</div>
		<div class="space-y-2">
			<Label for="new-password">New password</Label>
			<Input
				id="new-password"
				type="password"
				placeholder="Enter new password"
				value={newPassword}
				oninput={(e) => onNewPasswordChange((e.target as HTMLInputElement).value)}
				disabled={isSubmitting}
				autocomplete="new-password"
			/>
		</div>
		<div class="space-y-2">
			<Label for="confirm-new-password">Confirm new password</Label>
			<Input
				id="confirm-new-password"
				type="password"
				placeholder="Confirm new password"
				value={confirmNewPassword}
				oninput={(e) => onConfirmNewPasswordChange((e.target as HTMLInputElement).value)}
				disabled={isSubmitting}
				autocomplete="new-password"
			/>
			{#if confirmNewPassword.length > 0 && newPassword !== confirmNewPassword}
				<p class="text-xs text-destructive">Passwords do not match</p>
			{/if}
		</div>
		<Button
			class="w-full"
			onclick={onResetPassword}
			disabled={isSubmitting ||
				!verificationCode ||
				!newPassword ||
				newPassword !== confirmNewPassword}
		>
			{#if isSubmitting}
				<Spinner class="mr-2" />
			{/if}
			Reset Password
		</Button>
	</div>
{/if}

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
