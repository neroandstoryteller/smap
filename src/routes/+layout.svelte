<script lang="ts">
    import { goto } from "$app/navigation";
    import { fade } from "svelte/transition";
    import { page } from "$app/state";
    import { initSchool, school } from "$lib/store/schoolDataStore";
    import { onMount } from "svelte";
	import { signInWithGoogle, signOut } from "$lib/database/firestore";
	import { user } from "$lib/store/user";

    import Chat from "./chat.svelte";

    let { children } = $props();
    
    let buildingName = $derived($school.buildingName)

    const path = $derived(page.url.pathname);

    let isSidebarOpen = $state(false);
    let isProfileMenuOpen = $state(false);

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }

    function toggleProfileMenu() {
        isProfileMenuOpen = !isProfileMenuOpen;
    }

    const gotoLink = $derived({
        main: "/",
        map: `/${buildingName}/map`,
        search: "/search",
        login: "/login",
        signup: "/signup",
    })

    onMount(() => {
        initSchool()
    });
</script>

<div class="layout">
    <aside class="menu-bar">
        <div>
            <a href="{gotoLink.main}" class="logo li" class:activated={gotoLink.main === path}>
                <img src="/icon/smap_icon.svg" alt="icon">
            </a>
            <nav>
                <hr>
                <ul>
                    <a class:activated={gotoLink.map === path} href="{schoolName}{gotoLink.map}" class="li">
                        <span class="material-symbols-outlined">map</span>
                    </a>
                    <a class:activated={gotoLink.search === path} href="{gotoLink.search}" class="li">
                        <span class="material-symbols-outlined">search</span>
                    </a>
                    <a href={'#'} onclick={(e) => { e.preventDefault(); toggleSidebar(); }} class="li">
                        <span class="material-symbols-outlined">smart_toy</span>
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
                </a>
            {/if}
        </div>
    </aside>

    {#if isSidebarOpen}
        <aside class="ai-sidebar" transition:fade>
            <Chat />
        </aside>
        <div class="overlay" onclick={toggleSidebar} transition:fade></div>
    {/if}

    <div class="content">
        <main>
            {@render children()}
        </main>
    </div>
</div>

<style lang="scss">
    @use '$lib/style/main.scss' as *;

    .layout {
        display: flex;
        min-height: 100vh;
    }

    .menu-bar {
        width: 70px; /* 고정 너비 */
        background-color: $colorWhite;
        padding: 10px;
        box-sizing: border-box;
        box-shadow: $boxShadow;
        position: fixed;
        height: 100%;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: $transition;
    }

    .ai-sidebar {
        width: 300px;
        background-color: $colorWhite;
        box-shadow: $boxShadow;
        position: fixed;
        height: 100%;
        left: 70px; /* 메뉴바 너비만큼 옆에 위치 */
        z-index: 1100;
        transition: $transition;
    }

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
        z-index: 1200;

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

    .logo {
        background-color: transparent;
        border: transparent;
        margin: 0;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        img {
            width: 50px;
            height: 50px;
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
        justify-content: center;
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
       display: none;
    }

    .content {
        flex: 1;
        margin-left: 70px; /* 메뉴바 너비만큼 마진 */
        transition: $transition
    }

    main {
        display: flex;
        flex-flow: column;
        overflow: auto;
        align-items: center;
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
