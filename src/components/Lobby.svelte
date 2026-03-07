<script lang="ts">
    import { gameState } from "../lib/game.svelte";
    import { RefreshCw, ArrowUp, ArrowDown, Play } from "lucide-svelte";

    let players = $derived(
        [...gameState.players].sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
        ),
    );
    let me = $derived(gameState.me);
    let is_admin = $derived(me?.is_admin);

    function moveUp(index: number) {
        if (index === 0) return;
        const newPlayers = [...players];
        const temp = newPlayers[index];
        newPlayers[index] = newPlayers[index - 1];
        newPlayers[index - 1] = temp;
        gameState.updatePlayersOrder(newPlayers);
    }

    function moveDown(index: number) {
        if (index === players.length - 1) return;
        const newPlayers = [...players];
        const temp = newPlayers[index];
        newPlayers[index] = newPlayers[index + 1];
        newPlayers[index + 1] = temp;
        gameState.updatePlayersOrder(newPlayers);
    }

    function handleStart() {
        if (players.length < 2) {
            alert("Se necesitan al menos 2 jugadores.");
            return;
        }
        gameState.startGame();
    }
</script>

<div class="panel">
    <div class="header">
        <div>
            <h2>Sala de Espera</h2>
            <p class="subtitle">Código de Partida:</p>
            <div class="code-box">
                <code>{gameState.game?.id}</code>
            </div>
        </div>
        {#if is_admin}
            <button class="primary start-btn" onclick={handleStart}>
                <Play size={20} /> Empezar
            </button>
        {/if}
    </div>

    <div class="panel-content mt-2">
        <h3>Jugadores ({players.length})</h3>
        <ul class="player-list">
            {#each players as player, i (player.id)}
                <li class="player-item" class:is-me={player.id === me?.id}>
                    <span>
                        <span class="player-num">{i + 1}.</span>
                        {player.name}
                    </span>
                    {#if is_admin}
                        <div class="controls">
                            <button
                                class="icon-btn"
                                disabled={i === 0}
                                onclick={() => moveUp(i)}
                            >
                                <ArrowUp size={16} />
                            </button>
                            <button
                                class="icon-btn"
                                disabled={i === players.length - 1}
                                onclick={() => moveDown(i)}
                            >
                                <ArrowDown size={16} />
                            </button>
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>
    </div>
</div>

<style>
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--surface-hover);
        padding-bottom: 1rem;
        margin-bottom: 1rem;
    }
    .code-box {
        background: rgba(0, 0, 0, 0.3);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-family: monospace;
        font-size: 1.25rem;
        color: var(--secondary);
        user-select: all;
    }
    .start-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.25rem;
        padding: 1rem 2rem;
    }
    .mt-2 {
        margin-top: 1rem;
    }

    .player-item.is-me {
        background: rgba(16, 185, 129, 0.2); /* var(--secondary) with opacity */
        border-right: 4px solid var(--secondary);
    }

    .player-num {
        color: var(--text-muted);
        margin-right: 0.5rem;
        font-family: monospace;
    }

    .icon-btn {
        background: transparent;
        padding: 0.25rem;
        cursor: pointer;
    }
    .icon-btn:hover:not(:disabled) {
        background: var(--surface-hover);
        color: var(--primary);
    }
    .controls {
        display: flex;
        gap: 0.25rem;
    }
</style>
