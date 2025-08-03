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

		refreshCanvas,
		saveHistory,
	} from "$lib/store/canvasStore";
	import { saveShapes } from "$lib/database/firestore";
	import Konva from "konva";
	import type { ShapeData } from "$lib/models/shapes";
	import { school } from "$lib/store/schoolDataStore";

	let schoolName = $derived($school.schoolName);

	let isLoadingFromImage = $state(false);
	let errorFromImage: string | null = $state(null);
	let fileInput: HTMLInputElement;

	let lineAnchors: Konva.Circle[] = [];

	const mode = {
		diagram: "diagram",
		text: "text",
		ai: "ai"
	};

	let sideBarMode: string = $state(mode.diagram);

	function setSideBarMode(mode:string){
		sideBarMode = mode;
	}
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

	function toggleDrawingLine() {
		$isDrawingLine = !$isDrawingLine;
		$stage!.draggable(!$isDrawingLine); // 선 그리는 동안 스테이지 드래그 비활성화
	}

	async function extractShapesFromImage(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) {
			return;
		}
		const imageFile = input.files[0];

		isLoadingFromImage = true;
		errorFromImage = null;

		const formData = new FormData();
		formData.append("image", imageFile);

		try {
			const response = await fetch("/api/extract-shapes", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(
					err.error || "이미지에서 도형을 추출하지 못했습니다.",
				);
			}

			const { shapes } = await response.json();

			// 기존 도형 모두 삭제
			$layer!.destroyChildren();
			$layer!.add($transformer!); // $transformer!는 유지

			// 새로 받은 도형 추가
			shapes.forEach((shapeData: any) => {
				addGroup(shapeData, shapeData.text || "");
			});

			refreshCanvas();
			saveHistory();
		} catch (e: any) {
			errorFromImage = e.message;
		} finally {
			isLoadingFromImage = false;
			// 동일한 파일을 다시 선택할 수 있도록 입력 값 초기화
			input.value = "";
		}
	}

	function hideLineAnchors() {
		if (lineAnchors.length > 0) {
			lineAnchors.forEach((anchor) => anchor.destroy());
			lineAnchors = [];
		}
		if ($selectedShape) {
			$selectedShape.off("dragmove.anchors");
		}
	}

	function updateLineFromAnchors(group: Konva.Group, line: Konva.Line) {
		const startAnchor = lineAnchors[0];
		const endAnchor = lineAnchors[1];
		const startPos = startAnchor.position();
		const endPos = endAnchor.position();
		group.position(startPos);
		line.points([0, 0, endPos.x - startPos.x, endPos.y - startPos.y]);
		$layer!.batchDraw();
	}

	function showLineAnchors(group: Konva.Group) {
		const line = group.findOne(".main-shape") as Konva.Line;
		if (!line) return;

		const points = line.points();
		const startAbs = group.position();
		const endAbs = {
			x: startAbs.x + points[2],
			y: startAbs.y + points[3],
		};

		const anchorPoints = [startAbs, endAbs];
		anchorPoints.forEach((pos) => {
			const anchor = new $konvaModule!.Circle({
				x: pos.x,
				y: pos.y,
				radius: 8,
				fill: "royalblue",
				stroke: "white",
				strokeWidth: 2,
				draggable: true,
			});
			$layer!.add(anchor);
			lineAnchors.push(anchor);

			anchor.on("dragmove", () => {
				updateLineFromAnchors(group, line);
			});
		});

		group.on("dragmove.anchors", () => {
			const newPoints = (
				group.findOne(".main-shape") as Konva.Line
			).points();
			const newStartAbs = group.position();
			const newEndAbs = {
				x: newStartAbs.x + newPoints[2],
				y: newStartAbs.y + newPoints[3],
			};
			const positions = [newStartAbs, newEndAbs];
			lineAnchors.forEach((a, i) => a.position(positions[i]));
			$layer!.batchDraw();
		});
	}

	function deleteShape() {
		if ($selectedShape) {
			$transformer!.nodes([]);
			hideLineAnchors();
			$selectedShape.destroy();
			$selectedShape = null;
			refreshCanvas();
			saveHistory();
		}
	}


	$effect(() => {
		if ($selectedShape) {
			const shape = $selectedShape.findOne("Shape") as Konva.Shape;
			if (shape && shape.fill() !== $fillColor) {
				shape.fill($fillColor);
				$layer?.draw();
			}
		}
	});
</script>

<div class="side-bar">
	<div class="head">
		<button class="mode-button" onclick={() => {setSideBarMode(mode.diagram)}} disabled={!$isReady} class:activated={sideBarMode === mode.diagram}>
			<span class="material-symbols-outlined">shapes</span>
		</button>
		<button class="mode-button" onclick={() => {setSideBarMode(mode.text)}} disabled={!$isReady} class:activated={sideBarMode === mode.text}>
			<span class="material-symbols-outlined">text_fields</span>
		</button>
		<button class="mode-button" onclick={() => {setSideBarMode(mode.ai)}} disabled={!$isReady} class:activated={sideBarMode === mode.ai}>
			<span class="material-symbols-outlined">robot_2</span>
		</button>
		<button class="head-button" disabled={!$isReady}>
			<span class="material-symbols-outlined">save</span>
		</button>
	</div>

	<div class="body">
		{#if sideBarMode === mode.diagram}
			<div class="diagram-mode" id="add-flex">
				<button onclick={addRect} disabled={!$isReady} class="add-button">
					<img src="diagram/newRect.png" alt="새 사각형">
				</button>
				<button onclick={addCircle} disabled={!$isReady} class="add-button">
					<img src="diagram/newCircle.png" alt="새 사각형">
				</button>
			</div>
		{:else if sideBarMode === mode.text}
			<div class="diagram-mode" id="add-flex">
				<button onclick={addRect} disabled={!$isReady} class="add-button">
					<img src="diagram/newRect.png" alt="새 사각형">
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- <div class="toolbar_container">
	<button onclick={addRect} disabled={!$isReady}>사각형 추가</button>
	<button onclick={addCircle} disabled={!$isReady}>원 추가</button>
	<button
		onclick={toggleDrawingLine}
		class:active={$isDrawingLine}
		disabled={!$isReady}>선 그리기</button
	>
	<button onclick={saveCanvasState} disabled={!$isReady}>저장하기</button>
	<input type="color" bind:value={$fillColor} title="채우기 색상" />
	<button onclick={deleteShape} disabled={!$selectedShape}>삭제</button>

	<input
		type="file"
		bind:this={fileInput}
		onchange={extractShapesFromImage}
		accept="image/*"
		style="display: none;"
	/>
	<button
		onclick={() => fileInput.click()}
		disabled={isLoadingFromImage || !$isReady}
	>
		{isLoadingFromImage ? "처리 중..." : "사진으로 다이어그램 만들기"}
	</button>
	{#if errorFromImage}
		<span class="error-text">{errorFromImage}</span>
	{/if}
</div> -->

<style lang="scss">
	@use "$lib/style/main.scss" as *;

	.side-bar{
		transition: $transition;
		right: 0;
		display: flex;
		height: 100%;
		padding-top: 10px;
		padding-left: 10px;
		position: fixed;
		box-shadow: $boxShadow;
		flex-flow: column;
		background-color: $colorBright;

		button{
			@include typography-body-bold;
			margin: 0;
			padding: 5px;
			border: none;
			
			background: $colorWhite;
			color: $color-text-primary;
			border-radius: 10px;

			cursor: pointer;
			transition:
				$transition background-color,
				$transition transform,
				$transition box-shadow;

			&:disabled {
				background: $colorMedium;
				color: $color-text-tertiary;
				cursor: not-allowed;
				opacity: 0.6;
			}
		}

		.head{
			.mode-button {
				width: 70px;
				border-radius: 10px 10px 0px 0px;

				&:hover:not(:disabled) {
					background: $colorSymbolGreen;
					color: $color-text-inverse;
					box-shadow: 0 0 8px rgba($colorSymbolGreen, 0.4);
				}

				&.activated {
					background: $colorSymbolGreen;
					color: $color-text-inverse;
					box-shadow: 0 0 8px rgba($colorSymbolGreen, 0.4);
				}
			}
			.head-button{
				&:hover:not(:disabled) {
					background: $colorSymbolGreen;
					color: $color-text-inverse;
					box-shadow: 0 0 8px rgba($colorSymbolGreen, 0.4);
				}

				border-radius: 10px 10px 0px 0px;
			}
		}

		.body{
			background-color: $colorWhite;
			display: flex;
			height: 100%;

			#add-flex{
				display: flex;
				flex-flow: row;
				padding: 10px;
			}

			.add-button {
				transition: $transition;
				margin: 5px;
				width: 100px;
				height: 100px;
				background-color: $colorBrighter;
				border: solid 1px transparent;
				display: flex; /* Flexbox 활성화 */
				justify-content: center; /* 수평 중앙 정렬 */
				align-items: center; /* 수직 중앙 정렬 */
				
				&:hover:not(:disabled) {
					border: $colorSymbolGreen solid 1px;
					box-shadow: 0px 0px 10px rgba($colorSymbolGreen, 0.5);
				}

				img {
					width: 100%; /* 이미지 너비 유지 */
					height: auto; /* 이미지 비율 유지 */
				}
			}
		}
	}

	input[type="color"] {
		width: 40px;
		height: 40px;
		padding: 0;
		border: 1px solid $colorMedium;
		border-radius: 4px;
		cursor: pointer;
		background: transparent;
		transition:
			$transition border-color,
			$transition box-shadow;

		&:hover {
			border-color: $colorSymbolGreen;
			box-shadow: 0 0 6px rgba($colorSymbolGreen, 0.2);
		}

		&:focus {
			outline: none;
			border-color: $colorSymbolGreen;
			box-shadow: 0 0 8px rgba($colorSymbolGreen, 0.3);
		}
	}

	.error-text {
		@include typography-small;
		color: $color-text-error;
		margin-left: 0.5rem;
	}
</style>
