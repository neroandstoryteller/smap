<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Stage, Layer, Transformer } from 'svelte-konva';
  import Rect from '$lib/component/canvas/shapes/rect.svelte';
  import Circle from '$lib/component/canvas/shapes/circle.svelte';
  import TextShape from '$lib/component/canvas/shapes/text.svelte'; // Text.svelte 추가 (아래 코드)
  import { canvasState, selectedShape, selectShape, undo, redo } from '$lib/store/canvasStore';
  import { snapPosition } from '$lib/component/canvas/konvaUtils'; // snap 함수 import

  let transformer;
  let stageConfig = { width: 800, height: 600 };

  // Transformer 바인딩
  function handleSelect(id: string) {
    selectShape(id);
  }

  // 드래그 중 스냅 적용 (dragBoundFunc 대신 dragend에서 스냅)
  function handleDragEnd(shapeId: string, e) {
    const shape = $canvasState.shapes.find(s => s.id === shapeId);
    if (shape) {
      const snapped = snapPosition(shape, $canvasState.shapes);
      updateShape(shapeId, snapped);
    }
  }

  // 키보드 이벤트 for undo/redo
  function handleKeyDown(e) {
    if (e.ctrlKey) {
      if (e.key === 'z') undo();
      if (e.key === 'y') redo();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  $: if (transformer && $selectedShape) {
    transformer.nodes([$selectedShape.handle]); // Konva 노드 연결 (handle from bind:handle)
  }
</script>

<Stage config={stageConfig}>
  <Layer>
    {#each $canvasState.shapes as shape (shape.id)}
      {#if shape.type === 'rect'}
        <Rect
          config={shape}
          bind:handle={shape.handle}
          on:pointerclick={() => handleSelect(shape.id)}
          on:dragend={(e) => handleDragEnd(shape.id, e)}
        />
      {:else if shape.type === 'circle'}
        <Circle
          config={shape}
          bind:handle={shape.handle}
          on:pointerclick={() => handleSelect(shape.id)}
          on:dragend={(e) => handleDragEnd(shape.id, e)}
        />
      {:else if shape.type === 'text'}
        <TextShape
          config={shape}
          bind:handle={shape.handle}
          on:pointerclick={() => handleSelect(shape.id)}
          on:dragend={(e) => handleDragEnd(shape.id, e)}
        />
      {/if}
    {/each}
    <Transformer bind:handle={transformer} />
  </Layer>
</Stage>