<script lang="ts">
	const {
		shapeData,
		selectShapeName
	}: { shapeData: ShapeData[] | null; selectShapeName: string | null } = $props();

	import { fade, slide } from 'svelte/transition';
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
		saveHistory,
		initCanvas,
		removeCanvas,
		refreshCanvas,
		restoreCanvas,
		resetSelectedShape,
		selectShape,
		getShapeData
	} from '$lib/store/canvasStore';
	import { onMount } from 'svelte';
	import SnapUtil from '$lib/component/canvas/utils/snapUtil.svelte';
	import SideBarComponent from '$lib/component/canvas/sideBarComponent.svelte';
	import ShortCutComponent from './canvas/shortCutComponent.svelte';
	import type { ShapeData } from '$lib/models/shapes';
	import Konva from 'konva';

	let canvasContainer: HTMLDivElement;

	function handleResize() {
		if ($stage) {
			$stage.width(window.innerWidth - 90);
			$stage.height(window.innerHeight);
		}
	}

	// 선택된 도형 위치로 화면 이동
	function moveToSelectedShape() {
		// if (!$stage || !$selectedShape || $editable) return;

		// // 부드러운 애니메이션으로 이동
		// $stage.to({
		// 	x: $stage.width() / 2 - $selectedShape.x(),
		// 	y: $stage.height() / 2 - $selectedShape.y(),
		// 	duration: 0.5, // 0.5초 애니메이션
		// 	easing: Konva.Easings.EaseInOut
		// });
	}

	onMount(() => {
		(async () => {
			await initCanvas(canvasContainer);

			if ($stage && $layer && $konvaModule && $transformer && shapeData !== null) {
				$isReady = true;
				$editable = false;
				restoreCanvas(shapeData);
				refreshCanvas();
				saveHistory();
				applyEditable();
				console.log('Ready');
			}

			if (!$isReady) return;

			const scaleBy = 1.05;
			$stage!.on('wheel', (e) => {
				e.evt.preventDefault();
				const oldScale = $stage!.scaleX();
				const pointer = $stage!.getPointerPosition();
				if (!pointer) return;
				const mousePointTo = {
					x: (pointer.x - $stage!.x()) / oldScale,
					y: (pointer.y - $stage!.y()) / oldScale
				};
				const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
				$stage!.scale({ x: newScale, y: newScale });
				const newPos = {
					x: pointer.x - mousePointTo.x * newScale,
					y: pointer.y - mousePointTo.y * newScale
				};
				$stage!.position(newPos);
			});

			$stage!.on('mousedown touchstart', (e) => {
				if (e.target === $stage) {
					resetSelectedShape();
					$transformer!.nodes([]);
					refreshCanvas();
				}
			});

			window.addEventListener('resize', handleResize);
		})();

		return () => {
			window.removeEventListener('resize', handleResize);
			removeCanvas();
		};
	});

	function gotoSelectShape() {
		console.log(selectShapeName);
		if (!$isReady || !selectShapeName) return;

		let targetShape = null;

		// Loop through all shapes to find the one where the text of '.main-shape' matches selectShapeName
		for (const shape of $shapes) {
			const shapeData = getShapeData(shape); // Assuming it's a Konva.Text for text property
			if (shapeData && shapeData.text === selectShapeName) {
				targetShape = shape;
				break; // Stop once found
			}
		}

		if (targetShape) {
			// Set the found shape as the selected shape
			selectShape(targetShape);
		}
	}

	function applyEditable() {
		if (!$layer) return;
		$layer.getChildren().forEach((shape) => {
			shape.draggable($editable);
		});
		$transformer!.nodes([]);
		$transformer!.visible($editable);
	}

	// selectedShape 변경 시 화면 이동
	$effect(() => {
		if (!$isReady || !$selectedShape) return;
		moveToSelectedShape();
	});

	$effect(() => {
		if (!$isReady) return;
		applyEditable();
	});

	$effect(() => {
		if (selectShapeName) {
			gotoSelectShape();
		}
	});
</script>

<div class="canvas-container" bind:this={canvasContainer}></div>

<SideBarComponent />
<SnapUtil />
{#if $editable}
    <ShortCutComponent />
{/if}

<style>
	.canvas-container {
		width: calc(100vw - 90px);
		height: 100vh;
	}
</style>
