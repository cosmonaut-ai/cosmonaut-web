<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth, SignUpNotConfirmedError } from '$lib/auth/auth.svelte';
	import { isLocalEnvironment } from '$lib/config';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { ArrowLeft, Mail, Eye, EyeOff } from '@lucide/svelte';
	import SEO from '$lib/components/SEO.svelte';

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
			goto('/dashboard');
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
			if (msg.includes('InvalidPasswordException'))
				return 'Password does not meet requirements.';
			if (msg.includes('NotAuthorizedException')) return 'Incorrect email or password.';
			if (msg.includes('UserNotFoundException'))
				return 'No account found with this email address.';
			if (msg.includes('CodeMismatchException'))
				return 'Invalid verification code. Please try again.';
			if (msg.includes('ExpiredCodeException'))
				return 'Verification code has expired. Please request a new one.';
			if (msg.includes('LimitExceededException'))
				return 'Too many attempts. Please wait a moment and try again.';
			if (msg.includes('UserNotConfirmedException'))
				return 'Please verify your email first.';
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
			goto('/dashboard');
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
				goto('/dashboard');
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
			// Sign in after verification
			await auth.signInWithEmail(email, password);
			goto('/dashboard');
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

<SEO title="Sign In - Cosmonaut" description="Sign in or create your Cosmonaut account." path="/login" noindex />

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
				{#if view === 'signin'}
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
						<div class="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
							{errorMessage}
						</div>
					{/if}
					{#if successMessage}
						<div class="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
							{successMessage}
						</div>
					{/if}

					<!-- ========== SIGN IN ========== -->
					{#if view === 'signin'}
						<div class="space-y-4">
							<div class="space-y-2">
								<Label for="email">Email</Label>
								<Input id="email" type="email" placeholder="you@example.com" bind:value={email} disabled={isSubmitting} autocomplete="email" />
							</div>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Label for="password">Password</Label>
									<button type="button" class="text-xs text-muted-foreground hover:text-primary transition-colors" onclick={() => switchView('forgot')}>
										Forgot password?
									</button>
								</div>
								<div class="relative">
									<Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" bind:value={password} disabled={isSubmitting} autocomplete="current-password" />
									<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onclick={() => (showPassword = !showPassword)}>
										{#if showPassword}
											<EyeOff class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>
							</div>
							<Button class="w-full" onclick={handleSignIn} disabled={isSubmitting || !email || !password}>
								{#if isSubmitting}
									<Spinner class="mr-2" />
								{:else}
									<Mail class="mr-2 h-4 w-4" />
								{/if}
								Sign In
							</Button>
						</div>

						<div class="my-6 flex items-center gap-3">
							<Separator class="flex-1" />
							<span class="text-xs text-muted-foreground">or</span>
							<Separator class="flex-1" />
						</div>

						<Button variant="outline" class="w-full" onclick={handleGoogleSignIn} disabled={isSubmitting}>
							{#if isSubmitting}
								<Spinner class="mr-2" />
							{:else}
								<svg class="mr-2 h-4 w-4" viewBox="0 0 24 24">
									<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
									<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
									<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
									<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
								</svg>
							{/if}
							Continue with Google
						</Button>

						<p class="mt-6 text-center text-sm text-muted-foreground">
							Don't have an account?
							<button type="button" class="font-medium text-primary hover:underline" onclick={() => switchView('signup')}>
								Sign up
							</button>
						</p>

					<!-- ========== SIGN UP ========== -->
					{:else if view === 'signup'}
						<div class="space-y-4">
							<div class="space-y-2">
								<Label for="signup-email">Email</Label>
								<Input id="signup-email" type="email" placeholder="you@example.com" bind:value={email} disabled={isSubmitting} autocomplete="email" />
							</div>
							<div class="space-y-2">
								<Label for="signup-password">Password</Label>
								<div class="relative">
									<Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" bind:value={password} disabled={isSubmitting} autocomplete="new-password" />
									<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onclick={() => (showPassword = !showPassword)}>
										{#if showPassword}
											<EyeOff class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>
								<!-- Password requirements -->
								{#if password.length > 0}
									<div class="grid grid-cols-2 gap-1 text-xs">
										<span class={passwordChecks.length ? 'text-green-500' : 'text-muted-foreground'}>
											{passwordChecks.length ? '\u2713' : '\u2022'} 8+ characters
										</span>
										<span class={passwordChecks.uppercase ? 'text-green-500' : 'text-muted-foreground'}>
											{passwordChecks.uppercase ? '\u2713' : '\u2022'} Uppercase
										</span>
										<span class={passwordChecks.lowercase ? 'text-green-500' : 'text-muted-foreground'}>
											{passwordChecks.lowercase ? '\u2713' : '\u2022'} Lowercase
										</span>
										<span class={passwordChecks.number ? 'text-green-500' : 'text-muted-foreground'}>
											{passwordChecks.number ? '\u2713' : '\u2022'} Number
										</span>
										<span class={passwordChecks.symbol ? 'text-green-500' : 'text-muted-foreground'}>
											{passwordChecks.symbol ? '\u2713' : '\u2022'} Symbol
										</span>
									</div>
								{/if}
							</div>
							<div class="space-y-2">
								<Label for="confirm-password">Confirm password</Label>
								<div class="relative">
									<Input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" bind:value={confirmPassword} disabled={isSubmitting} autocomplete="new-password" />
									<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onclick={() => (showConfirmPassword = !showConfirmPassword)}>
										{#if showConfirmPassword}
											<EyeOff class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>
								{#if confirmPassword.length > 0 && !passwordsMatch}
									<p class="text-xs text-destructive">Passwords do not match</p>
								{/if}
							</div>
							<Button class="w-full" onclick={handleSignUp} disabled={isSubmitting || !email || !passwordValid || !passwordsMatch}>
								{#if isSubmitting}
									<Spinner class="mr-2" />
								{/if}
								Create Account
							</Button>
						</div>

						<div class="my-6 flex items-center gap-3">
							<Separator class="flex-1" />
							<span class="text-xs text-muted-foreground">or</span>
							<Separator class="flex-1" />
						</div>

						<Button variant="outline" class="w-full" onclick={handleGoogleSignIn} disabled={isSubmitting}>
							{#if isSubmitting}
								<Spinner class="mr-2" />
							{:else}
								<svg class="mr-2 h-4 w-4" viewBox="0 0 24 24">
									<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
									<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
									<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
									<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
								</svg>
							{/if}
							Continue with Google
						</Button>

						<p class="mt-6 text-center text-sm text-muted-foreground">
							Already have an account?
							<button type="button" class="font-medium text-primary hover:underline" onclick={() => switchView('signin')}>
								Sign in
							</button>
						</p>

					<!-- ========== VERIFY CODE ========== -->
					{:else if view === 'verify'}
						<div class="space-y-4">
							<p class="text-sm text-muted-foreground">
								We sent a verification code to <strong class="text-foreground">{email}</strong>.
							</p>
							<div class="space-y-2">
								<Label for="verify-code">Verification code</Label>
								<Input id="verify-code" type="text" placeholder="Enter 6-digit code" bind:value={verificationCode} disabled={isSubmitting} autocomplete="one-time-code" class="text-center tracking-widest text-lg" />
							</div>
							<Button class="w-full" onclick={handleVerify} disabled={isSubmitting || !verificationCode}>
								{#if isSubmitting}
									<Spinner class="mr-2" />
								{/if}
								Verify Email
							</Button>
							<div class="text-center">
								<button type="button" class="text-sm text-muted-foreground hover:text-primary transition-colors" onclick={handleResendCode} disabled={isSubmitting}>
									Didn't receive a code? Resend
								</button>
							</div>
						</div>

						<p class="mt-6 text-center text-sm text-muted-foreground">
							<button type="button" class="inline-flex items-center gap-1 font-medium text-primary hover:underline" onclick={() => switchView('signin')}>
								<ArrowLeft class="h-3.5 w-3.5" />
								Back to sign in
							</button>
						</p>

					<!-- ========== FORGOT PASSWORD ========== -->
					{:else if view === 'forgot'}
						<div class="space-y-4">
							<p class="text-sm text-muted-foreground">
								Enter your email address and we'll send you a code to reset your password.
							</p>
							<div class="space-y-2">
								<Label for="forgot-email">Email</Label>
								<Input id="forgot-email" type="email" placeholder="you@example.com" bind:value={email} disabled={isSubmitting} autocomplete="email" />
							</div>
							<Button class="w-full" onclick={handleForgotPassword} disabled={isSubmitting || !email}>
								{#if isSubmitting}
									<Spinner class="mr-2" />
								{/if}
								Send Reset Code
							</Button>
						</div>

						<p class="mt-6 text-center text-sm text-muted-foreground">
							<button type="button" class="inline-flex items-center gap-1 font-medium text-primary hover:underline" onclick={() => switchView('signin')}>
								<ArrowLeft class="h-3.5 w-3.5" />
								Back to sign in
							</button>
						</p>

					<!-- ========== RESET PASSWORD ========== -->
					{:else if view === 'reset'}
						<div class="space-y-4">
							<p class="text-sm text-muted-foreground">
								Enter the code sent to <strong class="text-foreground">{email}</strong> and choose a new password.
							</p>
							<div class="space-y-2">
								<Label for="reset-code">Reset code</Label>
								<Input id="reset-code" type="text" placeholder="Enter 6-digit code" bind:value={verificationCode} disabled={isSubmitting} autocomplete="one-time-code" class="text-center tracking-widest text-lg" />
							</div>
							<div class="space-y-2">
								<Label for="new-password">New password</Label>
								<Input id="new-password" type="password" placeholder="Enter new password" bind:value={newPassword} disabled={isSubmitting} autocomplete="new-password" />
							</div>
							<div class="space-y-2">
								<Label for="confirm-new-password">Confirm new password</Label>
								<Input id="confirm-new-password" type="password" placeholder="Confirm new password" bind:value={confirmNewPassword} disabled={isSubmitting} autocomplete="new-password" />
								{#if confirmNewPassword.length > 0 && newPassword !== confirmNewPassword}
									<p class="text-xs text-destructive">Passwords do not match</p>
								{/if}
							</div>
							<Button class="w-full" onclick={handleResetPassword} disabled={isSubmitting || !verificationCode || !newPassword || newPassword !== confirmNewPassword}>
								{#if isSubmitting}
									<Spinner class="mr-2" />
								{/if}
								Reset Password
							</Button>
						</div>

						<p class="mt-6 text-center text-sm text-muted-foreground">
							<button type="button" class="inline-flex items-center gap-1 font-medium text-primary hover:underline" onclick={() => switchView('signin')}>
								<ArrowLeft class="h-3.5 w-3.5" />
								Back to sign in
							</button>
						</p>
					{/if}
				</form>
			</CardContent>
		</Card>

		<!-- Footer links -->
		<div class="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
			<a href="/terms" class="hover:text-foreground transition-colors">Terms</a>
			<a href="/privacy" class="hover:text-foreground transition-colors">Privacy</a>
			<a href="/about" class="hover:text-foreground transition-colors">About</a>
		</div>
	</div>
</div>
