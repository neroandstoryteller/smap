<script lang="ts">
    import CanvasComponent from "$lib/component/canvas/canvasComponent.svelte";
    import type { ShapeData } from '$lib/models/shapes';
    import { mapName } from "$lib/store/schoolDataStore";
    import { onMount } from "svelte";

	export let data: {
		mapName: string;
		shapes: ShapeData[];
	};
    
    const shapeData = data.shapes;

    onMount(()=>{
        $mapName = data.mapName;
    })
</script>

<CanvasComponent shapeData={shapeData}/>