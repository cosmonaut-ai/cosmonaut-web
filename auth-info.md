Here is a comprehensive implementation guide for your client-side authentication. This guide uses **AWS Amplify** (the library) which is the most reliable way to handle the Cognito OAuth2 "Code Grant" flow in a web app.

---

# Client-Side Authentication Guide: Cosmonaut AI

This document outlines how to implement Google Sign-In and secure API communication using the infrastructure provisioned in this repository.

## 1. Prerequisites

You will need the following values from your Terraform outputs:

- `cognito_user_pool_id`
- `cognito_user_pool_client_id`
- `cognito_domain` (e.g., `cosmonaut-dev`)
- `aws_region` (e.g., `us-east-2`)
- `api_endpoint` (Your API Gateway URL)

## 2. Installation

Install the Amplify Auth library in your frontend project:

```bash
npm install aws-amplify
```

## 3. Initialization

Configure Amplify at the entry point of your application (e.g., `src/routes/+layout.svelte` for SvelteKit or `App.js` for React).

```javascript
import { Amplify } from 'aws-amplify';

Amplify.configure({
	Auth: {
		Cognito: {
			userPoolId: 'YOUR_USER_POOL_ID',
			userPoolClientId: 'YOUR_CLIENT_ID',
			loginWith: {
				oauth: {
					domain: 'cosmonaut-dev.auth.us-east-2.amazoncognito.com',
					scopes: ['email', 'openid', 'profile'],
					redirectSignIn: ['https://dev.cosmonaut-ai.com/callback'],
					redirectSignOut: ['https://dev.cosmonaut-ai.com'],
					responseType: 'code'
				}
			}
		}
	}
});
```

## 4. Implementing Login

Create a login button that triggers the Google OAuth flow.

```javascript
import { signInWithRedirect } from 'aws-amplify/auth';

const login = async () => {
	try {
		await signInWithRedirect({ provider: 'Google' });
	} catch (error) {
		console.error('Login failed:', error);
	}
};
```

## 5. Handling the Callback

On your `/callback` page, Amplify will automatically detect the `?code=` in the URL and exchange it for tokens. You just need to ensure the user is redirected back to the main app once the session is established.

```javascript
// src/routes/callback/+page.svelte
import { onMount } from 'svelte';
import { getCurrentUser } from 'aws-amplify/auth';
import { goto } from '$app/navigation';

onMount(async () => {
	try {
		await getCurrentUser();
		goto('/dashboard'); // Login successful
	} catch (e) {
		console.error('Session not established yet', e);
	}
});
```

## 6. Calling the Secured API

To hit your API Gateway, you must include the `idToken` in the `Authorization` header.

```javascript
import { fetchAuthSession } from 'aws-amplify/auth';

async function callApi(path) {
	const session = await fetchAuthSession();
	const token = session.tokens?.idToken?.toString();

	const response = await fetch(`https://api.dev.cosmonaut-ai.com${path}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	return response.json();
}
```

## 7. Authenticating for Streaming (CloudFront)

Since your streaming endpoint (`streaming.dev.cosmonaut-ai.com`) uses **Signed Cookies**, you need a "handshake" to get the cookies before you can access the streams.

1.  **Request Cookies**: Create a protected endpoint in your API (e.g., `GET /auth/cookies`).
2.  **The Flow**:

    ```javascript
    // 1. Call API Gateway with JWT to get signed cookies
    const response = await fetch('https://api.dev.cosmonaut-ai.com/auth/cookies', {
    	headers: { Authorization: `Bearer ${token}` }
    });

    // 2. The API should return 'Set-Cookie' headers for:
    //    CloudFront-Policy, CloudFront-Signature, CloudFront-Key-Pair-Id

    // 3. Now you can use the streaming URL in a video player or EventSource
    const streamUrl = 'https://streaming.dev.cosmonaut-ai.com/worlds/123/stream';
    ```

## 8. User Info

Because we mapped extra attributes in the infrastructure (`given_name`, `picture`), you can retrieve them from the session:

```javascript
const session = await fetchAuthSession();
const claims = session.tokens.idToken.payload;

console.log('User Name:', claims.given_name);
console.log('Profile Picture:', claims.picture);
console.log('Google Sub ID:', claims.sub);
```

---

### Security Checklist

- [ ] **Domain Alignment**: Ensure your `redirectSignIn` exactly matches what is in `envs/dev/main.tf`.
- [ ] **HTTPS**: Cognito OAuth requires `https` for all redirect URIs except for `localhost`.
- [ ] **Token Expiry**: Amplify `fetchAuthSession()` automatically handles token refreshing; always use it instead of storing the token in `localStorage` yourself.
