<script lang="ts">
    import CanvasComponent from "$lib/component/canvas/canvasComponent.svelte";
    import type { ShapeData } from '$lib/models/shapes';

	export let data: {
		mapName: string;
		shapes: ShapeData[];
	};
    
    const shapeData = data.shapes;
</script>

<CanvasComponent shapeData={shapeData}/>