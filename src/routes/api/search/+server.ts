// @ts-ignore
import Timetable from 'comcigan-parser';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const timetable = new Timetable();

export const GET: RequestHandler = async ({ url }) => {
	const schoolName = url.searchParams.get('name');

	if (!schoolName) {
		throw error(400, '"name" 쿼리 파라미터가 필요합니다.');
	}

	await timetable.init();
	const schools = await timetable.search(schoolName);

	return json(schools);
}; 