<script lang="ts">
    import { gameState } from "../lib/game.svelte";
    import { Play, ArrowLeft, ArrowRight, X } from "lucide-svelte";
    import type { GameItem, Player } from "../lib/types";

    let players = $derived(gameState.players);
    let items = $derived(gameState.items);
    let game = $derived(gameState.game);
    let me = $derived(gameState.me);

    let is_admin = $derived(me?.is_admin);
    let presentationChain = $derived(game?.presentation_chain_index ?? null);
    let presentationStep = $derived(game?.presentation_step_index ?? null);

    let activeChainItems = $derived(
        presentationChain !== null
            ? items
                  .filter((i) => i.chain_index === presentationChain)
                  .sort((a, b) => a.turn - b.turn)
            : [],
    );

    let currentItem = $derived(
        presentationStep !== null && activeChainItems.length > presentationStep
            ? activeChainItems[presentationStep]
            : null,
    );

    function getAuthor(playerId: string | null) {
        if (!playerId) return "Sistema";
        return players.find((p) => p.id === playerId)?.name || "Desconocido";
    }

    function leaveGame() {
        gameState.leave();
    }

    function startPresentation(chainIndex: number) {
        if (!is_admin) return;
        gameState.setPresentation(chainIndex, 0);
    }

    function stopPresentation() {
        if (!is_admin) return;
        gameState.setPresentation(null, null);
    }

    function nextStep() {
        if (!is_admin || presentationStep === null) return;
        if (presentationStep < activeChainItems.length - 1) {
            gameState.setPresentation(presentationChain, presentationStep + 1);
        }
    }

    function prevStep() {
        if (!is_admin || presentationStep === null) return;
        if (presentationStep > 0) {
            gameState.setPresentation(presentationChain, presentationStep - 1);
        }
    }
</script>

{#if presentationChain !== null && currentItem !== null}
    <div class="presentation-mode">
        <div class="present-header">
            <h3>
                Cadena de {players[presentationChain]?.name} - Paso {presentationStep! +
                    1}/{activeChainItems.length}
            </h3>
            {#if is_admin}
                <button
                    class="icon-btn close-btn"
                    onclick={stopPresentation}
                    title="Cerrar presentación"
                >
                    <X size={24} />
                </button>
            {/if}
        </div>

        <div class="present-content">
            <div class="author-badge">
                Por: {getAuthor(currentItem.player_id)}
            </div>

            {#if currentItem.type === "word"}
                <div class="word-card">
                    "{currentItem.content}"
                </div>
            {:else}
                <img
                    src={currentItem.content!}
                    alt="Dibujo"
                    class="fullscreen-img"
                />
            {/if}
        </div>

        {#if is_admin}
            <div class="present-controls">
                <button
                    class="secondary action-btn"
                    onclick={prevStep}
                    disabled={presentationStep === 0}
                >
                    <ArrowLeft size={20} /> Anterior
                </button>
                <button
                    class="primary action-btn"
                    onclick={nextStep}
                    disabled={presentationStep === activeChainItems.length - 1}
                >
                    Siguiente <ArrowRight size={20} />
                </button>
            </div>
        {/if}
    </div>
{:else}
    <div class="panel">
        <div class="header">
            <h2>Resultados Finales</h2>
            <button class="secondary" onclick={leaveGame}>Salir</button>
        </div>

        <div class="panel-content mt-4">
            {#if is_admin}
                <p class="subtitle">
                    Selecciona una cadena para mostrarla a todos los jugadores:
                </p>
                <div class="chain-grid">
                    {#each players as player, i}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="chain-card"
                            onclick={() => startPresentation(i)}
                        >
                            <h3>Cadena de {player.name}</h3>
                            <p class="meta">
                                {items.filter((item) => item.chain_index === i)
                                    .length} pasos
                            </p>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="waiting-box">
                    <h3>Esperando al moderador...</h3>
                    <p class="text-muted">
                        El administrador seleccionará qué resultados mostrar en
                        tu pantalla.
                    </p>
                </div>
            {/if}
        </div>
    </div>
{/if}

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
    .meta {
        color: var(--text-muted);
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }

    .waiting-box {
        text-align: center;
        padding: 4rem 1rem;
        background: var(--surface-hover);
        border-radius: 12px;
    }
    .text-muted {
        color: var(--text-muted);
        margin-top: 0.5rem;
    }

    /* Presentation Mode Styles */
    .presentation-mode {
        display: flex;
        flex-direction: column;
        flex: 1;
        width: 100%;
        height: 100%;
        background: var(--bg-color);
    }

    .present-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--surface);
        border-radius: 12px;
        margin-bottom: 1rem;
    }

    .icon-btn.close-btn {
        background: rgba(244, 63, 94, 0.1);
        color: var(--accent);
        border: none;
        padding: 0.5rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .present-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--surface);
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        padding: 2rem;
    }

    .author-badge {
        position: absolute;
        top: 1rem;
        left: 1rem;
        font-size: 1rem;
        color: white;
        background: var(--primary);
        padding: 0.5rem 1rem;
        border-radius: 99px;
        z-index: 10;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    .word-card {
        font-size: 3rem;
        font-weight: 800;
        color: var(--secondary);
        text-align: center;
        word-wrap: break-word;
        max-width: 90%;
    }

    .fullscreen-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        background: white; /* Ensure drawing background is white */
        border-radius: 8px;
    }

    .present-controls {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }

    .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        font-size: 1.25rem;
    }

    /* Override landscape constraints to prioritize full sizing */
    @media (orientation: landscape) {
        .presentation-mode {
            padding: 0;
            margin: 0;
        }
        .present-content {
            padding: 1rem;
        }
    }
</style>
