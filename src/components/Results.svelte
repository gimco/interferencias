<script lang="ts">
    import { gameState } from "../lib/game.svelte";
    import { RefreshCw, Play, ArrowLeft } from "lucide-svelte";
    import type { GameItem, Player } from "../lib/types";

    let players = $derived(gameState.players);
    let items = $derived(gameState.items);

    let selectedChain = $state<number | null>(null);

    function getChain(index: number) {
        return items
            .filter((i) => i.chain_index === index)
            .sort((a, b) => a.turn - b.turn);
    }

    function getAuthor(playerId: string | null) {
        if (!playerId) return "Sistema";
        return players.find((p) => p.id === playerId)?.name || "Desconocido";
    }

    function leaveGame() {
        gameState.leave();
    }
</script>

<div class="panel">
    <div class="header">
        <h2>Resultados Finales</h2>
        <button class="secondary" onclick={leaveGame}>Salir</button>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="panel-content mt-4">
        {#if selectedChain === null}
            <p class="subtitle">
                Selecciona la cadena de un jugador para ver el resultado:
            </p>
            <div class="chain-grid">
                {#each players as player, i}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <div class="chain-card" onclick={() => (selectedChain = i)}>
                        <h3>Cadena de {player.name}</h3>
                        <p class="meta">{getChain(i).length} pasos</p>
                    </div>
                {/each}
            </div>
        {:else}
            <button
                class="back-btn mb-4"
                onclick={() => (selectedChain = null)}
            >
                <ArrowLeft size={20} /> Volver a las cadenas
            </button>

            <div class="timeline">
                {#each getChain(selectedChain) as item}
                    <div class="timeline-item">
                        <div class="author-badge">
                            Por: {getAuthor(item.player_id)}
                        </div>
                        <div class="content-box">
                            {#if item.type === "word"}
                                <p class="final-word">"{item.content}"</p>
                            {:else if item.type === "drawing"}
                                <img
                                    src={item.content}
                                    alt="Dibujo final"
                                    class="final-drawing"
                                />
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--surface-hover);
        padding-bottom: 1rem;
    }
    .mt-4 {
        margin-top: 1.5rem;
    }
    .mb-4 {
        margin-bottom: 1.5rem;
    }
    .back-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: transparent;
        color: var(--primary);
        padding: 0.5rem 0;
        cursor: pointer;
    }
    .back-btn:hover {
        background: transparent;
        color: var(--primary-hover);
        text-decoration: underline;
    }

    .chain-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    .chain-card {
        background: var(--surface-hover);
        padding: 1.5rem;
        border-radius: 12px;
        cursor: pointer;
        transition:
            transform 0.2s,
            background 0.2s;
        text-align: center;
        border: 2px solid transparent;
    }
    .chain-card:hover {
        transform: translateY(-4px);
        background: rgba(79, 70, 229, 0.1);
        border-color: var(--primary);
    }
    .chain-card .meta {
        color: var(--text-muted);
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }

    .timeline {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding-left: 1rem;
        border-left: 2px solid var(--surface-hover);
    }

    .timeline-item {
        position: relative;
        padding-left: 2rem;
    }

    .timeline-item::before {
        content: "";
        position: absolute;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--primary);
        left: -9px;
        top: 0;
    }

    .author-badge {
        display: inline-block;
        font-size: 0.875rem;
        color: var(--text-muted);
        background: var(--surface-hover);
        padding: 0.25rem 0.75rem;
        border-radius: 99px;
        margin-bottom: 0.5rem;
    }

    .content-box {
        background: rgba(0, 0, 0, 0.2);
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
    }

    .final-word {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--secondary);
    }

    .final-drawing {
        max-width: 100%;
        max-height: 400px;
        border-radius: 8px;
        background: white; /* drawings must be over white */
    }
</style>
