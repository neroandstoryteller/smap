import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return {
		building_name: params.building_name
	};
};
