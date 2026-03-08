<script lang="ts">
    import { secretWords } from "../lib/words";
    import { Eye, EyeOff, RefreshCw } from "lucide-svelte";

    let currentWord = $state("");
    let cardState = $state<"hidden" | "revealed" | "passed">("hidden");
    let hideTimeout: number | NodeJS.Timeout | null = null;

    function nextWord() {
        const randomIndex = Math.floor(Math.random() * secretWords.length);
        currentWord = secretWords[randomIndex];
        cardState = "hidden";
        if (hideTimeout) clearTimeout(hideTimeout as number);
    }

    function handleCardClick() {
        if (cardState === "hidden") {
            cardState = "revealed";
            hideTimeout = setTimeout(() => {
                if (cardState === "revealed") {
                    cardState = "passed";
                }
            }, 5000);
        } else if (cardState === "revealed") {
            if (hideTimeout) clearTimeout(hideTimeout as number);
            cardState = "passed";
        }
    }

    // Initialize with a word
    nextWord();
</script>

<div
    class="panel center"
    style="max-width: 500px; margin: auto; text-align: center;"
>
    <div class="title-with-logo">
        <img src="/logo.png" alt="Logo" class="small-logo" />
        <h1 class="title" style="margin: 0;">Modo Papel</h1>
    </div>

    <p class="subtitle mb-4">
        Pulsa para ver la palabra secreta. Escóndela para pasar el móvil al
        siguiente jugador.
    </p>

    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="word-card"
        class:revealed={cardState === "revealed"}
        class:passed={cardState === "passed"}
        onclick={handleCardClick}
    >
        {#if cardState === "revealed"}
            <span class="word-text">{currentWord}</span>
            <div class="hint">
                <EyeOff size={16} class="inline-icon" /> Toca o espera 5s para ocultar
            </div>
        {:else if cardState === "hidden"}
            <span class="word-text hidden">**********</span>
            <div class="hint">
                <Eye size={16} class="inline-icon" /> Toca para revelar
            </div>
        {:else if cardState === "passed"}
            <span class="word-text passed-text">Siguiente Turno</span>
            <div class="hint">El jugador anterior ya ha visto su palabra.</div>
        {/if}
    </div>

    <button class="primary mt-4 action-btn" onclick={nextWord}>
        <RefreshCw size={20} class="inline-icon" /> Generar nueva palabra
    </button>
    <div style="margin-top: 2rem;">
        <a href="/" class="btn secondary">Volver al menú</a>
    </div>
</div>

<style>
    .center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
    }
    .mt-4 {
        margin-top: 2rem;
    }
    .mb-4 {
        margin-bottom: 2rem;
    }
    .word-card {
        background: var(--surface-hover);
        padding: 3rem 1rem;
        border-radius: 12px;
        width: 100%;
        cursor: pointer;
        user-select: none;
        transition:
            background 0.3s,
            transform 0.1s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
    }
    .word-card:active {
        transform: scale(0.98);
    }
    .word-card.revealed {
        background: rgba(16, 185, 129, 0.1);
        border: 2px solid var(--secondary);
    }
    .word-card.passed {
        background: rgba(0, 0, 0, 0.2);
        border: 2px dashed rgba(255, 255, 255, 0.1);
        cursor: default;
    }
    .word-card:not(.revealed):not(.passed) {
        border: 2px dashed var(--text-muted);
    }
    .word-text {
        font-size: 2rem;
        font-weight: bold;
        color: var(--secondary);
        margin-bottom: 1rem;
        word-wrap: break-word;
    }
    .word-text.hidden {
        color: var(--text-muted);
        letter-spacing: 0.5rem;
    }
    .word-text.passed-text {
        color: var(--text-muted);
        font-size: 1.5rem;
        letter-spacing: normal;
    }
    .hint {
        color: var(--text-muted);
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    :global(.inline-icon) {
        vertical-align: middle;
    }
    .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem 2rem;
        font-size: 1.25rem;
        width: 100%;
    }
    .title-with-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }
    .small-logo {
        width: 48px;
        height: 48px;
        object-fit: contain;
    }
    .btn.secondary {
        display: inline-block;
        background: var(--surface-hover);
        color: var(--text-main);
        text-decoration: none;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        transition: background 0.2s;
    }
    .btn.secondary:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
