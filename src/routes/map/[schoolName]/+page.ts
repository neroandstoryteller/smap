import { loadShapes } from '$lib/database/firestore';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const schoolName = params.schoolName;

	// Pass the SvelteKit fetch to loadShapes to handle SSR API calls
	const shapes = await loadShapes(schoolName, fetch);

	return {
		schoolName,
		shapes
	};
}; 