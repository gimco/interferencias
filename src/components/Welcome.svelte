<script lang="ts">
    import { gameState } from "../lib/game.svelte";

    let name = $state("");
    let gameIdToJoin = $state("");
    let isAdminRoute = $state(false);

    import { onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";

    const phrases = [
        "Arranca siendo un avión ... termina pareciendo un camión. 😂",
        "Nace como un castillo ... y acaba como un ladrillo. 🤣",
        "Parte como un dragón ... y acaba siendo un jamón. 😆",
        "Empieza como un gato ... y termina como un zapato. 🤭",
        "Sale siendo un león ... y acaba en melón. 😅",
        "Arranca con un pirata ... y termina en patata. 🤣",
        "Comienza como un retrato ... y termina en garabato. 😄",
        "Nace siendo un tesoro ... y acaba en loro. 😹",
        "Parte siendo un tiburón ... y termina en mejillón. 😭",
    ];
    let currentPhraseIndex = $state(0);
    let intervalId: ReturnType<typeof setInterval>;

    onMount(() => {
        intervalId = setInterval(() => {
            currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        }, 10000);
        isAdminRoute = window.location.pathname === "/admin";
        const params = new URLSearchParams(window.location.search);
        const urlCode = params.get("c") || params.get("code");
        if (urlCode) {
            gameIdToJoin = urlCode;

            // Limpiar la URL para que no quede el parámetro ?c=XXXX
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname,
            );

            if (!isAdminRoute) {
                setTimeout(() => {
                    const userName = prompt(
                        "Escribe tu nombre para unirte a la partida:",
                    );
                    if (userName) {
                        name = userName.trim();
                    }
                }, 100);
            }
        }
    });

    onDestroy(() => {
        if (intervalId) clearInterval(intervalId);
    });

    async function handleCreate() {
        if (!name.trim()) return;
        await gameState.createGame(name.trim());
    }

    async function handleJoin() {
        if (!name.trim() || !gameIdToJoin.trim()) return;
        await gameState.joinGame(
            gameIdToJoin.trim().toUpperCase(),
            name.trim(),
        );
    }
</script>

<div class="panel" style="max-width: 500px; margin: auto; height: auto;">
    <div class="logo-container">
        <img src="/logo.png" alt="Logo" class="global-logo" />
        <h1 class="title">Interferencias</h1>
        <div class="slogan">El teléfono escacharrado pero dibujando.</div>
    </div>
    <p class="subtitle">
        {#key currentPhraseIndex}
            <span class="changing-phrase" in:fade={{ duration: 500 }}>
                {phrases[currentPhraseIndex]}
            </span>
        {/key}
    </p>

    <div class="form-group">
        <label for="name">Tu Nombre</label>
        <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="ej. Bruno"
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

        <p
            class="text-xs text-center"
            style="color: var(--text-muted); padding-bottom: 1rem"
        >
            Crea una sala para que tus amigos puedan unirse.
        </p>
    {:else}
        <div class="form-group">
            <label for="gameId">Código de la Partida</label>
            <input
                id="gameId"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                bind:value={gameIdToJoin}
                oninput={() => {
                    gameIdToJoin = gameIdToJoin
                        .replace(/[^0-9]/g, "")
                        .slice(0, 4);
                }}
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
    {:else}
        <div style="margin-top: 2rem; text-align: center;">
            <a href="/" class="btn-volver">Volver al menú</a>
        </div>
    {/if}
</div>

<div class="copyright">
    <a href="https://blog.gimco.es" target="_blank" rel="noopener noreferrer">
        Made in Sanlúcar with ❤️🤖🦐🥂
    </a>
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
    .btn-volver {
        display: inline-block;
        background: var(--surface-hover);
        color: var(--text-main);
        text-decoration: none;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        transition: background 0.2s;
        font-size: 1rem;
    }
    .btn-volver:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    .copyright {
        margin-top: 1.5rem;
        text-align: center;
        font-size: 0.8rem;
    }
    .copyright a {
        color: rgba(255, 255, 255, 0.3); /* Color mucho más claro */
        text-decoration: none;
        transition: color 0.2s;
    }
    .copyright a:hover {
        color: rgba(255, 255, 255, 0.7);
    }
    .slogan {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-top: -1rem;
        margin-bottom: 1rem;
        font-weight: 500;
        text-align: center;
    }
</style>
