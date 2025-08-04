import { loadShapes } from '$lib/database/firestore';
import type { ShapeData } from '$lib/models/shapes';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const buildingName = params.building_name;

	// Pass the SvelteKit fetch to loadShapes to handle SSR API calls
	let shapes:ShapeData[] | null = []
	try{
		shapes = await loadShapes(buildingName, fetch);
	}
	catch{
		shapes = null;
	}

	return {
		buildingName,
		shapes
	};
}; 