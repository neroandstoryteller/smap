<script lang="ts">
    import SearchComponent from "$lib/component/searchComponent.svelte";
</script>

<div class="top-bar">선택된 학교가 없습니다.</div>
<SearchComponent/>

<style lang="scss">
    @use '$lib/style/main.scss' as *;
    .top-bar{
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 45px;
        display: flex;
        @include typography-heading;
    }
</style>



