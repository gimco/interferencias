<script lang="ts">
    import { onMount } from "svelte";
    import { Trash2, CheckCircle, Eraser } from "lucide-svelte";

    let { onSubmit } = $props<{ onSubmit: (dataUrl: string) => void }>();

    let canvasRef: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let isDrawing = false;

    let colors = [
        "#000000",
        "#EF4444",
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#8B5CF6",
        "#EC4899",
    ];
    let currentColor = $state(colors[0]);

    onMount(() => {
        if (!canvasRef) return;
        ctx = canvasRef.getContext("2d");

        // Ensure default white background for JPEG/saving
        const resizeCanvas = () => {
            if (!canvasRef || !ctx) return;
            // Get current bounds
            const rect = canvasRef.parentElement!.getBoundingClientRect();
            // Store prev drawing if resizing
            const data = canvasRef.toDataURL();

            canvasRef.width = rect.width;
            canvasRef.height = rect.height;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvasRef.width, canvasRef.height);

            if (data !== "data:,") {
                const img = new Image();
                img.onload = () => ctx!.drawImage(img, 0, 0);
                img.src = data;
            }
        };

        // Initialize size
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        return () => window.removeEventListener("resize", resizeCanvas);
    });

    // Drawing Logic
    function getPos(e: MouseEvent | TouchEvent) {
        if (!canvasRef) return { x: 0, y: 0 };
        const rect = canvasRef.getBoundingClientRect();
        let clientX, clientY;

        if (window.TouchEvent && e instanceof TouchEvent) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        // Mapping bounds to canvas resolution
        return {
            x: (clientX - rect.left) * (canvasRef.width / rect.width),
            y: (clientY - rect.top) * (canvasRef.height / rect.height),
        };
    }

    function startDraw(e: MouseEvent | TouchEvent) {
        if (!ctx) return;
        isDrawing = true;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);

        // Allow dots for single clicks
        ctx.lineTo(x, y);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
    }

    function draw(e: MouseEvent | TouchEvent) {
        if (!isDrawing || !ctx) return;
        e.preventDefault(); // Prevent scrolling on touch
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function endDraw() {
        if (!isDrawing || !ctx) return;
        isDrawing = false;
        ctx.closePath();
    }

    function clear() {
        if (!ctx || !canvasRef) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasRef.width, canvasRef.height);
    }

    function finish() {
        if (!canvasRef) return;
        onSubmit(canvasRef.toDataURL("image/png"));
    }
</script>

<div class="canvas-wrapper">
    <div class="toolbar">
        <div class="colors">
            {#each colors as color}
                <button
                    class="color-btn"
                    class:active={currentColor === color}
                    style="background-color: {color}"
                    aria-label="Color"
                    onclick={() => (currentColor = color)}
                ></button>
            {/each}
            <button
                class="icon-btn tool"
                class:active={currentColor === "#ffffff"}
                onclick={() => (currentColor = "#ffffff")}
                title="Goma"
            >
                <Eraser size={20} />
            </button>
        </div>

        <button class="icon-btn clear" onclick={clear} title="Borrar Todo">
            <Trash2 size={20} />
        </button>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="canvas-container">
        <canvas
            bind:this={canvasRef}
            onmousedown={startDraw}
            onmousemove={draw}
            onmouseup={endDraw}
            onmouseleave={endDraw}
            ontouchstart={startDraw}
            ontouchmove={draw}
            ontouchend={endDraw}
        ></canvas>
    </div>

    <button class="primary submit-btn" onclick={finish}>
        <CheckCircle size={24} /> Terminar Dibujo
    </button>
</div>

<style>
    .canvas-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 0.5rem;
    }

    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--surface-hover);
        padding: 0.5rem;
        border-radius: 8px;
    }

    .colors {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .color-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid transparent;
        padding: 0;
        cursor: pointer;
        transition: transform 0.1s;
    }

    .color-btn.active {
        transform: scale(1.2);
        border-color: white;
    }

    .icon-btn {
        background: transparent;
        color: var(--text-muted);
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
    }

    .icon-btn.active {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }

    .icon-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .clear:hover {
        color: var(--accent);
    }

    .canvas-container {
        flex: 1;
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid var(--surface-hover);
        background: white; /* Make sure it visually looks white */
    }

    canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        cursor: crosshair;
        touch-action: none; /* Crucial to prevent pulling to refresh or scrolling on mobile */
    }

    .submit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        font-size: 1.25rem;
    }
</style>
