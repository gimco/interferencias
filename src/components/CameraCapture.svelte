<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Camera, RefreshCw, CheckCircle, Upload } from "lucide-svelte";

    let { onSubmit } = $props<{ onSubmit: (dataUrl: string) => void }>();

    let videoRef = $state<HTMLVideoElement>();
    let canvasRef: HTMLCanvasElement;
    let stream: MediaStream | null = null;
    let photoDataUrl = $state<string | null>(null);
    let cameraError = $state<string | null>(null);
    let isMobile = $state(false);

    onMount(() => {
        isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        startCamera();

        return () => {
            stopCamera();
        };
    });

    async function startCamera() {
        cameraError = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment", // Prefer back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });
            if (videoRef) {
                videoRef.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            cameraError =
                "No se pudo acceder a la cámara. Revisa los permisos.";
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            stream = null;
        }
    }

    function takePhoto() {
        if (!videoRef || !canvasRef) return;

        // Set canvas to video truth dimensions
        canvasRef.width = videoRef.videoWidth;
        canvasRef.height = videoRef.videoHeight;

        const ctx = canvasRef.getContext("2d");
        if (!ctx) return;

        // Draw video frame to canvas
        ctx.drawImage(videoRef, 0, 0, canvasRef.width, canvasRef.height);

        // Export to data URL
        photoDataUrl = canvasRef.toDataURL("image/jpeg", 0.8);

        // Stop camera while viewing photo
        stopCamera();
    }

    function retake() {
        photoDataUrl = null;
        startCamera();
    }

    function handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            if (e.target && typeof e.target.result === "string") {
                photoDataUrl = e.target.result;
                stopCamera();
            }
        };

        reader.readAsDataURL(file);
    }

    function finish() {
        if (photoDataUrl) {
            onSubmit(photoDataUrl);
        }
    }
</script>

<div class="camera-wrapper">
    {#if cameraError && !photoDataUrl}
        <div class="error-box">
            <p>{cameraError}</p>
            <p class="mt-2 text-muted">
                Alternativa: Sube una foto en su lugar
            </p>

            <label class="btn secondary upload-btn" style="margin-top: 1rem;">
                <Upload size={20} /> Elegir archivo
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onchange={handleFileUpload}
                />
            </label>
            <button
                class="btn secondary"
                style="margin-top: 0.5rem;"
                onclick={startCamera}
            >
                Reintentar Cámara
            </button>
        </div>
    {:else if photoDataUrl}
        <!-- Photo Preview -->
        <div class="preview-container">
            <img src={photoDataUrl} alt="Foto capturada" />
        </div>

        <div class="actions">
            <button class="btn secondary action-btn" onclick={retake}>
                <RefreshCw size={24} /> Repetir
            </button>
            <button class="btn primary action-btn" onclick={finish}>
                <CheckCircle size={24} /> Enviar foto
            </button>
        </div>
    {:else}
        <!-- Live Camera Feed -->
        <div class="video-container">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video bind:this={videoRef} autoplay playsinline></video>
        </div>

        <div class="actions center">
            {#if isMobile}
                <div class="fallback-upload">
                    <label class="icon-btn" title="Subir desde galería">
                        <Upload size={24} />
                        <input
                            type="file"
                            accept="image/*"
                            onchange={handleFileUpload}
                        />
                    </label>
                </div>
            {/if}

            <button
                class="capture-btn"
                aria-label="Hacer foto"
                onclick={takePhoto}
            >
                <div class="inner-circle"></div>
            </button>

            {#if !isMobile}
                <div class="fallback-upload">
                    <label class="icon-btn" title="Subir foto">
                        <Upload size={24} />
                        <input
                            type="file"
                            accept="image/*"
                            onchange={handleFileUpload}
                        />
                    </label>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Hidden canvas for capturing frames -->
    <canvas bind:this={canvasRef} style="display: none;"></canvas>
</div>

<style>
    .camera-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 1rem;
        position: relative;
    }

    .video-container,
    .preview-container {
        flex: 1;
        background: black;
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
    }

    video,
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .error-box {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(244, 63, 94, 0.1);
        border: 2px dashed rgba(244, 63, 94, 0.4);
        border-radius: 12px;
        color: var(--text-main);
        padding: 2rem;
        text-align: center;
    }

    .text-muted {
        color: var(--text-muted);
    }

    .actions {
        display: flex;
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

    .capture-btn {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: white;
        border: 4px solid var(--surface-hover);
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.1s;
    }

    .capture-btn:active {
        transform: scale(0.95);
    }

    .capture-btn .inner-circle {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: white;
        border: 2px solid #ccc;
    }

    .fallback-upload {
        position: absolute;
        right: 1rem;
    }

    .icon-btn {
        background: var(--surface);
        color: var(--text-main);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: 1px solid var(--surface-hover);
    }

    .icon-btn input[type="file"],
    .upload-btn input[type="file"] {
        display: none;
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
    .upload-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
</style>
