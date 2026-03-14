import InAppSpy from 'inapp-spy';

export interface InAppBrowserInfo {
	isInApp: boolean;
	appName: string | undefined;
}

/**
 * Detects whether the current browser is an in-app WebView (e.g. LinkedIn, Facebook, Instagram).
 * Google blocks OAuth from these browsers with 403 disallowed_useragent.
 */
export function detectInAppBrowser(): InAppBrowserInfo {
	if (typeof window === 'undefined') {
		return { isInApp: false, appName: undefined };
	}
	const { isInApp, appName } = InAppSpy();
	return { isInApp, appName };
}
