import { Amplify } from 'aws-amplify';
import {
	signInWithRedirect,
	signOut,
	getCurrentUser,
	fetchAuthSession,
	signUp,
	confirmSignUp,
	signIn,
	resetPassword,
	confirmResetPassword,
	resendSignUpCode
} from 'aws-amplify/auth';
import { amplifyConfig } from '$lib/config';
import type { UserInfo } from './types';

export function configureAmplify() {
	Amplify.configure(amplifyConfig);
}

export async function amplifyFetchSession(forceRefresh = false) {
	return fetchAuthSession({ forceRefresh });
}

export async function amplifyGetCurrentUser() {
	return getCurrentUser();
}

export async function amplifySignIn(email: string, password: string) {
	return signIn({ username: email, password });
}

export async function amplifySignUp(email: string, password: string) {
	return signUp({
		username: email,
		password,
		options: { userAttributes: { email } }
	});
}

export async function amplifyConfirmSignUp(email: string, code: string) {
	return confirmSignUp({ username: email, confirmationCode: code });
}

export async function amplifyResendCode(email: string) {
	return resendSignUpCode({ username: email });
}

export async function amplifyResetPassword(email: string) {
	return resetPassword({ username: email });
}

export async function amplifyConfirmResetPassword(
	email: string,
	code: string,
	newPassword: string
) {
	return confirmResetPassword({ username: email, confirmationCode: code, newPassword });
}

export async function amplifySignInWithGoogle() {
	return signInWithRedirect({ provider: 'Google' });
}

export async function amplifySignOut() {
	return signOut();
}

/**
 * Extract UserInfo from an Amplify session's ID token claims.
 */
export function extractUserFromClaims(
	claims: Record<string, unknown>,
	fallbackSub?: string
): UserInfo {
	const rawGroups = claims['cognito:groups'];
	const groups = Array.isArray(rawGroups) ? rawGroups.map(String) : [];

	return {
		sub: (claims.sub as string) ?? fallbackSub ?? '',
		email: claims.email as string | undefined,
		name: claims.given_name as string | undefined,
		picture: claims.picture as string | undefined,
		username: claims['custom:username'] as string | undefined,
		groups
	};
}
