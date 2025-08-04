import type { PageLoad } from './$types';
import { getPosts } from '$lib/database/firestore';

export const load: PageLoad = async ({ params, url }) => {
	const building_name = params.building_name;
	const tag = (url.searchParams.get('tag') as '질문' | '공지' | '일반') || '질문';
	const skip = parseInt(url.searchParams.get('skip') || '0', 10);
	const limit = parseInt(url.searchParams.get('limit') || '10', 10);

	const posts = await getPosts({ building_name, tag, limit, skip });

	return {
		building_name,
		posts,
		tag,
		skip,
		limit
	};
};
