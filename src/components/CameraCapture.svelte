<script lang="ts">
    import {
        Camera,
        Upload,
        RotateCw,
        RotateCcw,
        ZoomIn,
        ZoomOut,
    } from "lucide-svelte";
    import Cropper from "cropperjs";
    import "cropperjs/dist/cropper.css";

    let { onSubmit } = $props<{ onSubmit: (dataUrl: string) => void }>();

    let mode = $state<"select" | "edit">("select");
    let rawPhotoUrl = $state<string | null>(null);
    let cropper: Cropper | null = null;

    function cropperAction(node: HTMLImageElement) {
        if (cropper) cropper.destroy();
        cropper = new Cropper(node, {
            aspectRatio: 1, // Relación de 1:1 (cuadrado 800x800)
            viewMode: 3, // Restringe la imagen al contenedor, evitando bordes blancos
            dragMode: "move", // Permite mover la foto por detrás
            cropBoxMovable: false, // Bloquea el movimiento del recuadro
            cropBoxResizable: false, // Bloquea el cambio de tamaño del recuadro
            toggleDragModeOnDblclick: false,
            background: false,
            autoCropArea: 1, // Llena el 100% del contenedor
            responsive: true,
            guides: false, // Quita las cuadrículas del recorte para que quede mas simpe
            center: false,
            highlight: false,
            modal: false, // Ocultar el overlay negro, el contenedor mostrará solo el recorte
        });

        return {
            destroy() {
                if (cropper) {
                    cropper.destroy();
                    cropper = null;
                }
            },
        };
    }

    function finishAndSubmit() {
        if (!cropper) return;
        const canvas = cropper.getCroppedCanvas({
            maxWidth: 1000,
            maxHeight: 1000,
            fillColor: "#fff",
            imageSmoothingEnabled: true,
            imageSmoothingQuality: "high",
        });
        if (!canvas) return;
        const finalDataUrl = canvas.toDataURL("image/jpeg", 0.6);
        onSubmit(finalDataUrl);
    }

    function handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            if (e.target && typeof e.target.result === "string") {
                rawPhotoUrl = e.target.result;
                mode = "edit";

                // Clear the input so selecting the same file triggers again
                input.value = "";
            }
        };

        reader.readAsDataURL(file);
    }
</script>

<div class="camera-wrapper">
    {#if mode === "select"}
        <div class="selection-screen">
            <h3>Comparte tu dibujo</h3>
            <div class="selection-container">
                <label class="select-box">
                    <div class="icon-circle primary-lite">
                        <Camera size={32} />
                    </div>
                    <span>Cámara</span>
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onchange={handleFileUpload}
                    />
                </label>
                <label class="select-box">
                    <div class="icon-circle primary-lite">
                        <Upload size={32} />
                    </div>
                    <span>Subir foto</span>
                    <input
                        type="file"
                        accept="image/*"
                        onchange={handleFileUpload}
                    />
                </label>
            </div>
            <p class="text-xs text-muted mt-4">
                Puedes hacer una foto o elegirla de tu galería
            </p>
        </div>
    {:else if mode === "edit" && rawPhotoUrl}
        <div class="edit-container">
            <h3 class="edit-title">Recortar foto</h3>
            <div class="cropper-wrapper">
                <img
                    src={rawPhotoUrl}
                    alt="Editar Imagen"
                    use:cropperAction
                    crossorigin="anonymous"
                />
            </div>

            <div class="cropper-controls">
                <button
                    class="icon-btn"
                    onclick={() => cropper?.rotate(-90)}
                    title="Girar Izquierda"
                >
                    <RotateCcw size={20} />
                </button>
                <button
                    class="icon-btn"
                    onclick={() => cropper?.rotate(90)}
                    title="Girar Derecha"
                >
                    <RotateCw size={20} />
                </button>
                <button
                    class="icon-btn"
                    onclick={() => cropper?.zoom(0.1)}
                    title="Acercar"
                >
                    <ZoomIn size={20} />
                </button>
                <button
                    class="icon-btn"
                    onclick={() => cropper?.zoom(-0.1)}
                    title="Alejar"
                >
                    <ZoomOut size={20} />
                </button>
            </div>

            <div class="actions center w-full">
                <button
                    class="btn secondary action-btn"
                    onclick={() => {
                        rawPhotoUrl = null;
                        mode = "select";
                    }}
                >
                    Volver
                </button>
                <button
                    class="btn primary action-btn"
                    onclick={finishAndSubmit}
                >
                    Subir foto
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .camera-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 1rem;
        position: relative;
    }

    .selection-screen {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 1rem 0;
    }

    .selection-container {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
        width: 100%;
        max-width: 400px;
    }

    .select-box {
        background: var(--surface-hover);
        border: 2px solid transparent;
        padding: 1.5rem 1rem;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        color: inherit;
        width: 100%;
    }

    .select-box:hover {
        background: var(--surface);
        border-color: var(--primary);
        transform: translateY(-4px);
    }

    .select-box span {
        font-weight: 600;
        font-size: 1rem;
    }

    .icon-circle {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .primary-lite {
        background: rgba(79, 70, 229, 0.2);
        color: var(--primary);
    }

    .select-box input {
        display: none;
    }

    .text-muted {
        color: var(--text-muted);
    }

    .actions {
        display: flex;
        flex-shrink: 0;
        gap: 1rem;
        padding: 0.5rem 0;
    }

    .actions.center {
        justify-content: center;
        align-items: center;
        position: relative;
    }

    .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1.25rem;
        font-size: 1.25rem;
    }

    .btn {
        border-radius: 8px;
        border: 1px solid transparent;
        padding: 0.8rem 1.2em;
        font-size: 1rem;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--text-main);
    }
    .btn.primary {
        background-color: var(--primary);
    }
    .btn.primary:hover {
        background-color: var(--primary-hover);
    }
    .btn.secondary {
        background-color: var(--surface-hover);
    }
    .btn.secondary:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }

    .edit-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1rem;
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .edit-title {
        text-align: center;
        margin: 0;
        margin-top: 1rem;
        font-size: 1.2rem;
    }

    .cropper-wrapper {
        width: 100%;
        aspect-ratio: 1;
        background: black;
        border-radius: 12px;
        overflow: hidden;
        flex: none;
        margin: auto;
    }
    .cropper-wrapper img {
        display: block;
        max-width: 100%;
    }
    .cropper-controls {
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding: 0.5rem;
        background: var(--surface-hover);
        border-radius: 12px;
    }

    .icon-btn {
        background: transparent;
        border: none;
        color: var(--text-main);
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: background-color 0.2s;
    }

    .icon-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .w-full {
        width: 100%;
    }

    /* Ocultamos las lineas de la libreria para que se vea mas limpio */
    :global(.cropper-view-box) {
        outline: none !important;
    }
    :global(.cropper-point),
    :global(.cropper-line) {
        display: none !important;
    }
</style>
