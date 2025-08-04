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
		fillColor,
		addGroup,
		save,

		refreshCanvas,
		saveHistory,
        getShapeData,
	} from "$lib/store/canvasStore";
	import { saveShapes } from "$lib/database/firestore";
	import Konva from "konva";
	import type { ShapeData } from "$lib/models/shapes";
	import { mapName, school } from "$lib/store/schoolDataStore";
    import AddShapeComponent from "./sideBar/addShapeComponent.svelte";
    import ShapeInfoComponent from "./sideBar/shapeInfoComponent.svelte";
	import DetailComponent from "./sideBar/detailComponent.svelte";
    import { mod } from "three/tsl";


	let schoolName = $derived($school.schoolName);

	let isLoadingFromImage = $state(false);
	let errorFromImage: string | null = $state(null);
	let fileInput: HTMLInputElement | null = $state(null);

	let lineAnchors: Konva.Circle[] = [];

	const mode = {
		diagram: "diagram",
		detail: "detail",
	};

	function toggleEditable(){
		$editable = !$editable;
	}

	function finishEditing(){
		save();
		toggleEditable()
	}

	let sideBarMode: string = $state(mode.diagram);

	function setSideBarMode(mode:string){
		sideBarMode = mode;
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
			saveHistory();
		} catch (e: any) {
			errorFromImage = e.message;
		} finally {
			isLoadingFromImage = false;
			// 동일한 파일을 다시 선택할 수 있도록 입력 값 초기화
			input.value = "";
		}
	}

	$effect(()=>{
		if (!$isReady) return;

		if(!$editable){
			if(sideBarMode === mode.diagram){
				setSideBarMode(mode.detail);
			}
		}
	})
</script>

<div class="side-bar">
	<div class="head">
		{#if $editable}
			<button class="mode-button" onclick={() => {setSideBarMode(mode.diagram)}} disabled={!$isReady} class:activated={sideBarMode === mode.diagram}>
				<span class="material-symbols-outlined">shapes</span>
				<span class="tooltip">도형</span>
			</button>
		{/if}

		<button class="mode-button" onclick={() => {setSideBarMode(mode.detail)}} disabled={!$isReady} class:activated={sideBarMode === mode.detail}>
			<span class="material-symbols-outlined">manage_search</span>
			<span class="tooltip">정보</span>
		</button>
		
		{#if $editable}
			<input
				type="file"
				bind:this={fileInput}
				onchange={extractShapesFromImage}
				accept="image/*"
				style="display: none;"
			/>
			<button
				class="head-button"
				onclick={() => fileInput!.click()}
				disabled={isLoadingFromImage || !$isReady}
			>
				<span class="material-symbols-outlined">upload</span>
				<span class="tooltip">이미지로 도형 생성</span>
			</button>
			<button class="head-button" onclick={() => save()} disabled={!$isReady}>
				<span class="material-symbols-outlined">save</span>
				<span class="tooltip">저장하기</span>
			</button>
		{/if}

		{#if $editable}
			<button class="head-button" onclick={finishEditing} disabled={!$isReady}>
				<span class="material-symbols-outlined">check</span>
				<span class="tooltip">편집완료</span>
			</button>
		{:else}
			<button class="head-button" onclick={toggleEditable} disabled={!$isReady}>
				<span class="material-symbols-outlined">edit_square</span>
				<span class="tooltip">편집하기</span>
			</button>
		{/if}

	</div>

	<div class="body">
		{#if sideBarMode === mode.diagram}
			<AddShapeComponent />
			<ShapeInfoComponent />
		{:else if sideBarMode === mode.detail}
			<DetailComponent />
		{/if}
	</div>
</div>

<style lang="scss">
	@use "$lib/style/main.scss" as *;

	.side-bar{
		width: 300px;
		transition: $transition;
		right: 0;
		display: flex;
		height: 100%;
		padding-top: 10px;
		padding-left: 10px;
		position: fixed;
		box-shadow: $boxShadow;
		flex-flow: column;
		background-color: $colorBright;

		button{
			@include typography-body-bold;
			margin: 0;
			padding: 5px;
			border: none;
			
			background: $colorWhite;
			color: $color-text-primary;
			border-radius: 10px;

			cursor: pointer;
			transition:
				$transition background-color,
				$transition transform,
				$transition box-shadow;

			&:disabled {
				background: $colorMedium;
				color: $color-text-tertiary;
				cursor: not-allowed;
				opacity: 0.6;
			}

			.tooltip {
				visibility: hidden;
				background: $color-text-primary;
				color: $color-text-inverse;
				@include typography-small;
				padding: 4px 8px;
				border-radius: 4px;
				position: absolute;

				transform: translate(-80%, 120%);
				white-space: nowrap;
				z-index: 10;
			}

			&:hover .tooltip {
				visibility: visible;
			}
		}

		.head {
			display: flex; /* Use flexbox for the head container */
			flex-wrap: wrap; /* Allow wrapping if needed */
			width: 100%; /* Ensure head takes full width of sidebar */
			box-sizing: border-box;
			gap: 2px;

			.mode-button {
				flex: 1; /* Make mode buttons grow to fill available space */
				min-width: 0; /* Prevent overflow issues */
				border-radius: 10px 10px 0px 0px; /* Keep original border-radius */
				display: flex;
				justify-content: center; /* Center content */
				align-items: center;
				flex-wrap: wrap; /* Keep original flex-wrap */

				&:hover:not(:disabled) {
					background: $colorSymbolGreen;
					color: $color-text-inverse;
					box-shadow: 0 0 8px rgba($colorSymbolGreen, 0.4);
				}

				&.activated {
					background: $colorSymbolGreen;
					color: $color-text-inverse;
					box-shadow: 0 0 8px rgba($colorSymbolGreen, 0.4);
				}
			}

			.head-button {
				width: 40px;
				display: flex;
				justify-content: center;
				align-items: center;
				border-radius: 10px 10px 0px 0px; /* Keep original border-radius */

				&:hover:not(:disabled) {
					background: $colorSymbolGreen;
					color: $color-text-inverse;
					box-shadow: 0 0 8px rgba($colorSymbolGreen, 0.4);
				}
			}
		}

		.body{
			background-color: $colorWhite;
			padding: 10px;
			display: flex;
			height: 100%;
			flex-flow: column;
		}
	}

	hr{
		margin: 4px;
	}
</style>
