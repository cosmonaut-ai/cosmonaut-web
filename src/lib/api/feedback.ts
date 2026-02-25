import { API_BASE_URL } from '$lib/config';
import { apiRequest } from './core';

export type FeedbackCategory = 'bug' | 'feature' | 'feedback' | 'other';

export interface FeedbackRequest {
	category: FeedbackCategory;
	message: string;
}

/**
 * Submit user feedback to the backend.
 * Rate-limited to one submission per 5 minutes.
 */
export async function submitFeedback(data: FeedbackRequest): Promise<{ status: string }> {
	return apiRequest<{ status: string }>(`${API_BASE_URL}/auth/feedback`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}
