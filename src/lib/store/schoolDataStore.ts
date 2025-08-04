// store.ts
import { writable } from 'svelte/store';
import { exp } from 'three/tsl';

// 타입 정의
interface School {
    buildingName: string;
}

// 초기값 설정
export const school = writable<School>({ buildingName: "" });

export function setSchoolName(buildingName: string) {
    school.set({ buildingName });
    localStorage.setItem('buildingName', buildingName);
}

export function initSchool() {
    const buildingName: any = localStorage.getItem('buildingName');
    school.set({ buildingName });
}