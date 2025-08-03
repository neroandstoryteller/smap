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

        addGroup

	} from "$lib/store/canvasStore";
	import { saveShapes } from "$lib/database/firestore";
	import Konva from "konva";
	import type { ShapeData } from "$lib/models/shapes";
	import { school } from "$lib/store/schoolDataStore";
	import { cos, mod } from "three/tsl";
	import { slide } from "svelte/transition";
	import { onMount, onDestroy } from "svelte";
	import { Group } from "konva/lib/Group";

	// Keyboard event listener
	let unsubscribeKeydown: () => void;

	onMount(() => {
		const unsubscribe = isReady.subscribe((ready) => {
			if (ready) {
				const handleKeydown = (event: KeyboardEvent) => {
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        switch (event.key.toLowerCase()) {
                            case "z":
                                undo();
                                break;
                            case "y":
                                redo();
                                break;
                            case "c":
                                copy();
                                break;
                            case "v":
                                paste();
                                break;
                            case "x":
                                cut();
                                break;
                            case "s":
                                // No functionality for Ctrl+S as per instructions
                                break;
                        }
                    } else {
                        // Handle Delete and Backspace keys without Ctrl/Cmd
                        if (event.key === "Delete") {
                            event.preventDefault();
                            del();
                        }
                    }
				};

				window.addEventListener("keydown", handleKeydown);
				unsubscribeKeydown = () => window.removeEventListener("keydown", handleKeydown);
			}
		});

		return () => {
			unsubscribe();
			if ($layer) {
				$layer.off("add remove dragend transformend");
			}
			if (unsubscribeKeydown) unsubscribeKeydown();
		};
	});

	onDestroy(() => {
		if (unsubscribeKeydown) unsubscribeKeydown();
	});

	function undo() {
        if (!$isReady || $step <= 0) return;
		$step--;
		restoreCanvas();
	}

	function redo() {
		if (!$isReady || $step >= $history.length - 1) return;

		$step++;
		restoreCanvas();
	}

	function copy() {
		if (!$isReady || !$selectedShape) return;

		$clipboardShape = $selectedShape.clone();
	}

    function paste() {
        if (!$isReady || !$clipboardShape) return;

		const shapeData = getShapeData($clipboardShape);
        if (!shapeData) return;
        shapeData.x += 10;
        shapeData.y += 10;
        addGroup(shapeData, shapeData.text || "")
	}

	function cut() {
		if (!$isReady || !$selectedShape) return;

		copy();
        del();
	}

    function del() {
        if (!$isReady || !$selectedShape) return;

        $selectedShape!.destroy();
		$selectedShape = null;
        $transformer!.nodes([]);
		refreshCanvas();
    }

</script>

<div class="toolbar-aria">
	<div class="toolbar" transition:slide={{ duration: 300 }}>
		<button
			class="button"
			on:click={undo}
			disabled={!$isReady || $step <= 0}
			aria-label="실행 취소"
		>
			<span class="material-symbols-outlined">undo</span>
			<span class="tooltip">실행 취소</span>
		</button>
		<button
			class="button"
			on:click={redo}
			disabled={!$isReady || $step >= $history.length - 1}
			aria-label="다시 실행"
		>
			<span class="material-symbols-outlined">redo</span>
			<span class="tooltip">다시 실행</span>
		</button>
		<button
			class="button"
			on:click={copy}
			disabled={!$isReady || !$selectedShape}
			aria-label="복사"
		>
			<span class="material-symbols-outlined">content_copy</span>
			<span class="tooltip">복사</span>
		</button>
		<button
			class="button"
			on:click={paste}
			disabled={!$isReady || !$clipboardShape}
			aria-label="붙여넣기"
		>
			<span class="material-symbols-outlined">content_paste</span>
			<span class="tooltip">붙여넣기</span>
		</button>
		<button
			class="button"
			on:click={cut}
			disabled={!$isReady || !$selectedShape}
			aria-label="잘라내기"
		>
			<span class="material-symbols-outlined">content_cut</span>
			<span class="tooltip">잘라내기</span>
		</button>
		<button
			class="button"
			on:click={del}
			disabled={!$isReady || !$selectedShape}
			aria-label="삭제"
		>
			<span class="material-symbols-outlined">delete</span>
			<span class="tooltip">삭제</span>
		</button>
	</div>
</div>

<style lang="scss">
	@use "$lib/style/main.scss" as *; // SCSS 변수와 믹스인 파일 경로

    .toolbar-aria {
        left: 0;
        position: fixed;
        justify-content: center;
        align-items: center;
        display: flex;
        bottom: 0;
        width: 100vw;
    }

	.toolbar {
        border-radius: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
		background: $colorWhite;
		padding: 10px;
		box-shadow: $boxShadow;
		z-index: 1000;
	}

	.button {
		@include typography-small;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		margin: 0 8px;
		border: none;
		border-radius: 8px;
		background: $colorBright;
		color: $color-text-primary;
		cursor: pointer;
		transition: $transition;
		position: relative;

		&:hover {
			background: $colorSymbolGreen;
			color: $color-text-inverse;
		}

		&:disabled {
			background: $colorMedium;
			color: $colorWhite;
			cursor: not-allowed;
			opacity: 0.6;
		}

		.material-icons {
			font-size: $font-size-large;
		}
	}

	.tooltip {
		visibility: hidden;
		background: $color-text-primary;
		color: $color-text-inverse;
		@include typography-small;
		padding: 4px 8px;
		border-radius: 4px;
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		white-space: nowrap;
		z-index: 10;
	}

	.button:hover .tooltip {
		visibility: visible;
	}
</style>