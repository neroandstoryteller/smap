import { loadShapes } from '$lib/firestore';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const buildingName = params.building_name;

	// Make fetch available to loadShapes if it needs it for the fallback
	const shapes = await loadShapes(buildingName);

	return {
		buildingName,
		shapes
	};
}; 