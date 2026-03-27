// Environment configuration with fallbacks for local development
// These values can be overridden via environment variables

// API Configuration - defaults for local development
export const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8000';
export const STREAMING_BASE_URL =
	import.meta.env.PUBLIC_STREAMING_BASE_URL || 'http://localhost:8000';

// Cognito Configuration
export const COGNITO_USER_POOL_ID = import.meta.env.PUBLIC_COGNITO_USER_POOL_ID || '';
export const COGNITO_CLIENT_ID = import.meta.env.PUBLIC_COGNITO_CLIENT_ID || '';
export const COGNITO_DOMAIN = import.meta.env.PUBLIC_COGNITO_DOMAIN || '';
export const COGNITO_REDIRECT_URI =
	import.meta.env.PUBLIC_COGNITO_REDIRECT_URI || 'http://localhost:5173/callback';
export const AWS_REGION = import.meta.env.PUBLIC_AWS_REGION || 'us-east-2';

// Explicit environment label set at build time in CI.
// Falls back to URL-based inference for local dev where the var isn't set.
export const ENV: 'local' | 'dev' | 'prod' = import.meta.env.PUBLIC_ENV
	? (import.meta.env.PUBLIC_ENV as 'local' | 'dev' | 'prod')
	: API_BASE_URL === 'http://localhost:8000'
		? 'local'
		: API_BASE_URL.includes('dev.cosmonaut-ai.com')
			? 'dev'
			: 'prod';

export const isLocalEnvironment = ENV === 'local';
export const isDevEnvironment = ENV === 'dev';
export const PRODUCTION_URL = 'https://cosmonaut-ai.com';

// Sentry release (git SHA) set at build time in CI
export const SENTRY_RELEASE: string = import.meta.env.PUBLIC_SENTRY_RELEASE || '';

// Emails allowed to access the dev environment - all others are redirected to production
export const DEV_ALLOWED_EMAILS: string[] = [
	'imatson9119@gmail.com',
	'imatson9119+new@gmail.com',
	'ian@cosmonaut-ai.com'
];

// Check if auth is configured (non-local environments require Cognito)
export const isAuthConfigured =
	!isLocalEnvironment && !!COGNITO_USER_POOL_ID && !!COGNITO_CLIENT_ID && !!COGNITO_DOMAIN;

// Amplify configuration object
export const amplifyConfig = {
	Auth: {
		Cognito: {
			userPoolId: COGNITO_USER_POOL_ID,
			userPoolClientId: COGNITO_CLIENT_ID,
			loginWith: {
				oauth: {
					domain: COGNITO_DOMAIN,
					scopes: ['email', 'openid', 'profile'],
					redirectSignIn: [COGNITO_REDIRECT_URI],
					redirectSignOut: [COGNITO_REDIRECT_URI.replace('/callback', '')],
					responseType: 'code' as const
				}
			}
		}
	}
};
