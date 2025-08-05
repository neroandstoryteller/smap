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
		step,
		history,
		clipboardShape,
		refreshCanvas,
		saveHistory,
		restoreCanvas,
		getShapeData,
		addGroup,
		save,
		fillColor
	} from "$lib/store/canvasStore";
	import Konva from "konva";

	let shapeWidth = $state(0);
	let shapeHeight = $state(0);
	let shapeRadius = $state(0);
	let shapeRotation = $state(0);
	let shapeX = $state(0);
	let shapeY = $state(0);
	let isCircle = $state(false);

	// Formatter function to limit to one decimal place
	function formatToOneDecimal(value: number): number {
		return Math.round(value * 10) / 10;
	}

	// Formatted values for display
	let displayWidth = $derived(formatToOneDecimal(shapeWidth));
	let displayHeight = $derived(formatToOneDecimal(shapeHeight));
	let displayRadius = $derived(formatToOneDecimal(shapeRadius));
	let displayRotation = $derived(formatToOneDecimal(shapeRotation));
	let displayX = $derived(formatToOneDecimal(shapeX));
	let displayY = $derived(formatToOneDecimal(shapeY));

	function updateShapeProperties() {
		if ($selectedShape) {
			const shape = $selectedShape.findOne("Shape") as Konva.Shape;
			if (shape) {
				if (isCircle) {
					(shape as Konva.Circle).radius(shapeRadius);
				} else {
					$selectedShape.scaleX(shapeWidth / shape.width());
					$selectedShape.scaleY(shapeHeight / shape.height());
				}
				$selectedShape.rotation(shapeRotation);
				$selectedShape.x(shapeX);
				$selectedShape.y(shapeY);
				refreshCanvas();
				saveHistory();
				$selectedShape.fire('transformend');
			}
		}
	}

	// Function to sync state with shape's current properties
	function syncShapeProperties() {
		if ($selectedShape) {
			const shape = $selectedShape.findOne("Shape") as Konva.Shape;
			if (shape) {
				isCircle = shape instanceof Konva.Circle;
				if (isCircle) {
					shapeRadius = formatToOneDecimal((shape as Konva.Circle).radius());
					shapeWidth = 0;
					shapeHeight = 0;
				} else {
					shapeWidth = formatToOneDecimal(shape.width() * shape.scaleX());
					shapeHeight = formatToOneDecimal(shape.height() * shape.scaleY());
					shapeRadius = 0;
				}
				shapeRotation = formatToOneDecimal($selectedShape.rotation());
				shapeX = formatToOneDecimal($selectedShape.x());
				shapeY = formatToOneDecimal($selectedShape.y());
				$layer?.draw();
			}
		}
	}

	$effect(() => {
		// Clean up previous event listeners to avoid duplicates
		const oldShape = $selectedShape;
		// if (oldShape) {
		// 	oldShape.off('dragend transformend');
		// }

		// Set up event listeners for the new selected shape
		if ($selectedShape && $isReady) {
			const shape = $selectedShape.findOne("Shape") as Konva.Shape;
			if (shape) {
				shape.fill($fillColor);
				isCircle = shape instanceof Konva.Circle;
				syncShapeProperties();

				// Listen for dragend and transformend events
				$selectedShape.on('dragend transformend', () => {
					syncShapeProperties();
				});
			}
		} else {
			shapeWidth = 0;
			shapeHeight = 0;
			shapeRadius = 0;
			shapeRotation = 0;
			shapeX = 0;
			shapeY = 0;
			isCircle = false;
		}

		// Cleanup event listeners when component or shape is destroyed
		return () => {
			// if (oldShape) {
			// 	oldShape.off('dragend transformend');
			// }
		};
	});

	$effect(() => {
		// Update shape properties when state changes
		shapeX;
		shapeY;
		shapeWidth;
		shapeHeight;
		shapeRadius;
		shapeRotation;
		$fillColor;

		updateShapeProperties();
	});
</script>

<div class="shape-info">
	<div class="shape-property color-property">
		<div class="label">색상:</div>
        <input 
            type="color" 
            bind:value={$fillColor} 
            title="채우기 색상" 
            disabled={!$isReady}
            onchange={saveHistory}
            class="color-picker"
        />
	</div>
	<div class="shape-property">
		<div class="label">X:</div>
		<input 
			type="number" 
			bind:value={displayX} 
			oninput={() => { shapeX = displayX; updateShapeProperties(); }}
			disabled={!$selectedShape || !$isReady}
		/>
	</div>
	<div class="shape-property">
		<div class="label">Y:</div>
		<input 
			type="number" 
			bind:value={displayY} 
			oninput={() => { shapeY = displayY; updateShapeProperties(); }}
			disabled={!$selectedShape || !$isReady}
		/>
	</div>
	{#if isCircle}
		<div class="shape-property">
			<div class="label">반지름:</div>
			<input 
				type="number" 
				bind:value={displayRadius} 
				oninput={() => { shapeRadius = displayRadius; updateShapeProperties(); }}
				min="0"
				disabled={!$selectedShape || !$isReady}
			/>
		</div>
	{:else}
		<div class="shape-property">
			<div class="label">가로:</div>
			<input 
				type="number" 
				bind:value={displayWidth} 
				oninput={() => { shapeWidth = displayWidth; updateShapeProperties(); }}
				min="0"
				disabled={!$selectedShape || !$isReady}
			/>
		</div>
		<div class="shape-property">
			<div class="label">세로:</div>
			<input 
				type="number" 
				bind:value={displayHeight} 
				oninput={() => { shapeHeight = displayHeight; updateShapeProperties(); }}
				min="0"
				disabled={!$selectedShape || !$isReady}
			/>
		</div>
	{/if}
	<div class="shape-property">
		<div class="label">회전:</div>
		<input 
			type="number" 
			bind:value={displayRotation} 
			oninput={() => { shapeRotation = displayRotation; updateShapeProperties(); }}
			min="0"
			max="360"
			disabled={!$selectedShape || !$isReady}
		/>
	</div>
</div>

<style lang="scss">
	@use "$lib/style/main.scss" as *;

	.shape-info {
		display: flex;
		flex-direction: column;
		padding: 10px;
		gap: 10px;

		.shape-property {
			display: flex;
			align-items: center;
			gap: 8px;

			.label {
				@include typography-body;
				color: $color-text-primary;
				width: 60px;
			}

			input[type="number"] {
				width: 80px;
				padding: 4px;
				border: 1px solid $colorMedium;
				border-radius: 4px;
				@include typography-body;
				transition: $transition border-color;

				&:hover:not(:disabled) {
					border-color: $colorSymbolGreen;
				}

				&:focus {
					outline: none;
					border-color: $colorSymbolGreen;
					box-shadow: 0 0 6px rgba($colorSymbolGreen, 0.2);
				}

				&:disabled {
					background: $colorMedium;
					color: $color-text-tertiary;
					cursor: not-allowed;
					opacity: 0.6;
				}
			}
		}

		.color-property {
			.color-picker {
				width: 90px;
				height: 34px;
				-webkit-appearance: none;
				-moz-appearance: none;
				appearance: none;
				background-color: green;
				border: solid 1px $colorDark;
				border-radius: 4px;
				&:hover {
					outline: none;
					border-color: $colorSymbolGreen;
					box-shadow: 0 0 6px rgba($colorSymbolGreen, 0.2);
				}
			}
			/* 안쪽부분의 디자인 변경 */
			.color-picker::-webkit-color-swatch {
				border: none;
				margin: -10px;
				width: 200%;
				height: 200%;
			}
		}
	}
</style>