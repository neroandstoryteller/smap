<script lang="ts">
  import { Text } from 'svelte-konva';
  export let config;
  export let handle; // bind:handle for Transformer
</script>

<Text bind:config bind:handle={handle} />