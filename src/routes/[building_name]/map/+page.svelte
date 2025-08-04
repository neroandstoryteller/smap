<script lang="ts">
    import CanvasComponent from "$lib/component/canvasComponent.svelte";
    import type { ShapeData } from '$lib/models/shapes';
    import { school } from "$lib/store/schoolDataStore";
    import { onMount } from "svelte";

	export let data: {
		buildingName: string;
		shapes: ShapeData[];
	};
    
    const shapeData = data.shapes;

    onMount(()=>{
        $school.buildingName = data.buildingName;
    })
</script>

<CanvasComponent shapeData={shapeData}/>