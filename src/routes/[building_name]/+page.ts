import { loadShapes } from '$lib/firestore';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const buildingName = params.building_name;

	// Pass the SvelteKit fetch to loadShapes to handle SSR API calls
	const shapes = await loadShapes(buildingName, fetch);

	return {
		buildingName,
		shapes
	};
}; 