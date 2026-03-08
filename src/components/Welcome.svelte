<script lang="ts">
    import { gameState } from "../lib/game.svelte";

    let name = $state("");
    let gameIdToJoin = $state("");
    let isAdminRoute = $state(false);

    import { onMount } from "svelte";

    onMount(() => {
        isAdminRoute = window.location.pathname === "/admin";
        const params = new URLSearchParams(window.location.search);
        const urlCode = params.get("c") || params.get("code");
        if (urlCode) {
            gameIdToJoin = urlCode;
        }
    });

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
    <div class="logo-container">
        <img src="/logo.png" alt="Logo" class="global-logo" />
        <h1 class="title">Interferencias</h1>
    </div>
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

    {#if isAdminRoute}
        <div class="actions">
            <button
                class="primary"
                onclick={handleCreate}
                disabled={!name.trim()}
            >
                Crear Nueva Partida
            </button>
        </div>

        <div class="divider"><span>Compartir link para unirse</span></div>
        <p
            class="text-xs text-center"
            style="color: var(--text-muted); padding-bottom: 1rem"
        >
            Los jugadores deben entrar a la ruta principal para unirse.
        </p>
    {:else}
        <div class="form-group">
            <label for="gameId">Código de la Partida</label>
            <input
                id="gameId"
                type="text"
                bind:value={gameIdToJoin}
                placeholder="ej. 1234"
                maxlength="4"
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
    {/if}

    {#if gameState.error}
        <div class="error">{gameState.error}</div>
    {/if}

    {#if !isAdminRoute}
        <div class="footer-links">
            <a href="/palabra">Ver palabras</a>
            <a href="/admin">Crear una sala</a>
        </div>
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
    .footer-links {
        display: flex;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 2rem;
        font-size: 0.875rem;
        width: 100%;
    }
    .footer-links a {
        color: var(--text-muted);
        text-decoration: none;
        transition: color 0.2s;
    }
    .footer-links a:hover {
        color: var(--text);
    }
    .logo-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    .global-logo {
        width: 80px;
        height: 80px;
        object-fit: contain;
    }
</style>
