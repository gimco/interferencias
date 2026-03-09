<script lang="ts">
    import { gameState } from "../lib/game.svelte";
    import QRCode from "qrcode";
    import {
        RefreshCw,
        ArrowUp,
        ArrowDown,
        Play,
        Trash2,
        XCircle,
        QrCode,
        X,
        LogOut,
        Shuffle,
    } from "lucide-svelte";

    let qrCodeDataURL = $state<string | null>(null);

    async function showQRCode() {
        try {
            const joinUrl = `${window.location.origin}/?c=${gameState.game?.code}`;
            qrCodeDataURL = await QRCode.toDataURL(joinUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: "#0f766e", // teal-700
                    light: "#ffffff",
                },
            });
        } catch (err) {
            console.error(err);
        }
    }

    function closeQRCode() {
        qrCodeDataURL = null;
    }

    let players = $derived(
        [...gameState.players].sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
        ),
    );
    let me = $derived(gameState.me);
    let is_admin = $derived(me?.is_admin);

    function handleCancel() {
        if (
            confirm(
                "¿Estás seguro de que deseas cancelar la partida entera para todos los jugadores?",
            )
        ) {
            gameState.cancelGame();
        }
    }

    function handleLeave() {
        if (confirm("¿Estás seguro de que deseas salir de la sala?")) {
            gameState.leaveRoom();
        }
    }

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

    async function randomizeOrderAndStart() {
        if (!is_admin) return;
        if (players.length < 2) {
            alert("Se necesitan al menos 2 jugadores.");
            return;
        }
        const newPlayers = [...players];
        for (let i = newPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = newPlayers[i];
            newPlayers[i] = newPlayers[j];
            newPlayers[j] = temp;
        }
        await gameState.updatePlayersOrder(newPlayers);

        // Empezar la partida de inmediato
        await gameState.startGame();
    }

    function kick(player: any) {
        if (confirm(`¿Expulsar a ${player.name}?`)) {
            gameState.kickPlayer(player.id);
        }
    }

    async function handleStart() {
        if (players.length < 2) {
            alert("Se necesitan al menos 2 jugadores.");
            return;
        }
        await gameState.startGame();
    }
</script>

<div class="panel">
    <div class="header">
        <div class="header-info">
            <div class="title-with-logo">
                <img src="/logo.png" alt="Logo" class="small-logo" />
                <h2>Sala de Espera</h2>
            </div>
            <p class="subtitle">Código de Partida:</p>
            <div class="code-box-wrapper">
                <div class="code-box">
                    <code>{gameState.game?.code}</code>
                </div>
                <button
                    class="icon-btn qr-btn"
                    onclick={showQRCode}
                    title="Mostrar código QR"
                >
                    <QrCode size={24} />
                </button>
            </div>
        </div>
        {#if is_admin}
            <div class="header-actions">
                <button
                    class="primary action-btn start-btn"
                    onclick={randomizeOrderAndStart}
                    title="Orden aleatorio y Empezar"
                >
                    <Shuffle size={20} />
                </button>
                <button
                    class="primary action-btn start-btn"
                    onclick={handleStart}
                >
                    <Play size={20} /> Empezar
                </button>
            </div>
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
                                title="Bajar"
                            >
                                <ArrowDown size={16} />
                            </button>
                            {#if player.id !== me?.id}
                                <button
                                    class="icon-btn danger"
                                    onclick={() => kick(player)}
                                    title="Expulsar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            {/if}
                        </div>
                    {:else if player.id === me?.id}
                        <div class="controls">
                            <button
                                class="icon-btn danger"
                                onclick={handleLeave}
                                title="Salir de la sala"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>
    </div>

    {#if is_admin}
        <div class="footer-actions mt-4">
            <button class="danger action-btn w-full" onclick={handleCancel}>
                <XCircle size={20} /> Cancelar Partida
            </button>
        </div>
    {/if}
</div>

{#if qrCodeDataURL}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={closeQRCode}>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>
            <button class="icon-btn close-modal" onclick={closeQRCode}>
                <X size={24} />
            </button>
            <h3>Escanea para unirte</h3>
            <img
                src={qrCodeDataURL}
                alt="Código QR para unirse"
                class="qr-img"
            />
            <p class="text-muted mt-2">
                Apunta con la cámara de tu móvil para entrar a la sala
                fácilmente.
            </p>
        </div>
    </div>
{/if}

<style>
    .header {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        border-bottom: 1px solid var(--surface-hover);
        padding-bottom: 1.5rem;
        margin-bottom: 1rem;
    }
    @media (min-width: 600px) {
        .header {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
        }
    }
    .header-info {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    @media (min-width: 600px) {
        .header-info {
            align-items: flex-start;
        }
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
    .code-box-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
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
    .header-actions {
        display: flex;
        gap: 0.5rem;
        width: 100%;
    }
    .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 1.125rem;
        padding: 0.75rem 1rem;
    }
    @media (min-width: 600px) {
        .header-actions {
            width: auto;
        }
        .action-btn {
            flex: initial;
            font-size: 1.25rem;
            padding: 1rem 2rem;
        }
    }
    .mt-2 {
        margin-top: 1rem;
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
    .icon-btn.danger:hover:not(:disabled) {
        color: var(--accent);
        background: rgba(244, 63, 94, 0.1);
    }
    .controls {
        display: flex;
        gap: 0.25rem;
    }

    /* Modal */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 1rem;
        box-sizing: border-box;
    }
    .modal-content {
        background: var(--surface);
        padding: 2.5rem 1.5rem;
        border-radius: 12px;
        position: relative;
        text-align: center;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        box-sizing: border-box;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    .close-modal {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
    }
    .qr-img {
        width: 250px;
        height: auto;
        max-height: 50vh;
        max-width: 100%;
        border-radius: 8px;
        margin: 1.5rem auto;
        display: block;
        object-fit: contain;
    }
    .qr-btn {
        background: var(--surface-hover);
        padding: 0.5rem;
        border-radius: 8px;
    }
    .qr-btn:hover {
        background: var(--primary);
        color: white;
    }
    .text-muted {
        color: var(--text-muted);
        font-size: 0.875rem;
    }
</style>
