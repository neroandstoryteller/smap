// @ts-ignore
import Timetable from 'comcigan-parser';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const timetable = new Timetable();

export const GET: RequestHandler = async ({ url }) => {
	const schoolCode = url.searchParams.get('code');
	const schoolRegion = url.searchParams.get('region');

	if (!schoolCode || !schoolRegion) {
		throw error(400, '"code"와 "region" 쿼리 파라미터가 필요합니다.');
	}

	await timetable.init();
	// `setSchool`은 이제 학교 코드와 지역 정보를 사용합니다.
	await timetable.setSchool({ code: Number(schoolCode), region: schoolRegion });
	
	const result = await timetable.getTimetable();
	return json(result);
}; 