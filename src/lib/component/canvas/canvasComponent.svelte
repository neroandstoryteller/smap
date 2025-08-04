<script lang="ts">
	export let shapeData: ShapeData[] | null;
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

        restoreCanvas

	} from "$lib/store/canvasStore";
    import { onMount } from "svelte";
    import SnapUtil from "$lib/component/canvas/utils/snapUtil.svelte";
    import SideBarUtil from "$lib/component/canvas/utils/sideBarUtil.svelte";
    import ShortCutUtil from "./utils/shortCutUtil.svelte";
    import type { ShapeData } from "$lib/models/shapes";

    let canvasContainer: HTMLDivElement;

    function handleResize() {
        if ($stage) {
            $stage.width(window.innerWidth - 70);
            $stage.height(window.innerHeight);
        }
    }

    onMount(() => {
        (async () => {
            await initCanvas(canvasContainer);
	
            if ($stage && $layer && $konvaModule && $transformer && shapeData !== null) {
                $isReady = true;
				restoreCanvas(shapeData);
				saveHistory();
                console.log("Ready");
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
				// 1. Clear selection logic
				if (e.target === $stage) {
					$selectedShape = null;
					$transformer!.nodes([]);
					refreshCanvas();
				}
			});

			window.addEventListener('resize', handleResize);
		})();

        return () => {
            window.removeEventListener("resize", handleResize);
            removeCanvas();
        };
    });
</script>

<div class="canvas-container" bind:this={canvasContainer}></div>

<SideBarUtil />
<SnapUtil />
<ShortCutUtil />

<style>
    .canvas-container {
        width: calc(100vh - 70px);
        height: 100vh;
    }
</style>
