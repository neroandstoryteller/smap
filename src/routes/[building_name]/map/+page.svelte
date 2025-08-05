<script lang="ts">
	import { page } from '$app/stores';
	import CanvasComponent from '$lib/component/canvasComponent.svelte';
	import type { ShapeData } from '$lib/models/shapes';
	import { school } from '$lib/store/schoolDataStore';
	import { onMount } from 'svelte';

	export let data: {
		buildingName: string;
		shapes: ShapeData[];
	};
	const shapeData = data.shapes;

	let selectShapeName: string | null = null;
	$: selectShapeName = $page.url.searchParams.get('selectShapeName');

	onMount(() => {
		$school.buildingName = data.buildingName;
	});
</script>

<CanvasComponent shapeData={shapeData} {selectShapeName} />
