/**
 * Maps Cognito/auth error messages to user-friendly strings.
 */
export function formatAuthError(error: unknown): string {
	if (error instanceof Error) {
		const msg = error.message;
		if (msg.includes('UserAlreadyAuthenticatedException'))
			return 'You are already signed in... go forth and conquer!';
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
		if (
			msg.includes('InvalidParameterException') ||
			msg.includes('One or more parameters are incorrect')
		)
			return 'Unable to process this request. If you signed in with Google, try using Google Sign-In instead.';
		if (msg.includes('UserNotConfirmedException')) return 'Please verify your email first.';
		if (msg.includes('AccountAlreadyExists'))
			return 'An account with this email already exists. Please sign in with your existing method.';
		return msg;
	}
	return 'An unexpected error occurred. Please try again.';
}
