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
		isEditingDetail,

        resetSelectedShape

	} from "$lib/store/canvasStore";
	import { saveShapes } from "$lib/database/firestore";
	import Konva from "konva";
	import type { ShapeData } from "$lib/models/shapes";
	import { school } from "$lib/store/schoolDataStore";
	import { slide } from "svelte/transition";
	import { onMount, onDestroy } from "svelte";
	import { Group } from "konva/lib/Group";

	// Keyboard event listener
	let unsubscribeKeydown: () => void;
	// Context menu state
	let showContextMenu = false;
	let contextMenuX = 0;
	let contextMenuY = 0;
	let contextShape: Konva.Group | null = null;
	// Z-index submenu state
	let showZIndexSubmenu = false;

	onMount(() => {
		const unsubscribe = isReady.subscribe((ready) => {
			if (ready) {
				const handleKeydown = (event: KeyboardEvent) => {
					if (event.ctrlKey || event.metaKey) {
						if ($isEditingDetail) return;
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
								save();
								break;
						}
					} else {
						if (event.key === "Delete") {
							event.preventDefault();
							del();
						}
					}
				};

				// Add right-click event listener to shapes
				$layer?.on("contextmenu", (e) => {
					e.evt.preventDefault();
					if (e.target instanceof Konva.Group) {
						contextShape = e.target as Konva.Group;
						$selectedShape = contextShape;
						$transformer?.nodes([contextShape]);
						const stagePos = $stage?.getPointerPosition();
						if (stagePos) {
							contextMenuX = stagePos.x;
							contextMenuY = stagePos.y;
							showContextMenu = true;
						}
					}
				});

				// Close context menu when clicking elsewhere
				$stage?.on("click tap", () => {
					showContextMenu = false;
					contextShape = null;
				});

				window.addEventListener("keydown", handleKeydown);
				unsubscribeKeydown = () => window.removeEventListener("keydown", handleKeydown);
			}
		});

		return () => {
			unsubscribe();
			if ($layer) {
				$layer.off("add remove dragend transformend contextmenu");
			}
			if ($stage) {
				$stage.off("click tap");
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
		const shapeData = $history[$step];
		restoreCanvas(shapeData);
	}

	function redo() {
		if (!$isReady || $step >= $history.length - 1) return;
		$step++;
		const shapeData = $history[$step];
		restoreCanvas(shapeData);
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
		addGroup(shapeData, shapeData.text || "");
	}

	function cut() {
		if (!$isReady || !$selectedShape) return;
		copy();
		del();
	}

	function del() {
		if (!$isReady || !$selectedShape) return;
		console.log($selectedShape);
		$selectedShape!.destroy();
		resetSelectedShape();
		$transformer!.nodes([]);
		refreshCanvas();
	}

	// Z-index manipulation functions
	function bringForward() {
		if (!$isReady || !$selectedShape) return;
		$selectedShape.moveUp();
		refreshCanvas();
		saveHistory();
	}

	function bringToFront() {
		if (!$isReady || !$selectedShape) return;
		$selectedShape.moveToTop();
		refreshCanvas();
		saveHistory();
	}

	function sendBackward() {
		if (!$isReady || !$selectedShape) return;
		$selectedShape.moveDown();
		refreshCanvas();
		saveHistory();
	}

	function sendToBack() {
		if (!$isReady || !$selectedShape) return;
		$selectedShape.moveToBottom();
		refreshCanvas();
		saveHistory();
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
		<div
			class="button z-index-button"
			role="button"
			tabindex="0"
			on:mouseenter={() => {
				if (!$isReady || !$selectedShape) return; // 비활성화 시 이벤트 무시
				showZIndexSubmenu = true;
			}}
			on:mouseleave={() => {
				if (!$isReady || !$selectedShape) return; // 비활성화 시 이벤트 무시
				showZIndexSubmenu = false;
			}}
			on:keydown={(e) => { 
				if (!$isReady || !$selectedShape) return; // 비활성화 시 이벤트 무시
				if (e.key === 'Enter' || e.key === 'Space') {
				showZIndexSubmenu = !showZIndexSubmenu;
				}
			}}
			aria-label="Z-인덱스 조정"
			aria-disabled={!$isReady || !$selectedShape} 
			aria-expanded={showZIndexSubmenu}
		>
			<span class="material-symbols-outlined">layers</span>
			{#if showZIndexSubmenu}
				<div class="z-index-submenu" role="menu" transition:slide={{ duration: 200 }}>
				<!-- 서브메뉴에 role="menu" 추가 -->
				<button
					class="submenu-item"
					role="menuitem"
					on:click={() => { bringForward(); showZIndexSubmenu = false; }}
					disabled={!$isReady || !$selectedShape}
				>
					위로 보내기
				</button>
				<button
					class="submenu-item"
					role="menuitem"
					on:click={() => { bringToFront(); showZIndexSubmenu = false; }}
					disabled={!$isReady || !$selectedShape}
				>
					맨 위로 보내기
				</button>
				<button
					class="submenu-item"
					role="menuitem"
					on:click={() => { sendBackward(); showZIndexSubmenu = false; }}
					disabled={!$isReady || !$selectedShape}
				>
					아래로 보내기
				</button>
				<button
					class="submenu-item"
					role="menuitem"
					on:click={() => { sendToBack(); showZIndexSubmenu = false; }}
					disabled={!$isReady || !$selectedShape}
					aria-disabled={!$isReady || !$selectedShape}
				>
					맨 아래로 보내기
				</button>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if showContextMenu}
	<div
		class="context-menu"
		style="top: {contextMenuY}px; left: {contextMenuX}px;"
		transition:slide={{ duration: 200 }}
	>
		<button class="context-menu-item" on:click={() => { bringForward(); showContextMenu = false; }}>
			위로 보내기
		</button>
		<button class="context-menu-item" on:click={() => { bringToFront(); showContextMenu = false; }}>
			맨 위로 보내기
		</button>
		<button class="context-menu-item" on:click={() => { sendBackward(); showContextMenu = false; }}>
			아래로 보내기
		</button>
		<button class="context-menu-item" on:click={() => { sendToBack(); showContextMenu = false; }}>
			맨 아래로 보내기
		</button>
		<button class="context-menu-item" on:click={() => { copy(); showContextMenu = false; }}>
			복사
		</button>
		<button class="context-menu-item" on:click={() => { paste(); showContextMenu = false; }}>
			붙여넣기
		</button>
		<button class="context-menu-item" on:click={() => { cut(); showContextMenu = false; }}>
			잘라내기
		</button>
		<button class="context-menu-item" on:click={() => { del(); showContextMenu = false; }}>
			삭제
		</button>
	</div>
{/if}

<style lang="scss">
	@use "$lib/style/main.scss" as *;

	.toolbar-aria {
		left: 70px;
		position: fixed;
		justify-content: center;
		align-items: center;
		display: flex;
		bottom: 0;
		width: calc(100vw - 370px);
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
		&:disabled {
			background: $colorMedium;
			color: $colorWhite;
			cursor: not-allowed;
			opacity: 0.6;
		}
		&:hover {
			background: $colorSymbolGreen;
			color: $color-text-inverse;
		}
	}

	.z-index-button {
		position: relative;
		&[aria-disabled="true"] { // :disabled 대신 [aria-disabled="true"] 사용
			background: $colorMedium;
			color: $colorWhite;
			cursor: not-allowed;
			opacity: 0.6;
		}
	}

	.z-index-submenu {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		background: $colorWhite;
		border-radius: 8px;
		box-shadow: $boxShadow;
		z-index: 1001;
		padding: 8px 0;
		min-width: 150px;
		display: flex;
		flex-direction: column;
	}

	.submenu-item {
		@include typography-small;
		width: 100%;
		padding: 8px 16px;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		color: $color-text-primary;

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

	.context-menu {
		position: absolute;
		background: $colorWhite;
		border-radius: 8px;
		box-shadow: $boxShadow;
		z-index: 1001;
		padding: 8px 0;
		min-width: 150px;
	}

	.context-menu-item {
		@include typography-small;
		width: 100%;
		padding: 8px 16px;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		color: $color-text-primary;

		&:hover {
			background: $colorSymbolGreen;
			color: $color-text-inverse;
		}
	}
</style>
