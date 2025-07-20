export interface ShapeData {
	id: string;
	type: 'Rect' | 'Circle';
	x: number;
	y: number;
	width?: number;
	height?: number;
	radius?: number;
	fill: string;
	stroke: string;
	strokeWidth: number;
	text: string;
} 