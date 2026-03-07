<script lang="ts">
    import { secretWords } from "../lib/words";
    import { Eye, EyeOff, RefreshCw } from "lucide-svelte";

    let currentWord = $state("");
    let isVisible = $state(false);
    let hideTimeout: number | NodeJS.Timeout | null = null;

    function nextWord() {
        const randomIndex = Math.floor(Math.random() * secretWords.length);
        currentWord = secretWords[randomIndex];
        isVisible = false;
        if (hideTimeout) clearTimeout(hideTimeout as number);
    }

    function toggleVisible() {
        isVisible = !isVisible;

        if (hideTimeout) {
            clearTimeout(hideTimeout as number);
            hideTimeout = null;
        }

        if (isVisible) {
            // Automatically hide after 4 seconds
            hideTimeout = setTimeout(() => {
                isVisible = false;
                hideTimeout = null;
            }, 4000);
        }
    }

    // Initialize with a word
    nextWord();
</script>

<div
    class="panel center"
    style="max-width: 500px; margin: auto; text-align: center;"
>
    <h1 class="title">Modo Papel</h1>
    <p class="subtitle mb-4">
        Pulsa para ver la palabra secreta. Escóndela para pasar el móvil al
        siguiente jugador.
    </p>

    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="word-card" class:revealed={isVisible} onclick={toggleVisible}>
        {#if isVisible}
            <span class="word-text">{currentWord}</span>
            <div class="hint">
                <EyeOff size={16} class="inline-icon" /> Toca o espera 4s para ocultar
            </div>
        {:else}
            <span class="word-text hidden">**********</span>
            <div class="hint">
                <Eye size={16} class="inline-icon" /> Toca para revelar
            </div>
        {/if}
    </div>

    <button class="primary mt-4 action-btn" onclick={nextWord}>
        <RefreshCw size={20} class="inline-icon" /> Generar nueva palabra
    </button>
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
    .word-card:not(.revealed) {
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
</style>
