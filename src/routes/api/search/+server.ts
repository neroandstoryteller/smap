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

	try {
		await timetable.init();
		const schools = await timetable.search(schoolName);
		return json(schools);

	} catch (err: any) {
		// "검색된 학교가 없습니다." 에러 처리
		if (err.message === '검색된 학교가 없습니다.') {
			return json([], { status: 200 });
		}
		// 기타 에러는 500 에러로 처리
		console.error('시간표 조회 오류:', err);
		throw error(500, '시간표를 가져오는 중 오류가 발생했습니다.');
	}
}; 