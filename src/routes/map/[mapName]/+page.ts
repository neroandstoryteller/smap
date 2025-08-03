import { loadShapes } from '$lib/database/firestore';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const mapName = params.mapName;

	// Pass the SvelteKit fetch to loadShapes to handle SSR API calls
	const shapes = await loadShapes(mapName, fetch);

	return {
		mapName,
		shapes
	};
}; 