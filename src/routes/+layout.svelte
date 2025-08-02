<script lang="ts">
    import { goto } from "$app/navigation";
    import { fade } from "svelte/transition";
    import { page } from "$app/state";
    import { initSchool, school } from "$lib/store/schoolDataStore";
    import { onMount } from "svelte";

    let { children } = $props();
    
    let schoolName = $derived($school.schoolName)

    const path = $derived(page.url.pathname);

    let isSidebarOpen = $state(false);

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }

    const gotoLink = $state({
        main: "/",
        map: "/map",
        search: "/search",
        login: "/login",
        signup: "/signup",
    })

    onMount(() => {
        initSchool()
    });
</script>

<div class="layout">
    <aside class:open={isSidebarOpen}>
        <button class="logo" type="button" onclick={toggleSidebar}>
            <img src="/icon/smap_icon.svg" alt="icon">
            <p>SMAP</p>
        </button>
        <nav>
            <hr>
            <ul>
                <a class:activated={gotoLink.main === path} href="{gotoLink.main}" class="li">
                    <span class="material-symbols-outlined">home</span>
                    {#if isSidebarOpen}
                        <span class="description" transition:fade>메인</span>
                    {/if}
                </a>
                <a class:activated={gotoLink.map === path} href="{gotoLink.map}/{schoolName}" class="li">
                    <span class="material-symbols-outlined">map</span>
                    {#if isSidebarOpen}
                        <span class="description" transition:fade>지도</span>
                    {/if}
                </a>
                <a class:activated={gotoLink.search === path} href="{gotoLink.search}" class="li">
                    <span class="material-symbols-outlined">search</span>
                    {#if isSidebarOpen}
                        <span class="description" transition:fade>검색</span>
                    {/if}
                </a>
                <a class:activated={gotoLink.login === path} href="{gotoLink.login}" class="li">
                    <span class="material-symbols-outlined">login</span>
                    {#if isSidebarOpen}
                        <span class="description" transition:fade>로그인</span>
                    {/if}
                </a>
                <a class:activated={gotoLink.signup === path} href="{gotoLink.signup}" class="li">
                    <span class="material-symbols-outlined">person_add</span>
                    {#if isSidebarOpen}
                        <span class="description" transition:fade>회원가입</span>
                    {/if}
                </a>
            </ul>
        </nav>
    </aside>
    
    {#if isSidebarOpen}
        <div class="overlay" transition:fade></div>
    {/if}

    <div class="content" class:sidebar-open={isSidebarOpen}>
        <main>
            {@render children()}
        </main>
    </div>
</div>

<style lang="scss">
    @use '$lib/style/main.scss' as *;

    .overlay{
        position: fixed;
        width: 100vw;
        height: 100vh;
        backdrop-filter: blur(1px);
        background-color: rgba(0, 0, 0, 0.144);
        z-index: 500;
    }

    .layout {
        display: flex;
        min-height: 100vh;
    }

    aside {
        width: 50px;
        background-color: $colorWhite;
        padding: 10px;
        box-shadow: $boxShadow;
        transition: $transition;
        overflow: hidden;
        position: fixed;
        height: 100%;
        z-index: 1000;
        display: flex;
        flex-direction: column;

        &.open {
            width: 300px;
        }
    }

    .logo {
        background-color: transparent;
        border: transparent;
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        cursor: pointer;

        p {
            transition: 0.3s ease;
            font-size: 30px;
            font-weight: bold;
            letter-spacing: -26px;
            margin: 0 0 4px 0;
            color: $colorBlack;
            opacity: 0;
        }

        img {
            width: 50px;
            height: 50px;
        }

        aside.open & p {
            letter-spacing: 3px;
            opacity: 1;
        }
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .li {
        display: flex;
        align-items: center;
        padding: 10px;
        cursor: pointer;
        transition: $transition;
        color: $color-text-primary;

        span{
            white-space:nowrap;
        }

        &:hover {
            background-color: $colorBright;
        }

        &.activated{
            color: $colorSymbolGreen;
            background-color: $colorBright;
        }
    }

    .material-symbols-outlined {
        font-size: 30px;
        transition: $transition;
    }

    .description {
        font-size: 20px;
        margin-left: 10px;
        opacity: 0;
        transition: $transition
    }

    aside.open .description {
        opacity: 1;
    }

    .content {
        flex: 1;
        margin-left: 70px;
        transition: $transition
    }

    main {
        display: flex;
        flex-flow: column;
        width: 100%;
        height: 100%;
    }
    a {
        text-decoration: none;
        color: inherit;
        margin: 0;
        padding: 0;
    }
</style>