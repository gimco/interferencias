<script lang="ts">
  import { onMount } from "svelte";
  import { Maximize2 } from "lucide-svelte";
  import { gameState } from "./lib/game.svelte";
  import Welcome from "./components/Welcome.svelte";
  import Lobby from "./components/Lobby.svelte";
  import GameUI from "./components/GameUI.svelte";
  import Results from "./components/Results.svelte";
  import RandomWord from "./components/RandomWord.svelte";

  let isWordRoute = $state(false);
  let isFullscreen = $state(false);

  function enterFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
  }

  onMount(() => {
    isWordRoute = window.location.pathname === "/palabra";

    // Track fullscreen state
    const onFsChange = () => {
      isFullscreen = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);

    // Request fullscreen on first user interaction
    const onFirstTouch = () => {
      enterFullscreen();
      document.removeEventListener("touchstart", onFirstTouch);
      document.removeEventListener("click", onFirstTouch);
    };
    document.addEventListener("touchstart", onFirstTouch, { once: true });
    document.addEventListener("click", onFirstTouch, { once: true });

    if (isWordRoute) return;

    // Try to reconnect
    const params = new URLSearchParams(window.location.search);
    const reconnectGameId = params.get("reconnect");
    const reconnectPlayerId = params.get("p");

    if (reconnectGameId && reconnectPlayerId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      gameState.resumeSession(reconnectGameId, reconnectPlayerId);
      return;
    }

    const gameId = localStorage.getItem("interferencias_game_id");
    const playerId = localStorage.getItem("interferencias_player_id");
    if (gameId && playerId) {
      gameState.resumeSession(gameId, playerId);
    }

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  });
</script>

<main class="app-container">
  {#if isWordRoute}
    <RandomWord />
  {:else if gameState.isLoading}
    <div
      class="panel center-content"
      style="align-items: center; justify-content: center"
    >
      <h2>Cargando...</h2>
    </div>
  {:else if !gameState.game}
    <Welcome />
  {:else if gameState.game.status === "waiting"}
    <Lobby />
  {:else if gameState.game.status === "playing"}
    <GameUI />
  {:else if gameState.game.status === "finished"}
    <Results />
  {/if}
</main>

{#if !isFullscreen}
  <button
    class="fullscreen-btn"
    onclick={enterFullscreen}
    title="Pantalla completa"
    aria-label="Pantalla completa"
  >
    <Maximize2 size={18} />
  </button>
{/if}

<style>
  .center-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .fullscreen-btn {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 9999;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    padding: 0;
    transition: all 0.2s;
    opacity: 0.5;
  }

  .fullscreen-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.2);
    color: var(--text-main);
  }
</style>
