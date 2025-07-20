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

		const shapeType = shapeConfig.type as 'Rect' | 'Circle';
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
		} else {
			shape = new KonvaModule.Rect({
				...newShapeConfig,
				x: 0,
				y: 0
			});
		}

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

	function bindShapeEvents(group: Konva.Group) {
		group.on('mousedown touchstart', () => selectShape(group));
		group.on('dragend', () => layer.draw());

		group.on('transformend', () => {
			const shape = group.findOne('Shape') as Konva.Shape;
			const text = group.findOne('Text') as Konva.Text;
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
			layer.draw();
		});

		group.on('dblclick dbltap', () => editText(group));
	}

	function editText(group: Konva.Group) {
		const textNode = group.findOne('Text') as Konva.Text;
		const shape = group.findOne('Shape') as Konva.Shape;
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

	function selectShape(group: Konva.Group) {
		selectedShape = group;
		const shape = group.findOne('Shape') as Konva.Shape;
		if (shape) {
			const shapeFill = shape.fill();
			if (typeof shapeFill === 'string') fillColor = shapeFill;
		}
		transformer.nodes([group]);
		layer.draw();
	}

	function clearSelection(e: Konva.KonvaEventObject<MouseEvent>) {
		if (e.target === stage) {
			selectedShape = null;
			transformer.nodes([]);
			layer.draw();
		}
	}

	function deleteShape() {
		if (selectedShape) {
			transformer.nodes([]);
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
			const shape = group.findOne('Shape') as Konva.Shape;
			const text = group.findOne('Text') as Konva.Text;
			if (!shape) return;

			const shapeData: ShapeData = {
				id: group.id(),
				type: shape.getClassName() as 'Rect' | 'Circle',
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

			stage.on('mousedown touchstart', clearSelection);
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
	<button on:click={saveCanvasState} disabled={!konvaLoaded}>저장하기</button>
	<input type="color" bind:value={fillColor} title="채우기 색상" />
	<button on:click={deleteShape} disabled={!selectedShape}>삭제</button>
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
</style>
