<script lang="ts">
	import {
		stage,
		layer,
		shapes,
		selectedShape,
		konvaModule,
		transformer,
		isReady,
		editable,
		isDrawingLine,
		genId,
		fillColor,
		addGroup,
		save,

		refreshCanvas,
		saveHistory,
        getShapeData,
	} from "$lib/store/canvasStore";
	import { saveShapes } from "$lib/database/firestore";
	import Konva from "konva";
	import type { ShapeData } from "$lib/models/shapes";
	import { school } from "$lib/store/schoolDataStore";

	let buildingName = $derived($school.buildingName);

	// let lineAnchors: Konva.Circle[] = [];

	function addRect() {
		const pointer = $stage!.getPointerPosition() || { x: 50, y: 50 };
		const shapeConfig = {
			type: "Rect",
			x: pointer.x,
			y: pointer.y,
			width: 100,
			height: 80,
			fill: $fillColor,
			stroke: "#000000",
			strokeWidth: 2,
		};
		addGroup(shapeConfig, "새 사각형");
		saveHistory();
	}

	function addCircle() {
		const pointer = $stage!.getPointerPosition() || { x: 200, y: 200 };
		const shapeConfig = {
			type: "Circle",
			x: pointer.x,
			y: pointer.y,
			radius: 50,
			fill: $fillColor,
			stroke: "#000000",
			strokeWidth: 2,
		};
		addGroup(shapeConfig, "새 원");
		saveHistory();
	}

	// function toggleDrawingLine() {
	// 	$isDrawingLine = !$isDrawingLine;
	// 	$stage!.draggable(!$isDrawingLine); // 선 그리는 동안 스테이지 드래그 비활성화
	// }

	// function hideLineAnchors() {
	// 	if (lineAnchors.length > 0) {
	// 		lineAnchors.forEach((anchor) => anchor.destroy());
	// 		lineAnchors = [];
	// 	}
	// 	if ($selectedShape) {
	// 		$selectedShape.off("dragmove.anchors");
	// 	}
	// }

	// function updateLineFromAnchors(group: Konva.Group, line: Konva.Line) {
	// 	const startAnchor = lineAnchors[0];
	// 	const endAnchor = lineAnchors[1];
	// 	const startPos = startAnchor.position();
	// 	const endPos = endAnchor.position();
	// 	group.position(startPos);
	// 	line.points([0, 0, endPos.x - startPos.x, endPos.y - startPos.y]);
	// 	$layer!.batchDraw();
	// }

	// function showLineAnchors(group: Konva.Group) {
	// 	const line = group.findOne(".main-shape") as Konva.Line;
	// 	if (!line) return;

	// 	const points = line.points();
	// 	const startAbs = group.position();
	// 	const endAbs = {
	// 		x: startAbs.x + points[2],
	// 		y: startAbs.y + points[3],
	// 	};

	// 	const anchorPoints = [startAbs, endAbs];
	// 	anchorPoints.forEach((pos) => {
	// 		const anchor = new $konvaModule!.Circle({
	// 			x: pos.x,
	// 			y: pos.y,
	// 			radius: 8,
	// 			fill: "royalblue",
	// 			stroke: "white",
	// 			strokeWidth: 2,
	// 			draggable: true,
	// 		});
	// 		$layer!.add(anchor);
	// 		lineAnchors.push(anchor);

	// 		anchor.on("dragmove", () => {
	// 			updateLineFromAnchors(group, line);
	// 		});
	// 	});

	// 	group.on("dragmove.anchors", () => {
	// 		const newPoints = (
	// 			group.findOne(".main-shape") as Konva.Line
	// 		).points();
	// 		const newStartAbs = group.position();
	// 		const newEndAbs = {
	// 			x: newStartAbs.x + newPoints[2],
	// 			y: newStartAbs.y + newPoints[3],
	// 		};
	// 		const positions = [newStartAbs, newEndAbs];
	// 		lineAnchors.forEach((a, i) => a.position(positions[i]));
	// 		$layer!.batchDraw();
	// 	});
	// }

	// function deleteShape() {
	// 	if ($selectedShape) {
	// 		$transformer!.nodes([]);
	// 		hideLineAnchors();
	// 		$selectedShape.destroy();
	// 		$resetSelectedShape;
	// 		refreshCanvas();
	// 		saveHistory();
	// 	}
	// }
</script>

<div class="diagram-mode" id="add-flex">
    <button onclick={addRect} disabled={!$isReady} class="add-button">
        <img src="/diagram/newRect.png" alt="새 사각형">
    </button>
    <button onclick={addCircle} disabled={!$isReady} class="add-button">
        <img src="/diagram/newCircle.png" alt="새 사각형">
    </button>
</div>

<!-- <button
	onclick={toggleDrawingLine}
	class:active={$isDrawingLine}
	disabled={!$isReady}>선 그리기</button
> -->

<style lang="scss">
	@use "$lib/style/main.scss" as *;

    .diagram-mode{
        display: flex;
        flex-flow: row;
        padding: 10px;
    }

    button{
        @include typography-body-bold;
        padding: 5px;
        border: none;
        
        color: $color-text-primary;
        border-radius: 10px;

        cursor: pointer;

        transition: $transition;
        margin: 5px;
        width: 90px;
        height: 90px;
        background-color: $colorBrighter;
        border: solid 1px transparent;
        display: flex; /* Flexbox 활성화 */
        justify-content: center; /* 수평 중앙 정렬 */
        align-items: center; /* 수직 중앙 정렬 */

        &:disabled {
            background: $colorMedium;
            color: $color-text-tertiary;
            cursor: not-allowed;
            opacity: 0.6;
        }
        &:hover:not(:disabled) {
            border: $colorSymbolGreen solid 1px;
            box-shadow: 0px 0px 10px rgba($colorSymbolGreen, 0.5);
        }

        img {
            width: 100%; /* 이미지 너비 유지 */
            height: auto; /* 이미지 비율 유지 */
        }
    }
</style>