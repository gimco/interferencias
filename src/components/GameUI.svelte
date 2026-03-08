<script lang="ts">
    import { gameState } from "../lib/game.svelte";
    import CameraCapture from "./CameraCapture.svelte";
    import { CheckCircle, Play, RefreshCw, XCircle, X } from "lucide-svelte";
    import type { GameItem } from "../lib/types";

    let changeWordCount = $state(0);
    let showZoom = $state(false);

    let me = $derived(gameState.me);
    let game = $derived(gameState.game);
    let items = $derived(gameState.items);
    let players = $derived(gameState.players);

    let myCurrentItem: GameItem | undefined = $derived(
        items.find(
            (i) => i.turn === game?.current_turn && i.player_id === me?.id,
        ),
    );

    let previousItem: GameItem | undefined = $derived(
        myCurrentItem
            ? items.find(
                  (i) =>
                      i.chain_index === myCurrentItem!.chain_index &&
                      i.turn === game!.current_turn - 1,
              )
            : undefined,
    );

    let completedCount = $derived(
        items.filter((i) => i.turn === game?.current_turn && i.completed)
            .length,
    );

    let isAllCompleted = $derived(completedCount === players.length);

    let inputValue = $state("");

    function submitWord() {
        if (!inputValue.trim() || !myCurrentItem) return;
        gameState.submitTurn(myCurrentItem.id, inputValue);
    }

    function submitDrawing(dataUrl: string) {
        if (!myCurrentItem) return;
        gameState.submitTurn(myCurrentItem.id, dataUrl);
    }

    function cancelGame() {
        if (
            confirm(
                "¿Estás seguro de que deseas cancelar la partida entera para todos los jugadores?",
            )
        ) {
            gameState.cancelGame();
        }
    }
</script>

<div class="game-container">
    {#if me?.is_admin}
        <button
            class="icon-btn danger cancel-absolute"
            onclick={cancelGame}
            title="Cancelar partida"
        >
            <XCircle size={24} />
        </button>
    {/if}

    {#if !myCurrentItem}
        <div class="panel center">
            <h2>Buscando tu turno...</h2>
        </div>
    {:else if myCurrentItem.completed}
        <div class="panel center waiting-panel">
            <h2>¡Tarea completada!</h2>
            <div class="progress-info">
                <CheckCircle size={48} color="var(--secondary)" />
                <p>Esperando a los demás...</p>
                <div class="counter">
                    <strong>{completedCount}</strong> / {players.length} terminados
                </div>
            </div>

            {#if me?.is_admin}
                <div class="admin-controls mt-4">
                    <button
                        class="primary"
                        disabled={!isAllCompleted}
                        onclick={() => gameState.nextTurn()}
                    >
                        <Play size={20} class="inline-icon" />
                        {#if isAllCompleted}Siguiente Turno{:else}Forzar
                            Siguiente Turno{/if}
                    </button>
                    {#if !isAllCompleted}
                        <p class="hint">Aún no han terminado todos</p>
                    {/if}
                </div>
            {/if}
        </div>
    {:else}
        <div class="panel task-panel">
            <div class="context">
                <div class="context-header">
                    <img src="/logo.png" alt="Logo" class="small-logo" />
                    <span class="badge">Turno {game?.current_turn}</span>
                </div>
                {#if previousItem?.type === "word"}
                    <div class="prompt-text">
                        <p class="text-muted" style="margin-bottom: 0.5rem;">
                            Dibuja esto:
                        </p>
                        <p class="word-to-draw">"{previousItem.content}"</p>
                        {#if game?.current_turn === 1 && changeWordCount < 2}
                            <button
                                class="secondary mt-2"
                                onclick={() => {
                                    changeWordCount++;
                                    gameState.changeInitialWord(
                                        previousItem!.id,
                                    );
                                }}
                            >
                                <RefreshCw size={16} class="inline-icon" /> Cambiar
                                palabra ({2 - changeWordCount} restantes)
                            </button>
                        {/if}
                    </div>
                {:else if previousItem?.type === "drawing"}
                    <div class="prompt-image">
                        <h3>¿Qué ves aquí?</h3>
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                        <img
                            src={previousItem.content}
                            alt="Dibujo previo"
                            class="prev-drawing zoomable"
                            onclick={() => (showZoom = true)}
                        />
                    </div>
                {/if}
            </div>

            {#if showZoom && previousItem?.content}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="zoom-overlay" onclick={() => (showZoom = false)}>
                    <img src={previousItem.content} alt="Dibujo ampliado" />
                    <button class="close-zoom"><X size={32} /></button>
                </div>
            {/if}

            <div class="action-area">
                {#if myCurrentItem.type === "drawing"}
                    <CameraCapture onSubmit={submitDrawing} />
                {:else}
                    <div class="writing-task">
                        <input
                            type="text"
                            bind:value={inputValue}
                            placeholder="Escribe lo que representa el dibujo..."
                            class="huge-input"
                        />
                        <button
                            class="primary send-btn"
                            onclick={submitWord}
                            disabled={!inputValue.trim()}
                        >
                            <CheckCircle size={24} /> Terminar
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .game-container {
        display: flex;
        flex: 1;
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
    }
    .cancel-absolute {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        z-index: 50;
        background: rgba(244, 63, 94, 0.1);
        color: var(--accent);
        border: none;
        padding: 0.5rem;
        border-radius: 8px;
        cursor: pointer;
    }
    .cancel-absolute:hover {
        background: rgba(244, 63, 94, 0.2);
    }
    .center {
        justify-content: center;
        align-items: center;
        text-align: center;
    }
    .waiting-panel {
        gap: 2rem;
    }
    .progress-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }
    .counter {
        font-size: 1.5rem;
        background: rgba(0, 0, 0, 0.3);
        padding: 0.5rem 1.5rem;
        border-radius: 99px;
    }
    :global(.inline-icon) {
        margin-right: 0.5rem;
        vertical-align: middle;
    }
    .task-panel {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
    }
    /* Landscape specific alignment */
    @media (orientation: landscape) {
        .task-panel {
            flex-direction: row;
            gap: 1.5rem;
        }
        .context {
            flex: 0 0 35%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-right: 1px solid var(--surface-hover);
            padding-right: 1rem;
            overflow-y: auto;
        }
        .action-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
        }
    }

    .context-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }
    .small-logo {
        width: 32px;
        height: 32px;
        object-fit: contain;
    }
    .badge {
        display: inline-block;
        background: var(--primary);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 99px;
        font-size: 0.875rem;
        font-weight: bold;
        margin-bottom: 0;
    }
    .prompt-text,
    .prompt-image {
        text-align: center;
        margin-bottom: 1rem;
    }
    .word-to-draw {
        font-size: 2rem;
        font-weight: 800;
        color: var(--secondary);
    }
    .prev-drawing {
        max-width: 100%;
        max-height: 40vh;
        border-radius: 8px;
        background: white;
        object-fit: contain;
    }
    .zoomable {
        cursor: zoom-in;
    }
    .zoom-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        cursor: zoom-out;
    }
    .zoom-overlay img {
        max-width: 95vw;
        max-height: 95vh;
        object-fit: contain;
        background: white;
        border-radius: 8px;
    }
    .close-zoom {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: transparent;
        color: white;
        border: none;
        cursor: pointer;
    }
    .writing-task {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
        justify-content: center;
    }
    .huge-input {
        font-size: 1.5rem;
        padding: 1.5rem;
        text-align: center;
    }
    .send-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 1.25rem;
        padding: 1rem;
    }
    .mt-4 {
        margin-top: 2rem;
    }
    .hint {
        color: var(--text-muted);
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }
</style>
