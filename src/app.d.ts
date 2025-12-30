// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			currentNode?: import('./lib/types/api').StoryNode;
		}
		// interface Platform {}
	}
}

export {};
