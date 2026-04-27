import { useAuth, SignUpNotConfirmedError } from '$lib/auth/auth.svelte';
import { trackEvent, identifyUser } from '$lib/utils/analytics';
import { formatAuthError } from '$lib/auth/errors';
import { goto } from '$app/navigation';

type AuthView = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

export function useLoginFlow(getRedirectDestination: () => string) {
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

	function clearMessages() {
		errorMessage = '';
		successMessage = '';
	}

	function switchView(target: AuthView) {
		clearMessages();
		view = target;
	}

	async function handleSignIn() {
		if (isSubmitting || !email || !password) return;
		clearMessages();
		isSubmitting = true;
		try {
			await auth.signInWithEmail(email, password);
			trackEvent('login', { method: 'email' });
			if (auth.user?.sub) identifyUser(auth.user.sub, { email: auth.user.email });
			goto(getRedirectDestination());
		} catch (error) {
			if (error instanceof SignUpNotConfirmedError) {
				view = 'verify';
				successMessage = 'Please enter the verification code sent to your email.';
			} else {
				trackEvent('auth_failed', { method: 'email', action: 'sign_in' });
				errorMessage = formatAuthError(error);
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
				goto(getRedirectDestination());
			}
		} catch (error) {
			trackEvent('auth_failed', { method: 'email', action: 'sign_up' });
			errorMessage = formatAuthError(error);
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
			if (auth.user?.sub) identifyUser(auth.user.sub, { email: auth.user.email });
			goto(getRedirectDestination());
		} catch (error) {
			errorMessage = formatAuthError(error);
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
			errorMessage = formatAuthError(error);
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
			errorMessage = formatAuthError(error);
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
			errorMessage = formatAuthError(error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleGoogleSignIn(isInAppBrowser: boolean) {
		if (isSubmitting || isInAppBrowser) return;
		clearMessages();
		isSubmitting = true;
		try {
			trackEvent('login', { method: 'google' });
			await auth.loginWithGoogle();
		} catch (error) {
			trackEvent('auth_failed', { method: 'google', action: 'sign_in' });
			errorMessage = formatAuthError(error);
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

	return {
		get auth() {
			return auth;
		},
		get view() {
			return view;
		},
		get email() {
			return email;
		},
		set email(v: string) {
			email = v;
		},
		get password() {
			return password;
		},
		set password(v: string) {
			password = v;
		},
		get confirmPassword() {
			return confirmPassword;
		},
		set confirmPassword(v: string) {
			confirmPassword = v;
		},
		get verificationCode() {
			return verificationCode;
		},
		set verificationCode(v: string) {
			verificationCode = v;
		},
		get newPassword() {
			return newPassword;
		},
		set newPassword(v: string) {
			newPassword = v;
		},
		get confirmNewPassword() {
			return confirmNewPassword;
		},
		set confirmNewPassword(v: string) {
			confirmNewPassword = v;
		},
		get showPassword() {
			return showPassword;
		},
		set showPassword(v: boolean) {
			showPassword = v;
		},
		get showConfirmPassword() {
			return showConfirmPassword;
		},
		set showConfirmPassword(v: boolean) {
			showConfirmPassword = v;
		},
		get isSubmitting() {
			return isSubmitting;
		},
		get errorMessage() {
			return errorMessage;
		},
		get successMessage() {
			return successMessage;
		},
		get passwordChecks() {
			return passwordChecks;
		},
		get passwordValid() {
			return passwordValid;
		},
		get passwordsMatch() {
			return passwordsMatch;
		},
		switchView,
		handleSignIn,
		handleSignUp,
		handleVerify,
		handleResendCode,
		handleForgotPassword,
		handleResetPassword,
		handleGoogleSignIn,
		handleFormKeyDown
	};
}

export type { AuthView };
