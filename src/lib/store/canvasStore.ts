// $lib/store/canvasStore.ts
import { writable } from 'svelte/store';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import type { Layer } from 'konva/lib/Layer';
import type { ShapeData } from '$lib/models/shapes';
import type { Shape } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';

// writable 스토어 초기화
export const stage = writable<Stage | null>(null);
export const layer = writable<Layer | null>(null);
export const shapes = writable<Group[]>([]);

export const selectedShape = writable<Konva.Group | null>(null);

export const konvaModule = writable<typeof Konva | null>(null);
export const transformer = writable<Konva.Transformer | null>(null);

export const isReady = writable<boolean>(false);
export const editable = writable<boolean>(true);
export const isDrawingLine = writable<boolean>(false);

export function genId(): string {
    return `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// 새 캔버스 생성
async function createNewCanvas(container: HTMLDivElement) {
    const newStage = new Konva.Stage({
        container: container,
        listening: true,
        width: window.innerWidth - 70,
        height: window.innerHeight,
        draggable: true,
    });
    const module = await import('konva');

    const newLayer = new Konva.Layer();
    const newConvaModule = module.default;
    const newTransformer = new newConvaModule.Transformer({
        rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
        borderStroke: 'royalblue',
        borderDash: [3, 3]
    });

    newStage.add(newLayer);
    newLayer.add(newTransformer);

    stage.set(newStage);
    layer.set(newLayer);
    shapes.set([]);

    konvaModule.set(newConvaModule);
    transformer.set(newTransformer);

    return newStage
}

export function refreshCanvas() {
    layer.subscribe(currentLayer => {
        if (currentLayer) {
            // 레이어에서 모든 셰이프를 가져옴
            const layerShapes = currentLayer
                .getChildren((node) => node instanceof Konva.Group)
                .filter((node): node is Konva.Group =>
                    node instanceof Konva.Group && !(node instanceof Konva.Transformer)
                );
            shapes.set(layerShapes);
            // 캔버스 다시 그리기
            currentLayer.draw();
        }
    })();
}


export async function initCanvas(container: HTMLDivElement) {
    const newCanvas = await createNewCanvas(container)
    return newCanvas
}

export function removeCanvas() {
    stage.update((existingStage) => {
        if (existingStage) {
            existingStage.destroy();
        }
        return null;
    });

    layer.update((existingLayer) => {
        if (existingLayer) {
            existingLayer.destroy();
        }
        return null;
    });

    transformer.update((existingTransformer) => {
        if (existingTransformer) {
            existingTransformer.destroy();
        }
        return null;
    });

    konvaModule.set(null);
    editable.set(false);
    isDrawingLine.set(false);
    selectedShape.set(null);
}