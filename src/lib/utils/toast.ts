import { toast } from 'svelte-sonner';

/**
 * Show an error toast notification
 */
export function showError(message: string, description?: string) {
	toast.error(message, { description });
}

/**
 * Show a success toast notification
 */
export function showSuccess(message: string, description?: string) {
	toast.success(message, { description });
}

/**
 * Show an info toast notification
 */
export function showInfo(message: string, description?: string) {
	toast.info(message, { description });
}

/**
 * Show a warning toast notification
 */
export function showWarning(message: string, description?: string) {
	toast.warning(message, { description });
}

/**
 * Show a loading toast and return a function to update it
 */
export function showLoading(message: string) {
	return toast.loading(message);
}

/**
 * Dismiss a specific toast or all toasts
 */
export function dismissToast(toastId?: string | number) {
	toast.dismiss(toastId);
}
