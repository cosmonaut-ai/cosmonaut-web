<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { useAuth, SignUpNotConfirmedError } from '$lib/auth/auth.svelte';
	import { updateNewsletter } from '$lib/api/subscription';
	import { Card, CardContent } from '$lib/components/ui/card';
	import SEO from '$lib/components/SEO.svelte';
	import { trackEvent } from '$lib/utils/analytics';
	import SignInForm from './SignInForm.svelte';
	import SignUpForm from './SignUpForm.svelte';
	import VerifyForm from './VerifyForm.svelte';
	import ForgotPasswordForm from './ForgotPasswordForm.svelte';

	const REDIRECT_STORAGE_KEY = 'cosmonaut-auth-redirect';

	type AuthView = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

	const auth = useAuth();

	let view = $state<AuthView>('signin');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let verificationCode = $state('');
	let newPassword = $state('');
	let confirmNewPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let newsletterOptIn = $state(true);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Redirect URL from query params (set by the auth guard in the root layout)
	const redirectParam = $derived(page.url.searchParams.get('redirect'));
	const hasRedirect = $derived(!!redirectParam);

	// Persist redirect URL to localStorage so it survives Google OAuth leaving the page
	onMount(() => {
		if (redirectParam) {
			try {
				localStorage.setItem(REDIRECT_STORAGE_KEY, redirectParam);
			} catch {
				// localStorage might not be available
			}
		}
	});

	/**
	 * Get the post-auth destination and clear the stored redirect.
	 * Prefers the query param, falls back to localStorage, then /dashboard.
	 */
	function consumeRedirectUrl(): string {
		let destination = redirectParam;
		if (!destination) {
			try {
				destination = localStorage.getItem(REDIRECT_STORAGE_KEY);
			} catch {
				// localStorage might not be available
			}
		}
		try {
			localStorage.removeItem(REDIRECT_STORAGE_KEY);
		} catch {
			// localStorage might not be available
		}
		return destination || '/dashboard';
	}

	// Password requirements check
	const passwordChecks = $derived({
		length: password.length >= 8,
		lowercase: /[a-z]/.test(password),
		uppercase: /[A-Z]/.test(password),
		number: /[0-9]/.test(password),
		symbol: /[^a-zA-Z0-9]/.test(password)
	});
	const passwordValid = $derived(
		passwordChecks.length &&
			passwordChecks.lowercase &&
			passwordChecks.uppercase &&
			passwordChecks.number &&
			passwordChecks.symbol
	);
	const passwordsMatch = $derived(password === confirmPassword && confirmPassword.length > 0);

	$effect(() => {
		try {
			if (newsletterOptIn) {
				localStorage.setItem('cosmonaut-newsletter-opt-in', 'true');
			} else {
				localStorage.removeItem('cosmonaut-newsletter-opt-in');
			}
		} catch {
			/* localStorage might not be available */
		}
	});

	// Redirect if already authenticated
	$effect(() => {
		if (auth.isAuthenticated && !auth.isLoading) {
			goto(consumeRedirectUrl());
		}
	});

	function clearMessages() {
		errorMessage = '';
		successMessage = '';
	}

	function switchView(target: AuthView) {
		clearMessages();
		view = target;
	}

	function formatError(error: unknown): string {
		if (error instanceof Error) {
			const msg = error.message;
			if (msg.includes('UserAlreadyAuthenticatedException')) return 'You are already signed in.';
			if (msg.includes('UsernameExistsException'))
				return 'An account with this email already exists.';
			if (msg.includes('InvalidPasswordException')) return 'Password does not meet requirements.';
			if (msg.includes('NotAuthorizedException')) return 'Incorrect email or password.';
			if (msg.includes('UserNotFoundException')) return 'Incorrect email or password.';
			if (msg.includes('CodeMismatchException'))
				return 'Invalid verification code. Please try again.';
			if (msg.includes('ExpiredCodeException'))
				return 'Verification code has expired. Please request a new one.';
			if (msg.includes('LimitExceededException'))
				return 'Too many attempts. Please wait a moment and try again.';
			if (msg.includes('UserNotConfirmedException')) return 'Please verify your email first.';
			if (msg.includes('AccountAlreadyExists'))
				return 'An account with this email already exists. Please sign in with your existing method.';
			return msg;
		}
		return 'An unexpected error occurred. Please try again.';
	}

	async function handleSignIn() {
		if (isSubmitting || !email || !password) return;
		clearMessages();
		isSubmitting = true;
		try {
			await auth.signInWithEmail(email, password);
			trackEvent('login', { method: 'email' });
			goto(consumeRedirectUrl());
		} catch (error) {
			if (error instanceof SignUpNotConfirmedError) {
				view = 'verify';
				successMessage = 'Please enter the verification code sent to your email.';
			} else {
				errorMessage = formatError(error);
			}
		} finally {
			isSubmitting = false;
		}
	}

	async function handleSignUp() {
		if (isSubmitting || !email || !password || !confirmPassword) return;
		if (!passwordValid) {
			errorMessage = 'Please meet all password requirements.';
			return;
		}
		if (!passwordsMatch) {
			errorMessage = 'Passwords do not match.';
			return;
		}
		clearMessages();
		isSubmitting = true;
		try {
			const result = await auth.signUpWithEmail(email, password);
			trackEvent('sign_up', { method: 'email' });
			if (result.isConfirmationRequired) {
				view = 'verify';
				successMessage = 'Check your email for a verification code.';
			} else {
				goto(consumeRedirectUrl());
			}
		} catch (error) {
			errorMessage = formatError(error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleVerify() {
		if (isSubmitting || !verificationCode) return;
		clearMessages();
		isSubmitting = true;
		try {
			await auth.confirmSignUpWithCode(email, verificationCode);
			trackEvent('email_verified');
			await auth.signInWithEmail(email, password);
			try {
				const optedIn = localStorage.getItem('cosmonaut-newsletter-opt-in') === 'true';
				if (optedIn) {
					await updateNewsletter(true);
				}
				localStorage.removeItem('cosmonaut-newsletter-opt-in');
			} catch {
				// Newsletter sync is non-critical
			}
			goto(consumeRedirectUrl());
		} catch (error) {
			errorMessage = formatError(error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleResendCode() {
		if (isSubmitting) return;
		clearMessages();
		isSubmitting = true;
		try {
			await auth.resendVerificationCode(email);
			successMessage = 'A new verification code has been sent to your email.';
		} catch (error) {
			errorMessage = formatError(error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleForgotPassword() {
		if (isSubmitting || !email) return;
		clearMessages();
		isSubmitting = true;
		try {
			await auth.forgotPassword(email);
			view = 'reset';
			successMessage = 'Check your email for a password reset code.';
		} catch (error) {
			errorMessage = formatError(error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleResetPassword() {
		if (isSubmitting || !verificationCode || !newPassword || !confirmNewPassword) return;
		if (newPassword !== confirmNewPassword) {
			errorMessage = 'Passwords do not match.';
			return;
		}
		clearMessages();
		isSubmitting = true;
		try {
			await auth.confirmForgotPassword(email, verificationCode, newPassword);
			trackEvent('password_reset');
			view = 'signin';
			successMessage = 'Password reset successfully. Please sign in with your new password.';
			password = '';
		} catch (error) {
			errorMessage = formatError(error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleGoogleSignIn() {
		if (isSubmitting) return;
		clearMessages();
		isSubmitting = true;
		try {
			trackEvent('login', { method: 'google' });
			await auth.loginWithGoogle();
		} catch (error) {
			errorMessage = formatError(error);
			isSubmitting = false;
		}
	}

	function handleFormKeyDown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		if (view === 'signin') handleSignIn();
		else if (view === 'signup') handleSignUp();
		else if (view === 'verify') handleVerify();
		else if (view === 'forgot') handleForgotPassword();
		else if (view === 'reset') handleResetPassword();
	}
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
		<div class="relative z-10 flex items-center justify-center">
			<img
				src="/art/sign-in-astronaut.webp"
				alt=""
				class="login-astronaut relative z-20 -mr-6 h-36 w-auto object-contain lg:h-44"
			/>
			<img
				src="/art/sign-in-doorway.webp"
				alt=""
				class="login-doorway relative z-10 h-[40vh] w-auto object-contain lg:h-[45vh]"
			/>
		</div>

		<!-- Tagline -->
		<p class="relative z-20 mt-8 font-orbitron text-sm tracking-widest text-primary/70 uppercase">
			Every choice shapes the narrative
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
					<span
						class="-translate-y-1 rounded-full border border-amber-400/60 px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide text-amber-400"
						>BETA</span
					>
				</a>
				<p class="text-sm text-muted-foreground">
					{#if hasRedirect && (view === 'signin' || view === 'signup')}
						Sign in or create an account to continue
					{:else if view === 'signin'}
						Sign in to continue your adventures
					{:else if view === 'signup'}
						Create your account
					{:else if view === 'verify'}
						Verify your email
					{:else if view === 'forgot'}
						Reset your password
					{:else if view === 'reset'}
						Enter your new password
					{/if}
				</p>
			</div>

			<Card class="border-border/50 bg-card/80 backdrop-blur-sm">
				<CardContent class="pt-6">
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<form onkeydown={handleFormKeyDown} onsubmit={(e) => e.preventDefault()}>
						<!-- Messages -->
						{#if errorMessage}
							<div
								class="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
							>
								{errorMessage}
							</div>
						{/if}
						{#if successMessage}
							<div
								class="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary"
							>
								{successMessage}
							</div>
						{/if}

						{#if view === 'signin'}
							<SignInForm
								{email}
								{password}
								{showPassword}
								{isSubmitting}
								onEmailChange={(v) => (email = v)}
								onPasswordChange={(v) => (password = v)}
								onShowPasswordChange={(v) => (showPassword = v)}
								onSignIn={handleSignIn}
								onGoogleSignIn={handleGoogleSignIn}
								onSwitchToSignUp={() => switchView('signup')}
								onSwitchToForgot={() => switchView('forgot')}
							/>
						{:else if view === 'signup'}
							<SignUpForm
								{email}
								{password}
								{confirmPassword}
								{showPassword}
								{showConfirmPassword}
								{passwordChecks}
								{passwordValid}
								{passwordsMatch}
								{isSubmitting}
								{newsletterOptIn}
								onEmailChange={(v) => (email = v)}
								onPasswordChange={(v) => (password = v)}
								onConfirmPasswordChange={(v) => (confirmPassword = v)}
								onShowPasswordChange={(v) => (showPassword = v)}
								onShowConfirmPasswordChange={(v) => (showConfirmPassword = v)}
								onNewsletterChange={(v) => (newsletterOptIn = v)}
								onSignUp={handleSignUp}
								onGoogleSignIn={handleGoogleSignIn}
								onSwitchToSignIn={() => switchView('signin')}
							/>
						{:else if view === 'verify'}
							<VerifyForm
								{email}
								{verificationCode}
								{isSubmitting}
								onVerificationCodeChange={(v) => (verificationCode = v)}
								onVerify={handleVerify}
								onResendCode={handleResendCode}
								onSwitchToSignIn={() => switchView('signin')}
							/>
						{:else if view === 'forgot' || view === 'reset'}
							<ForgotPasswordForm
								{view}
								{email}
								{verificationCode}
								{newPassword}
								{confirmNewPassword}
								{isSubmitting}
								onEmailChange={(v) => (email = v)}
								onVerificationCodeChange={(v) => (verificationCode = v)}
								onNewPasswordChange={(v) => (newPassword = v)}
								onConfirmNewPasswordChange={(v) => (confirmNewPassword = v)}
								onForgotPassword={handleForgotPassword}
								onResetPassword={handleResetPassword}
								onSwitchToSignIn={() => switchView('signin')}
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
