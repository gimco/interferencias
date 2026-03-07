<script lang="ts">
    import { gameState } from "../lib/game.svelte";

    let name = $state("");
    let gameIdToJoin = $state("");

    async function handleCreate() {
        if (!name.trim()) return;
        await gameState.createGame(name);
    }

    async function handleJoin() {
        if (!name.trim() || !gameIdToJoin.trim()) return;
        await gameState.joinGame(gameIdToJoin, name);
    }
</script>

<div class="panel" style="max-width: 500px; margin: auto; height: auto;">
    <h1 class="title">Interferencias</h1>
    <p class="subtitle">El teléfono escacharrado pero dibujando</p>

    <div class="form-group">
        <label for="name">Tu Nombre</label>
        <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="ej. Gimco"
        />
    </div>

    <div class="actions">
        <button class="primary" onclick={handleCreate} disabled={!name.trim()}>
            Crear Nueva Partida
        </button>
    </div>

    <div class="divider"><span>O Únete a una</span></div>

    <div class="form-group">
        <label for="gameId">Código de la Partida</label>
        <input
            id="gameId"
            type="text"
            bind:value={gameIdToJoin}
            placeholder="ej. 1234-abcd..."
        />
    </div>

    <div class="actions">
        <button
            class="secondary"
            onclick={handleJoin}
            disabled={!name.trim() || !gameIdToJoin.trim()}
        >
            Unirse
        </button>
    </div>

    {#if gameState.error}
        <div class="error">{gameState.error}</div>
    {/if}
</div>

<style>
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    label {
        font-weight: 500;
        color: var(--text-muted);
        font-size: 0.875rem;
    }
    .actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .primary,
    .secondary {
        width: 100%;
        padding: 1rem;
    }
    .divider {
        margin: 2rem 0;
        text-align: center;
        position: relative;
    }
    .divider::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        width: 100%;
        height: 1px;
        background: var(--surface-hover);
        z-index: 1;
    }
    .divider span {
        background: var(--surface);
        padding: 0 1rem;
        color: var(--text-muted);
        position: relative;
        z-index: 2;
        font-size: 0.875rem;
    }
    .error {
        margin-top: 1rem;
        padding: 0.75rem;
        border-radius: 8px;
        background: rgba(244, 63, 94, 0.1);
        color: var(--accent);
        border: 1px solid rgba(244, 63, 94, 0.2);
        font-size: 0.875rem;
        text-align: center;
    }
</style>
