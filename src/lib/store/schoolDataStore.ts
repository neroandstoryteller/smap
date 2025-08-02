// store.ts
import { writable } from 'svelte/store';
import { exp } from 'three/tsl';

// 타입 정의
interface School {
    schoolName: string;
}

// 초기값 설정
export const school = writable<School>({ schoolName: "" });

export function setSchoolName(schoolName: string) {
    school.set({ schoolName });
    localStorage.setItem('schoolName', schoolName);
}

export function initSchool() {
    const schoolName: any = localStorage.getItem('schoolName');
    school.set({ schoolName });
}