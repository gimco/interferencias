<script lang="ts">
  import { onMount } from "svelte";
  import { gameState } from "./lib/game.svelte";
  import Welcome from "./components/Welcome.svelte";
  import Lobby from "./components/Lobby.svelte";
  import GameUI from "./components/GameUI.svelte";
  import Results from "./components/Results.svelte";
  import RandomWord from "./components/RandomWord.svelte";

  let isWordRoute = $state(false);

  onMount(() => {
    isWordRoute = window.location.pathname === "/palabra";
    if (isWordRoute) return;

    // Try to reconnect
    // Check for explicit reconnection link
    const params = new URLSearchParams(window.location.search);
    const reconnectGameId = params.get("reconnect");
    const reconnectPlayerId = params.get("p");

    if (reconnectGameId && reconnectPlayerId) {
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      gameState.resumeSession(reconnectGameId, reconnectPlayerId);
      return;
    }

    // Try to reconnect from local storage
    const gameId = localStorage.getItem("interferencias_game_id");
    const playerId = localStorage.getItem("interferencias_player_id");
    if (gameId && playerId) {
      gameState.resumeSession(gameId, playerId);
    }
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

<style>
  .center-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
