import { writable, derived } from 'svelte/store';
import type { Konva } from 'konva/lib/Konva'; // Konva 타입 (npm i @types/konva)

// Shape 타입 정의
export type Shape = {
  id: string;
  type: 'rect' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number; // circle용
  fill: string;
  draggable: boolean;
  fontSize?: number;
  text?: string;
  handle?: Konva.Node; // Konva 노드 참조
};

type CanvasState = {
  shapes: Shape[];
  history: Shape[][]; // snapshots of shapes
  historyIndex: number;
  selectedId: string | null;
};

const initialState: CanvasState = {
  shapes: [],
  history: [[]], // 초기 빈 상태
  historyIndex: 0,
  selectedId: null
};

const store = writable<CanvasState>(initialState);

export const canvasState = derived(store, $store => $store);

export const selectedShape = derived(store, $store => 
  $store.shapes.find(s => s.id === $store.selectedId) || null
);

let shapeId = 0;

export function addShape(newShape: Omit<Shape, 'id' | 'handle'>) {
  store.update(state => {
    const id = `shape_${shapeId++}`;
    const shapes = [...state.shapes, { ...newShape, id }];
    const history = state.history.slice(0, state.historyIndex + 1);
    history.push(shapes);
    return { ...state, shapes, history, historyIndex: history.length - 1 };
  });
}

export function updateShape(id: string, updates: Partial<Shape>) {
  store.update(state => {
    const shapes = state.shapes.map(s => s.id === id ? { ...s, ...updates } : s);
    const history = state.history.slice(0, state.historyIndex + 1);
    history.push(shapes);
    return { ...state, shapes, history, historyIndex: history.length - 1 };
  });
}

export function selectShape(id: string) {
  store.update(state => ({ ...state, selectedId: id }));
}

export function undo() {
  store.update(state => {
    if (state.historyIndex > 0) {
      const historyIndex = state.historyIndex - 1;
      return { ...state, shapes: state.history[historyIndex], historyIndex };
    }
    return state;
  });
}

export function redo() {
  store.update(state => {
    if (state.historyIndex < state.history.length - 1) {
      const historyIndex = state.historyIndex + 1;
      return { ...state, shapes: state.history[historyIndex], historyIndex };
    }
    return state;
  });
}