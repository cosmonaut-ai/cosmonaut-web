<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { useAuth, SignUpNotConfirmedError } from '$lib/auth/auth.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import SEO from '$lib/components/SEO.svelte';
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
			if (msg.includes('UserNotFoundException')) return 'No account found with this email address.';
			if (msg.includes('CodeMismatchException'))
				return 'Invalid verification code. Please try again.';
			if (msg.includes('ExpiredCodeException'))
				return 'Verification code has expired. Please request a new one.';
			if (msg.includes('LimitExceededException'))
				return 'Too many attempts. Please wait a moment and try again.';
			if (msg.includes('UserNotConfirmedException')) return 'Please verify your email first.';
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
			await auth.signInWithEmail(email, password);
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

<div class="flex min-h-full items-center justify-center bg-background px-4 py-12">
	<div class="w-full max-w-sm">
		<!-- Logo -->
		<div class="mb-8 flex flex-col items-center gap-3">
			<a href="/" class="flex items-center gap-2.5">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<img src="/logo.png" alt="Cosmonaut logo" class="h-7 w-7" />
				</div>
				<span class="text-xl font-semibold text-foreground">Cosmonaut</span>
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
							onEmailChange={(v) => (email = v)}
							onPasswordChange={(v) => (password = v)}
							onConfirmPasswordChange={(v) => (confirmPassword = v)}
							onShowPasswordChange={(v) => (showPassword = v)}
							onShowConfirmPasswordChange={(v) => (showConfirmPassword = v)}
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
							view={view}
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
