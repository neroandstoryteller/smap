<script lang="ts">
  import { canvasState, selectedShape, addShape, updateShape } from '$lib/store/canvasStore';
  import type { Shape } from '$lib/store/canvasStore'; // Shape 타입 import (아래 canvasStore.ts 참조)

  let color = '#000000';
  let size = 100; // 예: width/height나 fontSize
  let textContent = 'New Text';

  $: if ($selectedShape) {
    color = $selectedShape.fill || '#000000';
    if ($selectedShape.type === 'text') {
      size = $selectedShape.fontSize || 20;
      textContent = $selectedShape.text || 'Text';
    } else {
      size = $selectedShape.width || 100;
    }
  }

  function handleAddShape(type: 'rect' | 'circle') {
    addShape({ type, x: 100, y: 100, width: size, height: size, fill: color, draggable: true });
  }

  function handleAddText() {
    addShape({ type: 'text', x: 100, y: 100, text: textContent, fontSize: size, fill: color, draggable: true });
  }

  function handleUpdate() {
    if ($selectedShape) {
      const updates = { fill: color };
      if ($selectedShape.type === 'text') {
        updates.text = textContent;
        updates.fontSize = size;
      } else {
        updates.width = size;
        updates.height = size; // 원형은 radius로 조정 필요, 아래 참고
      }
      updateShape($selectedShape.id, updates);
    }
  }
</script>

<div class="sidebar">
  <section>
    <h2>Shapes</h2>
    <button on:click={() => handleAddShape('rect')}>Add Rectangle</button>
    <button on:click={() => handleAddShape('circle')}>Add Circle</button>
  </section>

  <section>
    <h2>Text</h2>
    <input type="text" bind:value={textContent} placeholder="Text content" />
    <button on:click={handleAddText}>Add Text</button>
  </section>

  <section>
    <h2>Properties</h2>
    {#if $selectedShape}
      <label>Color: <input type="color" bind:value={color} on:change={handleUpdate} /></label>
      <label>Size: <input type="number" bind:value={size} on:change={handleUpdate} /></label>
    {:else}
      <p>Select a shape to edit</p>
    {/if}
  </section>
</div>

<style>
  .sidebar { position: fixed; right: 0; top: 0; width: 200px; height: 100%; background: #f0f0f0; padding: 10px; }
  section { margin-bottom: 20px; }
</style>