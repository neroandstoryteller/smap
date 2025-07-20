import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function genId(): string {
	return `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export const GET: RequestHandler = async () => {
    const shapes = [
        {
            type: 'Rect',
            id: genId(),
            x: 90,
            y: 20,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '체력장'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 155,
            y: 20,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(여)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 220,
            y: 20,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '세면장'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 285,
            y: 20,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(남)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 350,
            y: 20,
            width: 60,
            height: 30,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: '계단'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 10,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '음악실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 85,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '연습실4'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 160,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-9'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 235,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '준비실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 310,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '미술실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 385,
            y: 80,
            width: 100,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '학생자치회실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 30,
            y: 200,
            width: 100,
            height: 40,
            fill: '#FFC0CB',
            stroke: '#000000',
            strokeWidth: 2,
            text: '5층'
        },
        {
            type: 'Circle',
            id: genId(),
            x: 160,
            y: 330,
            radius: 45,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-8'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 450,
            y: 170,
            width: 30,
            height: 40,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: '서고'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 400,
            y: 240,
            width: 100,
            height: 30,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: ''
        },
        {
            type: 'Rect',
            id: genId(),
            x: 530,
            y: 130,
            width: 100,
            height: 30,
            fill: '#ADD8E6',
            stroke: '#000000',
            strokeWidth: 1,
            text: '3학년부'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 530,
            y: 165,
            width: 50,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '발간실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 580,
            y: 165,
            width: 50,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '준비실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 530,
            y: 200,
            width: 100,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '교사휴게실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 640,
            y: 240,
            width: 60,
            height: 30,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: '미디어공간'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 705,
            y: 240,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(교사)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 770,
            y: 240,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(여)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 835,
            y: 240,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '세면장'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 900,
            y: 240,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(남)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 965,
            y: 240,
            width: 60,
            height: 30,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: '계단'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 260,
            y: 320,
            width: 80,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '다목적실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 345,
            y: 320,
            width: 120,
            height: 40,
            fill: '#ADD8E6',
            stroke: '#000000',
            strokeWidth: 2,
            text: '인문사회부'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 470,
            y: 320,
            width: 120,
            height: 40,
            fill: '#ADD8E6',
            stroke: '#000000',
            strokeWidth: 2,
            text: '미래교육과정부'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 600,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-7'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 675,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-6'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 750,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-5'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 825,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-4'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 900,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-3'
        }
    ];
    

	return json(shapes);
}; 