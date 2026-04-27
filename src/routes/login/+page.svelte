<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import SEO from '$lib/components/shared/SEO.svelte';
	import { detectInAppBrowser } from '$lib/utils/in-app-browser';
	import { showInfo } from '$lib/utils/toast';
	import { saveRedirectUrl, consumeRedirectUrl } from '$lib/auth/redirect';
	import { useLoginFlow } from '$lib/auth/useLoginFlow.svelte';
	import SignInForm from '$lib/components/features/auth/SignInForm.svelte';
	import SignUpForm from '$lib/components/features/auth/SignUpForm.svelte';
	import VerifyForm from '$lib/components/features/auth/VerifyForm.svelte';
	import ForgotPasswordForm from '$lib/components/features/auth/ForgotPasswordForm.svelte';

	const redirectParam = $derived(page.url.searchParams.get('redirect'));
	const hasRedirect = $derived(!!redirectParam);

	function getRedirectDestination(): string {
		return consumeRedirectUrl(redirectParam);
	}

	const flow = useLoginFlow(getRedirectDestination);

	let isInAppBrowser = $state(false);

	const taglines = [
		"Don't forget your spacesuit!",
		'Not all who wander are lost',
		'SPEAK AND ENTER!',
		'Hope you remember your password',
		'The universe is waiting for you',
		'Pizza is underrated, no?',
		'A good story is like a good meal',
		'The future is now',
		'Powered by Claude',
		'Try narration out!'
	];

	const tagline = $derived(taglines[Math.floor(Math.random() * taglines.length)]);

	onMount(() => {
		const { isInApp } = detectInAppBrowser();
		isInAppBrowser = isInApp;

		if (redirectParam) {
			saveRedirectUrl(redirectParam);
		}
		if (page.url.searchParams.get('expired') === 'true') {
			showInfo('Session expired', 'Please sign in again to continue.');
		}
	});

	$effect(() => {
		if (flow.auth.isAuthenticated && !flow.auth.isLoading) {
			goto(getRedirectDestination());
		}
	});
</script>

<SEO
	title="Sign In - Cosmonaut"
	description="Sign in or create your Cosmonaut account."
	path="/login"
	noindex
/>

<div class="flex min-h-full flex-col bg-background md:flex-row">
	<!-- Left panel: Illustration (desktop only) -->
	<div
		class="login-panel relative hidden flex-col items-center justify-center overflow-hidden md:flex md:flex-1"
	>
		<!-- Ambient glow -->
		<div class="login-glow" aria-hidden="true"></div>

		<!-- Astronaut + Doorway composition -->
		<div class="relative z-10 flex h-[clamp(240px,35vh,400px)] items-center justify-center">
			<img
				src="/art/sign-in-astronaut.webp"
				alt=""
				class="login-astronaut relative z-20 -mr-6 h-[38%] w-auto object-contain"
			/>
			<img
				src="/art/sign-in-doorway.webp"
				alt=""
				class="login-doorway relative z-10 h-full w-auto object-contain"
			/>
		</div>

		<!-- Tagline -->
		<p class="relative z-20 mt-8 font-orbitron text-sm tracking-widest text-primary/70 uppercase">
			{tagline}
		</p>
	</div>

	<!-- Right panel: Form -->
	<div
		class="flex w-full flex-col items-center justify-center px-4 py-8 md:flex-1 md:border-l md:border-border/30 md:py-12"
	>
		<div class="w-full max-w-sm">
			<!-- Logo -->
			<div class="mb-8 flex flex-col items-center gap-3">
				<a href="/" class="flex items-center gap-2.5">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<img src="/logo.png" alt="Cosmonaut logo" class="h-7 w-7" />
					</div>
					<span class="font-orbitron text-xl font-semibold text-foreground">Cosmonaut</span>
				</a>
				<p class="text-sm text-muted-foreground">
					{#if flow.isSuspended}
						Your account has been suspended
					{:else if hasRedirect && (flow.view === 'signin' || flow.view === 'signup')}
						Sign in or create an account to continue
					{:else if flow.view === 'signin'}
						Sign in to continue your adventures
					{:else if flow.view === 'signup'}
						Create your account
					{:else if flow.view === 'verify'}
						Verify your email
					{:else if flow.view === 'forgot'}
						Reset your password
					{:else if flow.view === 'reset'}
						Enter your new password
					{/if}
				</p>
			</div>

			<Card class="border-border/50 bg-card/80 backdrop-blur-sm">
				<CardContent class="pt-6">
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<form onkeydown={flow.handleFormKeyDown} onsubmit={(e) => e.preventDefault()}>
						<!-- Messages -->
						{#if flow.errorMessage}
							<div
								class="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
							>
								{flow.errorMessage}
							</div>
						{/if}
						{#if flow.successMessage}
							<div
								class="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary"
							>
								{flow.successMessage}
							</div>
						{/if}

						{#if flow.isSuspended}
							<div
								class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm text-destructive"
							>
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
						{:else if flow.view === 'signin'}
							<SignInForm
								email={flow.email}
								password={flow.password}
								showPassword={flow.showPassword}
								isSubmitting={flow.isSubmitting}
								{isInAppBrowser}
								onEmailChange={(v) => (flow.email = v)}
								onPasswordChange={(v) => (flow.password = v)}
								onShowPasswordChange={(v) => (flow.showPassword = v)}
								onSignIn={flow.handleSignIn}
								onGoogleSignIn={() => flow.handleGoogleSignIn(isInAppBrowser)}
								onSwitchToSignUp={() => flow.switchView('signup')}
								onSwitchToForgot={() => flow.switchView('forgot')}
							/>
						{:else if flow.view === 'signup'}
							<SignUpForm
								email={flow.email}
								password={flow.password}
								confirmPassword={flow.confirmPassword}
								showPassword={flow.showPassword}
								showConfirmPassword={flow.showConfirmPassword}
								passwordChecks={flow.passwordChecks}
								passwordValid={flow.passwordValid}
								passwordsMatch={flow.passwordsMatch}
								isSubmitting={flow.isSubmitting}
								{isInAppBrowser}
								onEmailChange={(v) => (flow.email = v)}
								onPasswordChange={(v) => (flow.password = v)}
								onConfirmPasswordChange={(v) => (flow.confirmPassword = v)}
								onShowPasswordChange={(v) => (flow.showPassword = v)}
								onShowConfirmPasswordChange={(v) => (flow.showConfirmPassword = v)}
								onSignUp={flow.handleSignUp}
								onGoogleSignIn={() => flow.handleGoogleSignIn(isInAppBrowser)}
								onSwitchToSignIn={() => flow.switchView('signin')}
							/>
						{:else if flow.view === 'verify'}
							<VerifyForm
								email={flow.email}
								verificationCode={flow.verificationCode}
								isSubmitting={flow.isSubmitting}
								onVerificationCodeChange={(v) => (flow.verificationCode = v)}
								onVerify={flow.handleVerify}
								onResendCode={flow.handleResendCode}
								onSwitchToSignIn={() => flow.switchView('signin')}
							/>
						{:else if flow.view === 'forgot' || flow.view === 'reset'}
							<ForgotPasswordForm
								view={flow.view}
								email={flow.email}
								verificationCode={flow.verificationCode}
								newPassword={flow.newPassword}
								confirmNewPassword={flow.confirmNewPassword}
								isSubmitting={flow.isSubmitting}
								onEmailChange={(v) => (flow.email = v)}
								onVerificationCodeChange={(v) => (flow.verificationCode = v)}
								onNewPasswordChange={(v) => (flow.newPassword = v)}
								onConfirmNewPasswordChange={(v) => (flow.confirmNewPassword = v)}
								onForgotPassword={flow.handleForgotPassword}
								onResetPassword={flow.handleResetPassword}
								onSwitchToSignIn={() => flow.switchView('signin')}
							/>
						{/if}
					</form>
				</CardContent>
			</Card>

			<!-- Footer links -->
			<div class="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
				<a href="/terms" class="transition-colors hover:text-foreground">Terms</a>
				<a href="/privacy" class="transition-colors hover:text-foreground">Privacy</a>
				<a href="/about" class="transition-colors hover:text-foreground">About</a>
			</div>
		</div>
	</div>
</div>

<style>
	.login-glow {
		position: absolute;
		top: 40%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 500px;
		height: 500px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			oklch(from var(--primary) l c h / 0.08) 0%,
			transparent 70%
		);
		filter: blur(60px);
		pointer-events: none;
	}

	.login-doorway {
		filter: drop-shadow(0 0 40px oklch(from var(--primary) l c h / 0.15));
	}

	.login-astronaut {
		animation: astronaut-drift 5s ease-in-out infinite;
		filter: drop-shadow(0 0 20px oklch(from var(--primary) l c h / 0.1));
	}

	@keyframes astronaut-drift {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(10px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.login-astronaut {
			animation: none;
		}
	}
</style>
