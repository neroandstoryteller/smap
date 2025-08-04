import type { PageLoad } from './$types';
import { getPost } from '$lib/database/firestore';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	const post = await getPost(params.post_uid);

	if (!post) {
		throw error(404, 'Post not found');
	}

	return {
		post
	};
};
