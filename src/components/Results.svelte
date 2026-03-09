<script lang="ts">
    import { gameState } from "../lib/game.svelte";
    import {
        Play,
        ArrowLeft,
        ArrowRight,
        X,
        XCircle,
        LogOut,
        Download,
    } from "lucide-svelte";
    import html2canvas from "html2canvas";
    import type { GameItem, Player } from "../lib/types";

    let players = $derived(
        [...gameState.players].sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
        ),
    );
    let items = $derived(gameState.items);
    let game = $derived(gameState.game);
    let me = $derived(gameState.me);

    let is_admin = $derived(me?.is_admin);
    let presentationChain = $derived(game?.presentation_chain_index ?? null);
    let presentationStep = $derived(game?.presentation_step_index ?? null);
    let showZoom = $state(false);
    let isGeneratingCollage = $state(false);
    let collageRef = $state<HTMLElement>();

    async function downloadCollage() {
        if (!collageRef || isGeneratingCollage || !game) return;
        isGeneratingCollage = true;
        try {
            const canvas = await html2canvas(collageRef, {
                backgroundColor: "#ffffff", // white background
                scale: 1.5, // slightly upscale for better quality but without breaking memory limits
                logging: false,
                useCORS: true,
                onclone: (doc, element) => {
                    // Make it visible in the cloned doc tree to render properly
                    element.style.opacity = "1";
                    element.style.left = "0";
                    element.style.top = "0";
                },
            });
            const dataUrl = canvas.toDataURL("image/png", 0.9);
            const link = document.createElement("a");
            link.download = `interferencias-${game.code}.png`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error("Error generating collage:", e);
            alert("Hubo un error al generar el collage.");
        } finally {
            isGeneratingCollage = false;
        }
    }

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
        if (confirm("¿Estás seguro de que deseas salir de la sala?")) {
            gameState.leave();
        }
    }

    function handleCancel() {
        if (
            confirm(
                "¿Estás seguro de que deseas finalizar la partida entera para todos los jugadores?",
            )
        ) {
            gameState.cancelGame();
        }
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
                Cadena de {players.find(
                    (p) => p.order_index === presentationChain,
                )?.name} - Paso {presentationStep! +
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
            {:else}
                <button
                    class="icon-btn close-btn"
                    onclick={leaveGame}
                    title="Salir de la partida"
                >
                    <LogOut size={24} />
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
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <img
                    src={currentItem.content!}
                    alt="Dibujo"
                    class="fullscreen-img zoomable"
                    onclick={() => (showZoom = true)}
                />
            {/if}
        </div>

        {#if showZoom && currentItem?.content}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="zoom-overlay" onclick={() => (showZoom = false)}>
                <img src={currentItem.content} alt="Dibujo ampliado" />
                <button class="close-zoom"><X size={32} /></button>
            </div>
        {/if}

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
            <div class="title-with-logo">
                <img src="/logo.png" alt="Logo" class="small-logo" />
                <h2>Resultados Finales</h2>
            </div>
        </div>

        <div class="panel-content mt-4">
            {#if is_admin}
                <p class="subtitle">
                    Selecciona una cadena para mostrarla a todos los jugadores:
                </p>
                <div class="chain-grid">
                    {#each players as player}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="chain-card"
                            onclick={() =>
                                startPresentation(player.order_index!)}
                        >
                            <h3>Cadena de {player.name}</h3>
                            <p class="meta">
                                {items.filter(
                                    (item) =>
                                        item.chain_index === player.order_index,
                                ).length} pasos
                            </p>
                        </div>
                    {/each}
                </div>
                <button
                    class="primary action-btn w-full mt-4"
                    onclick={downloadCollage}
                    disabled={isGeneratingCollage}
                >
                    <Download size={20} />
                    {#if isGeneratingCollage}
                        Generando Collage...
                    {:else}
                        Descargar Collage de la Partida
                    {/if}
                </button>
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

        <div class="footer-actions mt-4">
            {#if is_admin}
                <button class="danger action-btn w-full" onclick={handleCancel}>
                    <XCircle size={20} /> Finalizar Partida para todos
                </button>
            {:else}
                <button class="danger action-btn w-full" onclick={leaveGame}>
                    <LogOut size={20} /> Salir de la sala
                </button>
            {/if}
        </div>
    </div>
{/if}

<div class="collage-wrapper">
    <div bind:this={collageRef} class="collage-container">
        <div class="collage-header">
            <img src="/logo.png" alt="Logo" class="collage-logo" />
            <div>
                <h1>Interferencias</h1>
                <p>
                    Cadenas de la Partida #{game?.code} · {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>

        <div class="collage-chains">
            {#each players as player}
                {@const chainItems = items
                    .filter((item) => item.chain_index === player.order_index)
                    .sort((a, b) => a.turn - b.turn)}
                <div class="collage-row">
                    <h3>Cadena de {player.name}</h3>
                    <div class="collage-steps">
                        {#each chainItems as item, idx}
                            <div class="collage-step">
                                <div class="step-meta">
                                    <span class="step-num">{idx + 1}</span>
                                    <span>{getAuthor(item.player_id)}</span>
                                </div>
                                {#if item.type === "word"}
                                    <div class="step-word">
                                        "{item.content}"
                                    </div>
                                {:else}
                                    <img
                                        src={item.content!}
                                        alt="Dibujo"
                                        class="step-img"
                                    />
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
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
    .title-with-logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .small-logo {
        width: 40px;
        height: 40px;
        object-fit: contain;
    }
    .mt-4 {
        margin-top: 1.5rem;
    }
    .w-full {
        width: 100%;
    }
    .footer-actions {
        display: flex;
    }
    @media (min-width: 600px) {
        .footer-actions {
            justify-content: flex-end;
        }
        .footer-actions .w-full {
            width: auto;
            flex: initial;
            padding: 1rem 2rem;
        }
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
    .zoom-overlay .close-zoom {
        position: absolute;
        top: 2rem;
        right: 2rem;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
        z-index: 10000; /* Aseguramos que esté por encima de la imagen */
    }

    .zoom-overlay .close-zoom:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .collage-wrapper {
        position: fixed;
        top: -9999px;
        left: -9999px;
        pointer-events: none;
        opacity: 0;
    }
    .collage-container {
        padding: 40px;
        background: #ffffff;
        color: #1f2937;
        width: 1400px;
        font-family: inherit;
    }
    .collage-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 40px;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 20px;
    }
    .collage-logo {
        width: 80px;
        height: auto;
        object-fit: contain;
    }
    .collage-header h1 {
        margin: 0;
        color: #10b981;
        font-size: 2.5rem;
    }
    .collage-header p {
        margin: 5px 0 0;
        color: #6b7280;
    }
    .collage-chains {
        display: flex;
        flex-direction: column;
        gap: 40px;
    }
    .collage-row {
        background: #f9fafb;
        padding: 30px;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
    }
    .collage-row h3 {
        margin: 0 0 20px;
        color: #10b981;
        font-size: 1.5rem;
    }
    .collage-steps {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 20px;
        align-items: start;
    }
    .collage-step {
        background: #ffffff;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        border: 1px solid #d1d5db;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .step-meta {
        font-size: 0.875rem;
        color: #6b7280;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .step-num {
        background: #10b981;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    .step-word {
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
        margin: auto;
        color: #1f2937;
    }
    .step-img {
        width: 100%;
        height: auto;
        object-fit: contain;
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
