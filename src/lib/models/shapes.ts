export interface ShapeData {
	id: string;
	type: 'Rect' | 'Circle' | 'Line';
	x: number;
	y: number;
	width?: number;
	height?: number;
	radius?: number;
	points?: number[];
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
	text?: string;
} 