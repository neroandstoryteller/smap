<script lang="ts">
    import type Konva from 'konva';
    import { onMount } from 'svelte';

    let konvaLoaded = false;
    let KonvaModule: typeof Konva;

    // 현재 선택된 도형
    let stage: Konva.Stage;
    let layer: Konva.Layer;
    let transformer: Konva.Transformer;
    let selectedShape: Konva.Shape | null = null;
    let fillColor = '#FF6347';

    // 고유 ID 생성
    function genId(): string {
        return `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    // 사각형 추가
    function addRect(): void {
        const rect = new KonvaModule.Rect({
            id: genId(),
            x: 50,
            y: 50,
            width: 100,
            height: 80,
            fill: fillColor,
            stroke: '#000000',
            strokeWidth: 2,
            draggable: true
        });
        layer.add(rect);
        bindShapeEvents(rect);
        layer.draw();
    }

    // 원 추가
    function addCircle(): void {
        const circle = new KonvaModule.Circle({
            id: genId(),
            x: 200,
            y: 200,
            radius: 50,
            fill: fillColor,
            stroke: '#000000',
            strokeWidth: 2,
            draggable: true
        });
        layer.add(circle);
        bindShapeEvents(circle);
        layer.draw();
    }

    // 도형 이벤트 바인딩
    function bindShapeEvents(shape: Konva.Shape): void {
        shape.on('click', () => selectShape(shape));
        shape.on('dragend', () => layer.draw());
        shape.on('transformend', () => layer.draw());
    }

    // 도형 선택
    function selectShape(shape: Konva.Shape): void {
        selectedShape = shape;
        const shapeFill = shape.fill();
        if (typeof shapeFill === 'string') {
            fillColor = shapeFill; // 선택된 도형의 색상으로 fillColor 업데이트
        }
        transformer.nodes([shape]);
        layer.draw();
    }

    // 배경 클릭 시 선택 해제
    function clearSelection(e: Konva.KonvaEventObject<MouseEvent>): void {
        if (e.target === stage) {
            selectedShape = null;
            transformer.nodes([]);
            layer.draw();
        }
    }

    // 선택된 도형 삭제
    function deleteShape(): void {
        if (selectedShape) {
            transformer.nodes([]);
            selectedShape.destroy();
            selectedShape = null;
            layer.draw();
        }
    }

    // $: Svelte의 반응성을 사용하여 fillColor가 변경될 때 선택된 도형의 색상 업데이트
    $: {
        if (selectedShape && selectedShape.fill() !== fillColor) {
            selectedShape.fill(fillColor);
            layer?.draw(); // layer가 초기화된 후에만 draw() 호출
        }
    }

    // 초기 Konva 스테이지 구성
    onMount(async () => {
        const module = await import('konva');
        KonvaModule = module.default;

        stage = new KonvaModule.Stage({
            container: 'canvas-container',
            width: 800,
            height: 600
        });
        layer = new KonvaModule.Layer();
        stage.add(layer);

        transformer = new KonvaModule.Transformer({
            rotationSnaps: [0, 90, 180, 270]
        });
        layer.add(transformer);

        stage.on('click', clearSelection);
        konvaLoaded = true;
    });
</script>

<div class="toolbar_container">
    <button on:click={addRect} disabled={!konvaLoaded}>사각형 추가</button>
    <button on:click={addCircle} disabled={!konvaLoaded}>원 추가</button>
    <input type="color" bind:value={fillColor} title="채우기 색상" />
    <button on:click={deleteShape} disabled={!selectedShape}>삭제</button>
</div>

<div id="canvas-container" class="canvas_container"></div>

<style>
    .toolbar_container {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
    }
    .canvas_container {
        border: 2px solid #e0e0e0;
        width: 800px;
        height: 600px;
    }
    button {
        padding: 8px 12px;
        font-size: 14px;
        cursor: pointer;
    }
</style>
