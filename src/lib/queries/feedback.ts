import { createMutation } from '@tanstack/svelte-query';
import { submitFeedback, type FeedbackRequest } from '$lib/api/feedback';

/**
 * Mutation hook for submitting user feedback.
 */
export function useFeedback() {
	return createMutation(() => ({
		mutationFn: (data: FeedbackRequest) => submitFeedback(data)
	}));
}
