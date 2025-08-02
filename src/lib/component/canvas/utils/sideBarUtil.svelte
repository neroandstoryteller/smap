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

		refreshCanvas
	} from "$lib/store/canvasStore";
	import { saveShapes } from "$lib/database/firestore";
	import Konva from "konva";
	import type { ShapeData } from "$lib/models/shapes";
	import { school } from "$lib/store/schoolDataStore";

	let schoolName = $derived($school.schoolName);

	let fillColor = $state("#FF6347");
	let isLoadingFromImage = $state(false);
	let errorFromImage: string | null = $state(null);
	let fileInput: HTMLInputElement;

	let lineAnchors: Konva.Circle[] = [];

	function addGroup(shapeConfig: any, text: string) {
		if (!$isReady) return;

		const group = new $konvaModule!.Group({
			id: shapeConfig.id || genId(),
			x: shapeConfig.x,
			y: shapeConfig.y,
			draggable: true,
		});

		const shapeType = shapeConfig.type as "Rect" | "Circle" | "Line";
		let shape: Konva.Shape;

		const newShapeConfig = { ...shapeConfig };
		delete newShapeConfig.type;
		delete newShapeConfig.x;
		delete newShapeConfig.y;
		delete newShapeConfig.text;
		delete newShapeConfig.draggable;
		delete newShapeConfig.id;

		if (shapeType === "Circle") {
			const radius = shapeConfig.radius || 50;
			shape = new $konvaModule!.Circle({
				...newShapeConfig,
				radius: radius,
				x: radius,
				y: radius,
			});
		} else if (shapeType === "Line") {
			shape = new $konvaModule!.Line({
				...newShapeConfig,
				points: shapeConfig.points,
				stroke: newShapeConfig.stroke || "#000000",
				strokeWidth: newShapeConfig.strokeWidth || 5,
			});
		} else {
			// 기본값을 Rect로 처리
			shape = new $konvaModule!.Rect({
				...newShapeConfig,
				width: shapeConfig.width || 100,
				height: shapeConfig.height || 80,
				x: 0,
				y: 0,
			});
		}
		shape.name("main-shape");

		const textNode = new $konvaModule!.Text({
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
		$layer!.add(group);
		bindShapeEvents(group);
		refreshCanvas();
		return group;
	}

	function addRect() {
		const pointer = $stage!.getPointerPosition() || { x: 50, y: 50 };
		const shapeConfig = {
			type: "Rect",
			x: pointer.x,
			y: pointer.y,
			width: 100,
			height: 80,
			fill: fillColor,
			stroke: "#000000",
			strokeWidth: 2,
		};
		addGroup(shapeConfig, "새 사각형");
	}

	function addCircle() {
		const pointer = $stage!.getPointerPosition() || { x: 200, y: 200 };
		const shapeConfig = {
			type: "Circle",
			x: pointer.x,
			y: pointer.y,
			radius: 50,
			fill: fillColor,
			stroke: "#000000",
			strokeWidth: 2,
		};
		addGroup(shapeConfig, "새 원");
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
		} catch (e: any) {
			errorFromImage = e.message;
		} finally {
			isLoadingFromImage = false;
			// 동일한 파일을 다시 선택할 수 있도록 입력 값 초기화
			input.value = "";
		}
	}

	function bindShapeEvents(group: Konva.Group) {
		group.on("mousedown touchstart", () => selectShape(group));
		group.on("dragend", () => $layer!.draw());

		group.on("transformend", () => {
			const shape = group.findOne(".main-shape") as Konva.Shape;
			const text = group.findOne(".text-node") as Konva.Text;
			if (!shape) return;

			const scaleX = group.scaleX();
			const scaleY = group.scaleY();
			group.scaleX(1);
			group.scaleY(1);

			if (shape instanceof $konvaModule!.Circle) {
				const newRadius = shape.radius() * Math.max(scaleX, scaleY);
				shape.radius(newRadius);
				shape.x(newRadius);
				shape.y(newRadius);
				if (text) {
					text.width(shape.width());
					text.height(shape.height());
				}
			} else if (shape instanceof $konvaModule!.Rect) {
				const newWidth = shape.width() * scaleX;
				const newHeight = shape.height() * scaleY;
				shape.width(newWidth);
				shape.height(newHeight);
				if (text) {
					text.width(newWidth);
					text.height(newHeight);
				}
			}
			// Line transform logic is removed as per user request
			refreshCanvas();
		});

		group.on("dblclick dbltap", () => editText(group));
	}

	function editText(group: Konva.Group) {
		const textNode = group.findOne(".text-node") as Konva.Text;
		const shape = group.findOne(".main-shape") as Konva.Shape;
		if (!textNode || !shape) return;

		textNode.hide();
		refreshCanvas();

		const textPosition = group.absolutePosition();
		const stageBox = $stage!.container().getBoundingClientRect();
		const areaPosition = {
			x: stageBox.left + textPosition.x,
			y: stageBox.top + textPosition.y,
		};

		const textarea = document.createElement("textarea");
		document.body.appendChild(textarea);
		Object.assign(textarea.style, {
			position: "absolute",
			top: `${areaPosition.y}px`,
			left: `${areaPosition.x}px`,
			width: `${shape.width() * group.scaleX()}px`,
			height: `${shape.height() * group.scaleY()}px`,
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

	function selectShape(group: Konva.Group) {
		hideLineAnchors();
		$transformer!.nodes([]);

		$selectedShape = group;
		const shape = group.findOne(".main-shape") as Konva.Shape;
		if (!shape) return;

		const shapeFill = shape.fill();
		if (typeof shapeFill === "string") {
			fillColor = shapeFill;
		}

		if (shape instanceof $konvaModule!.Line) {
			showLineAnchors(group);
		} else {
			$transformer!.nodes([group]);
		}
		refreshCanvas();
	}

	function deleteShape() {
		if ($selectedShape) {
			$transformer!.nodes([]);
			hideLineAnchors();
			$selectedShape.destroy();
			$selectedShape = null;
			refreshCanvas();
		}
	}

	async function saveCanvasState() {
		const shapesToSave: ShapeData[] = [];
		const groups = $layer!.find("Group");

		groups.forEach((groupNode) => {
			const group = groupNode as Konva.Group;
			const shape = group.findOne(".main-shape") as Konva.Shape;
			const text = group.findOne(".text-node") as Konva.Text;
			if (!shape) return;

			const shapeData: ShapeData = {
				id: group.id(),
				type: shape.getClassName() as "Rect" | "Circle" | "Line",
				x: group.x() || 0,
				y: group.y() || 0,
				fill: (shape.fill() as string) || "#FFFFFF",
				stroke: (shape.stroke() as string) || "#000000",
				strokeWidth: shape.strokeWidth() || 1,
				text: text ? text.text() : "",
			};

			if (shape instanceof $konvaModule!.Rect) {
				shapeData.width = shape.width() || 0;
				shapeData.height = shape.height() || 0;
			} else if (shape instanceof $konvaModule!.Circle) {
				shapeData.radius = shape.radius() || 0;
			} else if (shape instanceof $konvaModule!.Line) {
				shapeData.points = shape.points();
			}
			shapesToSave.push(shapeData);
		});
		await saveShapes(schoolName, shapesToSave);
		alert(`${schoolName} 데이터가 저장되었습니다.`);
	}

	$effect(() => {
		if ($selectedShape) {
			const shape = $selectedShape.findOne("Shape") as Konva.Shape;
			if (shape && shape.fill() !== fillColor) {
				shape.fill(fillColor);
				$layer?.draw();
			}
		}
	});
</script>

<div class="toolbar_container">
	<button onclick={addRect} disabled={!$isReady}>사각형 추가</button>
	<button onclick={addCircle} disabled={!$isReady}>원 추가</button>
	<button
		onclick={toggleDrawingLine}
		class:active={$isDrawingLine}
		disabled={!$isReady}>선 그리기</button
	>
	<button onclick={saveCanvasState} disabled={!$isReady}>저장하기</button>
	<input type="color" bind:value={fillColor} title="채우기 색상" />
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
</div>

<style lang="scss">
	@use "$lib/style/main.scss" as *;

	.toolbar_container {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		display: flex;
		flex-wrap: wrap; // Allow wrapping on smaller screens
		gap: 0.75rem;
		background-color: $colorWhite;
		padding: 1rem;
		border-radius: 8px;
		box-shadow: $boxShadow;
		align-items: center;
		border: 1px solid $colorMediumBright;
		transition: $transition;

		&:hover {
			border-color: $colorSymbolGreen;
		}
	}

	button {
		@include typography-body-bold;
		padding: 0.75rem 1.25rem;
		border: none;
		border-radius: 6px;
		background: $colorBrighter;
		color: $color-text-primary;
		cursor: pointer;
		transition:
			$transition background-color,
			$transition transform,
			$transition box-shadow;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

		&:hover:not(:disabled) {
			background: $colorSymbolGreen;
			color: $color-text-inverse;
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba($colorSymbolGreen, 0.3);
		}

		&:disabled {
			background: $colorMedium;
			color: $color-text-tertiary;
			cursor: not-allowed;
			opacity: 0.6;
		}

		&.active {
			background: $colorSymbolGreen;
			color: $color-text-inverse;
			box-shadow: 0 0 8px rgba($colorSymbolGreen, 0.4);
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

	// Responsive design
	@media (max-width: 768px) {
		.toolbar_container {
			top: 0.5rem;
			right: 0.5rem;
			padding: 0.75rem;
			gap: 0.5rem;
		}

		button {
			padding: 0.5rem 1rem;
			font-size: $font-size-small;
		}

		input[type="color"] {
			width: 32px;
			height: 32px;
		}
	}

	@media (max-width: 480px) {
		.toolbar_container {
			flex-direction: column; // Stack vertically on small screens
			align-items: stretch;
			max-width: 90%;
		}

		button {
			width: 100%; // Full width buttons
			text-align: center;
		}

		input[type="color"] {
			width: 100%;
			height: 36px;
		}

		.error-text {
			margin-top: 0.5rem;
			text-align: center;
		}
	}
</style>
