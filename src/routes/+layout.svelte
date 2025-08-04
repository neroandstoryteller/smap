<script lang="ts">
    import { goto } from "$app/navigation";
    import { fade } from "svelte/transition";
    import { page } from "$app/state";
    import { initSchool, school } from "$lib/store/schoolDataStore";
    import { onMount } from "svelte";
	import { signInWithGoogle, signOut, user } from "$lib/database/firestore";

    let { children } = $props();
    
    let schoolName = $derived($school.schoolName)

    const path = $derived(page.url.pathname);

    let isSidebarOpen = $state(false);
    let isProfileMenuOpen = $state(false);

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }

    function toggleProfileMenu() {
        isProfileMenuOpen = !isProfileMenuOpen;
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
        <div>
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
                </ul>
            </nav>
        </div>

        <div class="user-section">
            {#if $user === undefined}
                <!-- Loading -->
            {:else if $user}
                <div class="profile-container">
                    <button class="profile" onclick={toggleProfileMenu}>
                        <img src={$user.photoURL} alt="profile" />
                        {#if isSidebarOpen}
                        <span class="description" transition:fade>{$user.displayName}</span>
                        {/if}
                    </button>

                    {#if isProfileMenuOpen}
                        <div class="profile-menu" transition:fade>
                            <a href={'#'} onclick={(e) => { e.preventDefault(); signOut(); isProfileMenuOpen = false; }} class="li">
                                <span class="material-symbols-outlined">logout</span>
                                <span class="description">로그아웃</span>
                            </a>
                        </div>
                    {/if}
                </div>
            {:else}
                <a href={'#'} onclick={(e) => { e.preventDefault(); signInWithGoogle(); }} class="li">
                    <span class="material-symbols-outlined">login</span>
                    {#if isSidebarOpen}
                        <span class="description" transition:fade>로그인</span>
                    {/if}
                </a>
            {/if}
        </div>
    </aside>
    
    {#if isSidebarOpen}
        <div class="overlay" onclick={toggleSidebar} transition:fade></div>
    {/if}

    <div class="content" class:sidebar-open={isSidebarOpen}>
        <main>
            {@render children()}
        </main>
    </div>
</div>

<style lang="scss">
    @use '$lib/style/main.scss' as *;

    .profile-container {
        position: relative;
    }

    .profile-menu {
        position: absolute;
        bottom: 100%;
        left: 0;
        width: 100%;
        background-color: $colorWhite;
        border-radius: $borderRadius;
        box-shadow: $boxShadow;
        padding: 5px;
        margin-bottom: 10px;
        z-index: 1100;

        .li {
            width: 100%;
            box-sizing: border-box;
        }
    }

    .profile {
        display: flex;
        align-items: center;
        padding: 10px;
        background: none;
        border: none;
        cursor: pointer;
        width: 100%;
        color: $color-text-primary;
        font-size: 20px;

        &:hover {
            background-color: $colorBright;
        }

        img {
            width: 30px;
            height: 30px;
            border-radius: 50%;
        }
    }

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
        width: 70px;
        background-color: $colorWhite;
        padding: 10px;
        box-sizing: border-box;
        box-shadow: $boxShadow;
        transition: $transition;
        overflow: visible; // Allow menu to pop out
        position: fixed;
        height: 100%;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

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
        border-radius: $borderRadius;

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
        transition: opacity 0.2s ease; // Faster opacity transition
    }

    // Sidebar closed state for description
    aside:not(.open) .description {
        opacity: 0;
    }

    // Sidebar open state for description
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
