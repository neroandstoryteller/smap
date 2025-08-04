import { loadShapes } from '$lib/database/firestore';
import type { ShapeData } from '$lib/models/shapes';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const mapName = params.mapName;

	// Pass the SvelteKit fetch to loadShapes to handle SSR API calls
	let shapes:ShapeData[] | null = []
	try{
		shapes = await loadShapes(mapName, fetch);
	}
	catch{
		shapes = null;
	}

	return {
		mapName,
		shapes
	};
}; 