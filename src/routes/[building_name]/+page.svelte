<script lang="ts">
	import type Konva from 'konva';
	import { onMount, onDestroy } from 'svelte';
	import { saveShapes } from '$lib/firestore';
	import type { ShapeData } from '$lib/models/shapes';

	export let data: {
		buildingName: string;
		shapes: ShapeData[];
	};

	let konvaLoaded = false;
	let KonvaModule: typeof Konva;
	let stage: Konva.Stage;
	let layer: Konva.Layer;
	let transformer: Konva.Transformer;
	let selectedShape: Konva.Group | null = null;
	let fillColor = '#FF6347';
	let isLoadingFromImage = false;
	let errorFromImage: string | null = null;
	let fileInput: HTMLInputElement;
	let lineAnchors: Konva.Circle[] = [];
	let isDrawingLine = false;
	let currentLine: Konva.Line | null = null;
	let lineStartPoint: { x: number; y: number } | null = null;

	function genId(): string {
		return `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
	}

	function addGroup(shapeConfig: any, text: string) {
		const group = new KonvaModule.Group({
			id: shapeConfig.id || genId(),
			x: shapeConfig.x,
			y: shapeConfig.y,
			draggable: true
		});

		const shapeType = shapeConfig.type as 'Rect' | 'Circle' | 'Line';
		let shape: Konva.Shape;

		const newShapeConfig = { ...shapeConfig };
		delete newShapeConfig.type;
		delete newShapeConfig.x;
		delete newShapeConfig.y;
		delete newShapeConfig.text;
		delete newShapeConfig.draggable;
		delete newShapeConfig.id;

		if (shapeType === 'Circle') {
			const radius = shapeConfig.radius || 50;
			shape = new KonvaModule.Circle({
				...newShapeConfig,
				radius: radius,
				x: radius,
				y: radius
			});
		} else if (shapeType === 'Line') {
			shape = new KonvaModule.Line({
				...newShapeConfig,
				points: shapeConfig.points,
				stroke: newShapeConfig.stroke || '#000000',
				strokeWidth: newShapeConfig.strokeWidth || 5,
			});
		} else {
			// 기본값을 Rect로 처리
			shape = new KonvaModule.Rect({
				...newShapeConfig,
				width: shapeConfig.width || 100,
				height: shapeConfig.height || 80,
				x: 0,
				y: 0
			});
		}
		shape.name('main-shape');

		const textNode = new KonvaModule.Text({
			text: text,
			fontSize: 16,
			fontFamily: 'Calibri',
			fill: '#000',
			width: shape.width(),
			height: shape.height(),
			align: 'center',
			verticalAlign: 'middle',
			padding: 5
		});
		textNode.name('text-node');

		group.add(shape);
		group.add(textNode);
		layer.add(group);
		bindShapeEvents(group);
		layer.draw();
		return group;
	}

	function addRect() {
		const pointer = stage.getPointerPosition() || { x: 50, y: 50 };
		const shapeConfig = {
			type: 'Rect',
			x: pointer.x,
			y: pointer.y,
			width: 100,
			height: 80,
			fill: fillColor,
			stroke: '#000000',
			strokeWidth: 2
		};
		addGroup(shapeConfig, '새 사각형');
	}

	function addCircle() {
		const pointer = stage.getPointerPosition() || { x: 200, y: 200 };
		const shapeConfig = {
			type: 'Circle',
			x: pointer.x,
			y: pointer.y,
			radius: 50,
			fill: fillColor,
			stroke: '#000000',
			strokeWidth: 2
		};
		addGroup(shapeConfig, '새 원');
	}

	function toggleDrawingLine() {
		isDrawingLine = !isDrawingLine;
		stage.draggable(!isDrawingLine); // 선 그리는 동안 스테이지 드래그 비활성화
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
		formData.append('image', imageFile);

		try {
			const response = await fetch('/api/extract-shapes', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || '이미지에서 도형을 추출하지 못했습니다.');
			}

			const { shapes } = await response.json();

			// 기존 도형 모두 삭제
			layer.destroyChildren();
			layer.add(transformer); // Transformer는 유지

			// 새로 받은 도형 추가
			shapes.forEach((shapeData: any) => {
				addGroup(shapeData, shapeData.text || '');
			});

			layer.draw();

		} catch (e: any) {
			errorFromImage = e.message;
		} finally {
			isLoadingFromImage = false;
			// 동일한 파일을 다시 선택할 수 있도록 입력 값 초기화
			input.value = '';
		}
	}

	function bindShapeEvents(group: Konva.Group) {
		group.on('mousedown touchstart', () => selectShape(group));
		group.on('dragend', () => layer.draw());

		group.on('transformend', () => {
			const shape = group.findOne('.main-shape') as Konva.Shape;
			const text = group.findOne('.text-node') as Konva.Text;
			if (!shape) return;

			const scaleX = group.scaleX();
			const scaleY = group.scaleY();
			group.scaleX(1);
			group.scaleY(1);

			if (shape instanceof KonvaModule.Circle) {
				const newRadius = shape.radius() * Math.max(scaleX, scaleY);
				shape.radius(newRadius);
				shape.x(newRadius);
				shape.y(newRadius);
				if (text) {
					text.width(shape.width());
					text.height(shape.height());
				}
			} else if (shape instanceof KonvaModule.Rect) {
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
			layer.draw();
		});

		group.on('dblclick dbltap', () => editText(group));
	}

	function editText(group: Konva.Group) {
		const textNode = group.findOne('.text-node') as Konva.Text;
		const shape = group.findOne('.main-shape') as Konva.Shape;
		if (!textNode || !shape) return;

		textNode.hide();
		layer.draw();

		const textPosition = group.absolutePosition();
		const stageBox = stage.container().getBoundingClientRect();
		const areaPosition = {
			x: stageBox.left + textPosition.x,
			y: stageBox.top + textPosition.y
		};

		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);
		Object.assign(textarea.style, {
			position: 'absolute',
			top: `${areaPosition.y}px`,
			left: `${areaPosition.x}px`,
			width: `${shape.width() * group.scaleX()}px`,
			height: `${shape.height() * group.scaleY()}px`,
			fontSize: `${textNode.fontSize()}px`,
			border: 'none',
			padding: '5px',
			margin: '0px',
			overflow: 'hidden',
			background: 'none',
			outline: 'none',
			resize: 'none',
			lineHeight: textNode.lineHeight().toString(),
			fontFamily: textNode.fontFamily(),
			transformOrigin: 'left top',
			textAlign: 'center',
			color: typeof textNode.fill() === 'string' ? textNode.fill() : '#000'
		});
		textarea.value = textNode.text();
		textarea.focus();

		function removeTextarea() {
			if (document.body.contains(textarea)) document.body.removeChild(textarea);
			window.removeEventListener('click', handleOutsideClick);
		}

		function saveText() {
			textNode.text(textarea.value);
			textNode.show();
			layer.draw();
			removeTextarea();
		}

		function handleOutsideClick(e: MouseEvent) {
			if (e.target !== textarea) saveText();
		}

		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) saveText();
			else if (e.key === 'Escape') {
				textNode.show();
				layer.draw();
				removeTextarea();
			}
		});
		textarea.addEventListener('blur', saveText);
		setTimeout(() => window.addEventListener('click', handleOutsideClick), 0);
	}

	function hideLineAnchors() {
		if (lineAnchors.length > 0) {
			lineAnchors.forEach((anchor) => anchor.destroy());
			lineAnchors = [];
		}
		if (selectedShape) {
			selectedShape.off('dragmove.anchors');
		}
	}

	function updateLineFromAnchors(group: Konva.Group, line: Konva.Line) {
		const startAnchor = lineAnchors[0];
		const endAnchor = lineAnchors[1];
		const startPos = startAnchor.position();
		const endPos = endAnchor.position();
		group.position(startPos);
		line.points([0, 0, endPos.x - startPos.x, endPos.y - startPos.y]);
		layer.batchDraw();
	}

	function showLineAnchors(group: Konva.Group) {
		const line = group.findOne('.main-shape') as Konva.Line;
		if (!line) return;

		const points = line.points();
		const startAbs = group.position();
		const endAbs = {
			x: startAbs.x + points[2],
			y: startAbs.y + points[3]
		};

		const anchorPoints = [startAbs, endAbs];
		anchorPoints.forEach((pos) => {
			const anchor = new KonvaModule.Circle({
				x: pos.x,
				y: pos.y,
				radius: 8,
				fill: 'royalblue',
				stroke: 'white',
				strokeWidth: 2,
				draggable: true
			});
			layer.add(anchor);
			lineAnchors.push(anchor);

			anchor.on('dragmove', () => {
				updateLineFromAnchors(group, line);
			});
		});

		group.on('dragmove.anchors', () => {
			const newPoints = (group.findOne('.main-shape') as Konva.Line).points();
			const newStartAbs = group.position();
			const newEndAbs = {
				x: newStartAbs.x + newPoints[2],
				y: newStartAbs.y + newPoints[3]
			};
			const positions = [newStartAbs, newEndAbs];
			lineAnchors.forEach((a, i) => a.position(positions[i]));
			layer.batchDraw();
		});
	}

	function selectShape(group: Konva.Group) {
		hideLineAnchors();
		transformer.nodes([]);

		selectedShape = group;
		const shape = group.findOne('.main-shape') as Konva.Shape;
		if (!shape) return;

		const shapeFill = shape.fill();
		if (typeof shapeFill === 'string') {
			fillColor = shapeFill;
		}

		if (shape instanceof KonvaModule.Line) {
			showLineAnchors(group);
		} else {
			transformer.nodes([group]);
		}
		layer.draw();
	}

	function deleteShape() {
		if (selectedShape) {
			transformer.nodes([]);
			hideLineAnchors();
			selectedShape.destroy();
			selectedShape = null;
			layer.draw();
		}
	}

	async function saveCanvasState() {
		const shapesToSave: ShapeData[] = [];
		const groups = layer.find('Group');

		groups.forEach((groupNode) => {
			const group = groupNode as Konva.Group;
			const shape = group.findOne('.main-shape') as Konva.Shape;
			const text = group.findOne('.text-node') as Konva.Text;
			if (!shape) return;

			const shapeData: ShapeData = {
				id: group.id(),
				type: shape.getClassName() as 'Rect' | 'Circle' | 'Line',
				x: group.x() || 0,
				y: group.y() || 0,
				fill: (shape.fill() as string) || '#FFFFFF',
				stroke: (shape.stroke() as string) || '#000000',
				strokeWidth: shape.strokeWidth() || 1,
				text: text ? text.text() : ''
			};

			if (shape instanceof KonvaModule.Rect) {
				shapeData.width = shape.width() || 0;
				shapeData.height = shape.height() || 0;
			} else if (shape instanceof KonvaModule.Circle) {
				shapeData.radius = shape.radius() || 0;
			} else if (shape instanceof KonvaModule.Line) {
				shapeData.points = shape.points();
			}
			shapesToSave.push(shapeData);
		});
		await saveShapes(data.buildingName, shapesToSave);
		alert(`${data.buildingName} 데이터가 저장되었습니다.`);
	}

	$: {
		if (selectedShape) {
			const shape = selectedShape.findOne('Shape') as Konva.Shape;
			if (shape && shape.fill() !== fillColor) {
				shape.fill(fillColor);
				layer?.draw();
			}
		}
	}

	onMount(() => {
		let stageInstance: Konva.Stage | null = null;
		function handleResize() {
			if (stageInstance) {
				stageInstance.width(window.innerWidth);
				stageInstance.height(window.innerHeight);
			}
		}

		(async () => {
			const module = await import('konva');
			KonvaModule = module.default;

			stage = new KonvaModule.Stage({
				container: 'canvas-container',
				width: window.innerWidth,
				height: window.innerHeight,
				draggable: true
			});
			stageInstance = stage;

			layer = new KonvaModule.Layer();
			stage.add(layer);

			transformer = new KonvaModule.Transformer({
				rotationSnaps: [0, 90, 180, 270],
				borderStroke: 'royalblue',
				borderDash: [3, 3]
			});
			layer.add(transformer);

			// Load initial data
			data.shapes.forEach((shapeData) => {
				addGroup(shapeData, shapeData.text || '');
			});

			stage.on('mousedown touchstart', (e) => {
				// 1. Clear selection logic
				if (e.target === stage) {
					selectedShape = null;
					transformer.nodes([]);
					hideLineAnchors();
					layer.draw();
				}

				// 2. Start drawing line logic
				if (!isDrawingLine || e.target !== stage) {
					return;
				}
				const pos = stage.getPointerPosition();
				if (!pos) return;

				lineStartPoint = { x: pos.x, y: pos.y };
				currentLine = new KonvaModule.Line({
					stroke: fillColor,
					strokeWidth: 5,
					points: [pos.x, pos.y, pos.x, pos.y]
				});
				layer.add(currentLine);
			});

			stage.on('mousemove', () => {
				if (!isDrawingLine || !currentLine || !lineStartPoint) return;
				const pos = stage.getPointerPosition();
				if (!pos) return;
				const newPoints = [lineStartPoint.x, lineStartPoint.y, pos.x, pos.y];
				currentLine.points(newPoints);
				layer.batchDraw();
			});

			stage.on('mouseup touchend', () => {
				if (!isDrawingLine || !currentLine) return;

				const points = currentLine.points();
				const start = { x: points[0], y: points[1] };
				const end = { x: points[2], y: points[3] };

				if (Math.hypot(end.x - start.x, end.y - start.y) > 5) {
					const lineGroup = new KonvaModule.Group({
						x: start.x,
						y: start.y,
						draggable: true
					});
					currentLine.points([0, 0, end.x - start.x, end.y - start.y]);
					currentLine.name('main-shape');
					lineGroup.add(currentLine);
					layer.add(lineGroup);
					bindShapeEvents(lineGroup);
				} else {
					currentLine.destroy();
				}

				isDrawingLine = false;
				currentLine = null;
				lineStartPoint = null;
				stage.draggable(true);
				layer.draw();
			});

			konvaLoaded = true;

			const scaleBy = 1.05;
			stage.on('wheel', (e) => {
				e.evt.preventDefault();
				const oldScale = stage.scaleX();
				const pointer = stage.getPointerPosition();
				if (!pointer) return;
				const mousePointTo = {
					x: (pointer.x - stage.x()) / oldScale,
					y: (pointer.y - stage.y()) / oldScale
				};
				const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
				stage.scale({ x: newScale, y: newScale });
				const newPos = {
					x: pointer.x - mousePointTo.x * newScale,
					y: pointer.y - mousePointTo.y * newScale
				};
				stage.position(newPos);
			});

			window.addEventListener('resize', handleResize);
		})();

		return () => {
			window.removeEventListener('resize', handleResize);
			if (stageInstance) stageInstance.destroy();
		};
	});
</script>

<div class="toolbar_container">
	<button on:click={addRect} disabled={!konvaLoaded}>사각형 추가</button>
	<button on:click={addCircle} disabled={!konvaLoaded}>원 추가</button>
	<button on:click={toggleDrawingLine} class:active={isDrawingLine} disabled={!konvaLoaded}>선 그리기</button>
	<button on:click={saveCanvasState} disabled={!konvaLoaded}>저장하기</button>
	<input type="color" bind:value={fillColor} title="채우기 색상" />
	<button on:click={deleteShape} disabled={!selectedShape}>삭제</button>
	
	<input
		type="file"
		bind:this={fileInput}
		on:change={extractShapesFromImage}
		accept="image/*"
		style="display: none;"
	/>
	<button on:click={() => fileInput.click()} disabled={isLoadingFromImage || !konvaLoaded}>
		{isLoadingFromImage ? '처리 중...' : '사진으로 다이어그램 만들기'}
	</button>
	{#if errorFromImage}
		<span class="error-text">{errorFromImage}</span>
	{/if}
</div>

<div id="canvas-container" class="canvas_container" />

<style>
	:global(body) {
		margin: 0;
		overflow: hidden;
	}
	.toolbar_container {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 10;
		display: flex;
		gap: 8px;
		background-color: rgba(255, 255, 255, 0.8);
		padding: 8px;
		border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		align-items: center;
	}
	.canvas_container {
		width: 100vw;
		height: 100vh;
	}
	button {
		padding: 8px 12px;
		font-size: 14px;
		cursor: pointer;
	}
	button.active {
		background-color: #a0c4ff; /* 활성화 시 색상 변경 */
	}
	.error-text {
		color: crimson;
		font-size: 14px;
	}
</style>
