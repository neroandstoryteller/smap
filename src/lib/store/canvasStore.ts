import { writable } from 'svelte/store';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import type { Layer } from 'konva/lib/Layer';
import type { ShapeData } from '$lib/models/shapes';
import type { Shape } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';
import { get } from 'svelte/store';
import { exp } from 'three/tsl';
import { read } from '$app/server';

const maxHistorySteps: number = 50;

// writable 스토어 초기화==================================================================================
export const stage = writable<Stage | null>(null);
export const layer = writable<Layer | null>(null);
export const shapes = writable<Group[]>([]);

export const selectedShape = writable<Konva.Group | null>(null);

export const konvaModule = writable<typeof Konva | null>(null);
export const transformer = writable<Konva.Transformer | null>(null);

export const isReady = writable<boolean>(false);
export const editable = writable<boolean>(true);
export const isDrawingLine = writable<boolean>(false);

export const history = writable<ShapeData[][]>([[]]);
export const step = writable<number>(-1);
export const clipboardShape = writable<Group | null>(null);

export const fillColor = writable<string>("#FF6347");

export function genId(): string {
    return `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}






// 캔버스 CRUD==================================================================================
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
        borderStroke: "#b0ff65",
        anchorFill: "white",
        anchorStroke: "#3BFF66",
        borderDash: [3, 3]
    });

    newStage.add(newLayer);
    newLayer.add(newTransformer);

    stage.set(newStage);
    layer.set(newLayer);
    shapes.set([]);

    konvaModule.set(newConvaModule);
    transformer.set(newTransformer);

    console.log("new canvas created!")
    return newStage
}

export function refreshCanvas() {
    const ready = get(isReady);

    if (!ready) return;

    const currentLayer = get(layer);
    const currentTransformer = get(transformer);

    if (currentLayer && ready) {
        // 레이어에서 모든 셰이프를 가져옴
        const layerShapes = currentLayer
            .getChildren((node) => node instanceof Konva.Group)
            .filter((node): node is Konva.Group =>
                node instanceof Konva.Group && !(node instanceof Konva.Transformer)
            );
        shapes.set(layerShapes);

        // 캔버스 다시 그리기
        currentTransformer!.moveToTop();
        currentLayer.draw();
    }
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

export function restoreCanvas(shapeDataList:ShapeData[]) {
    const ready = get(isReady);

    if (!ready) return;

    const currentLayer = get(layer);
    const currentTransformer = get(transformer);

    // Transformer를 제외하고 모든 자식 노드 제거
    currentLayer!.getChildren(node => node !== currentTransformer).forEach(node => node.destroy());

    // 복원할 도형 데이터

    // 도형 복원
    shapeDataList.forEach((shapeData: ShapeData) => {
        addGroup(shapeData, shapeData.text || "");
    });    

    // Transformer의 노드 초기화 (필요 시 특정 도형 연결)
    currentTransformer!.nodes([]);

    console.log("canvas restored")
    refreshCanvas();
}

// 히스토리==================================================================================
export function saveHistory() {
    const currentLayer = get(layer);
    const currentStep = get(step);
    const ready = get(isReady);

    if (!currentLayer || !ready) return;
    const canvasState = getCanvasState();

    if (canvasState === undefined) return;
    history.update(hist => {
        // 현재 스텝 이후의 히스토리 제거 (브랜치 방지)
        const newHist = hist.slice(0, currentStep + 1);
        newHist.push(canvasState);
        // 최대 히스토리 스텝 제한
        if (newHist.length > maxHistorySteps) {
            newHist.shift(); // 가장 오래된 히스토리 제거
        }
        return newHist;
    });

    step.update(() => get(history).length - 1);

    console.log("history saved!");
}

export function getShapeData(group: Group) {
    const ready = get(isReady)
    if (!ready) return;

    const currentKonvaModule = get(konvaModule);

    const shape = group.findOne(".main-shape") as Konva.Shape;
    const text = group.findOne(".text-node") as Konva.Text;
    if (!shape) return;

    const shapeData: ShapeData = {
        id: group.id(),
        type: shape.getClassName() as "Rect" | "Circle" | "Line",
        x: group.x() || 0,
        y: group.y() || 0,
        rotation: group.rotation(),
        fill: (shape.fill() as string) || "#FFFFFF",
        stroke: (shape.stroke() as string) || "#000000",
        strokeWidth: shape.strokeWidth() || 1,
        text: text ? text.text() : "",
    };

    if (shape instanceof currentKonvaModule!.Rect) {
        shapeData.width = shape.width() || 0;
        shapeData.height = shape.height() || 0;
    } else if (shape instanceof currentKonvaModule!.Circle) {
        shapeData.radius = shape.radius() || 0;
    } else if (shape instanceof currentKonvaModule!.Line) {
        shapeData.points = shape.points();
    }

    return shapeData
}

function getCanvasState() {
    const ready = get(isReady)
    if (!ready) return;

    const currentLayer = get(layer);
    const currentKonvaModule = get(konvaModule);

    const canvasState: ShapeData[] = [];
    const groups = currentLayer!.find("Group");

    groups.forEach((groupNode) => {
        const group = groupNode as Konva.Group;
        const shapeData = getShapeData(group);
        if(!shapeData) return;
        canvasState.push(shapeData);
    });
    
    return canvasState;
}



// 셰이프 만들기==================================================================================
export function addGroup(shapeConfig: any, text: string) {
    const ready = get(isReady);

    if (!ready) return;

    const currentKonvaModule = get(konvaModule);
    const currentLayer = get(layer);
    
    const group = new currentKonvaModule!.Group({
        id: shapeConfig.id || genId(),
        x: shapeConfig.x,
        y: shapeConfig.y,
        rotation: shapeConfig.rotation,
        draggable: true,
    });

    const shapeType = shapeConfig.type as "Rect" | "Circle" | "Line";
    let shape: Konva.Shape;

    const newShapeConfig = { ...shapeConfig };
    delete newShapeConfig.type;
    delete newShapeConfig.x;
    delete newShapeConfig.y;
    delete newShapeConfig.rotation;
    delete newShapeConfig.text;
    delete newShapeConfig.draggable;
    delete newShapeConfig.id;

    if (shapeType === "Circle") {
        const radius = shapeConfig.radius || 50;
        shape = new currentKonvaModule!.Circle({
            ...newShapeConfig,
            radius: radius,
            x: radius,
            y: radius,
        });
    } else if (shapeType === "Line") {
        shape = new currentKonvaModule!.Line({
            ...newShapeConfig,
            points: shapeConfig.points,
            stroke: newShapeConfig.stroke || "#000000",
            strokeWidth: newShapeConfig.strokeWidth || 5,
        });
    } else {
        // 기본값을 Rect로 처리
        shape = new currentKonvaModule!.Rect({
            ...newShapeConfig,
            width: shapeConfig.width || 100,
            height: shapeConfig.height || 80,
            x: 0,
            y: 0,
        });
    }
    shape.name("main-shape");

    const textNode = new currentKonvaModule!.Text({
        text: text,
        fontSize: 16,
        fontFamily: "Calibri",
        fill: "#000",
        width: shape.width(),
        height: shape.height(),
        align: "center",
        verticalAlign: "middle",
        padding: 5,
    });
    textNode.name("text-node");

    group.add(shape);
    group.add(textNode);
    currentLayer!.add(group);
    bindShapeEvents(group);
    refreshCanvas();
    return group;
}

function bindShapeEvents(group: Konva.Group) {
    const ready = get(isReady);

    if (!ready) return;

    const currentKonvaModule = get(konvaModule);
    const currentLayer = get(layer);

    group.on("mousedown touchstart", () => selectShape(group));
    group.on("dragend", () => {refreshCanvas(); saveHistory();});

    group.on("transformend", () => {
        const shape = group.findOne(".main-shape") as Konva.Shape;
        const text = group.findOne(".text-node") as Konva.Text;
        if (!shape) return;

        const scaleX = group.scaleX();
        const scaleY = group.scaleY();
        group.scaleX(1);
        group.scaleY(1);

        if (shape instanceof currentKonvaModule!.Circle) {
            const newRadius = shape.radius() * Math.max(scaleX, scaleY);
            shape.radius(newRadius);
            shape.x(newRadius);
            shape.y(newRadius);
            if (text) {
                text.width(shape.width());
                text.height(shape.height());
            }
        } else if (shape instanceof currentKonvaModule!.Rect) {
            const newWidth = shape.width() * scaleX;
            const newHeight = shape.height() * scaleY;
            shape.width(newWidth);
            shape.height(newHeight);
            if (text) {
                text.width(newWidth);
                text.height(newHeight);
            }
        }
        refreshCanvas();
        saveHistory();
    });

    group.on("dblclick dbltap", () => editText(group));
}

function editText(group: Konva.Group) {
    const ready = get(isReady);
    if (!ready) return;

    const currentStage = get(stage);

    const textNode = group.findOne(".text-node") as Konva.Text;
    const shape = group.findOne(".main-shape") as Konva.Shape;
    if (!textNode || !shape) return;

    textNode.hide();
    refreshCanvas();

    const textPosition = group.getAbsolutePosition();
    const areaPosition = {
        x: textPosition.x,
        y: textPosition.y,
    };

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    Object.assign(textarea.style, {
        position: "absolute",
        top: `${areaPosition.y}px`,
        left: `${areaPosition.x}px`,
        width: `${shape.width() * shape.scaleX()}px`,
        height: `${shape.height() * shape.scaleY()}px`,
        fontSize: `${textNode.fontSize()}px`,
        border: "none",
        padding: "5px",
        margin: "0px",
        overflow: "hidden",
        background: "none",
        outline: "none",
        resize: "none",
        lineHeight: textNode.lineHeight().toString(),
        fontFamily: textNode.fontFamily(),
        transformOrigin: "left top",
        textAlign: "center",
        color:
            typeof textNode.fill() === "string" ? textNode.fill() : "#000",
    });
    textarea.value = textNode.text();
    textarea.focus();

    function removeTextarea() {
        if (document.body.contains(textarea))
            document.body.removeChild(textarea);
        window.removeEventListener("click", handleOutsideClick);
    }

    function saveText() {
        textNode.text(textarea.value);
        textNode.show();
        refreshCanvas();
        saveHistory();
        removeTextarea();
    }

    function handleOutsideClick(e: MouseEvent) {
        if (e.target !== textarea) saveText();
    }

    textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) saveText();
        else if (e.key === "Escape") {
            textNode.show();
            refreshCanvas();
            removeTextarea();
        }
    });
    textarea.addEventListener("blur", saveText);
    setTimeout(
        () => window.addEventListener("click", handleOutsideClick),
        0,
    );
}

function selectShape(group: Konva.Group) {
    const ready = get(isReady);
    if (!ready) return;

    const currentTransformer = get(transformer);
    const currentKonvaModule = get(konvaModule);

    currentTransformer!.nodes([]);

    selectedShape.set(group);
    const shape = group.findOne(".main-shape") as Konva.Shape;
    if (!shape) return;

    const shapeFill = shape.fill();
    if (typeof shapeFill === "string") {
        fillColor.set(shapeFill)
    }

    if (shape instanceof currentKonvaModule!.Line) {
        // showLineAnchors(group);
    } else {
        currentTransformer!.nodes([group]);
    }
    refreshCanvas();
}