<script lang="ts">
    import { browser } from "$app/environment";
    import CanvasComponent from "$lib/component/canvasComponent.svelte";
    import type { ShapeData } from '$lib/models/shapes';
    import { school } from "$lib/store/schoolDataStore";
    import { onMount } from "svelte";

	export let data: {
		buildingName: string;
		shapes: ShapeData[];
	};
    const shapeData = data.shapes;
    let selectShapeName: string | null = null;
    
    if (browser) {
        // Only access window.location in the browser (client-side)
        const urlParams = new URLSearchParams(window.location.search);
        selectShapeName = urlParams.get('selectShapeName') || null;
    }

    onMount(()=>{
        $school.buildingName = data.buildingName;
    })
</script>

<CanvasComponent shapeData={shapeData} selectShapeName={selectShapeName}/>