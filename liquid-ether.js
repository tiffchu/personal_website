(function () {
    const canvas = document.getElementById("liquid-ether");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!canvas || reduceMotion.matches) {
        if (canvas) {
            canvas.remove();
        }
        return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    const blobs = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = null;

    const palettes = {
        light: [
            [7, 84, 99],
            [255, 123, 110],
            [138, 214, 210],
            [236, 232, 248]
        ],
        dark: [
            [138, 214, 210],
            [255, 155, 140],
            [236, 232, 248],
            [7, 84, 99]
        ]
    };

    function isDarkTheme() {
        return document.documentElement.getAttribute("data-theme") === "dark";
    }

    function createBlobs() {
        blobs.length = 0;
        const count = Math.max(8, Math.min(14, Math.floor(width / 120)));
        const colors = isDarkTheme() ? palettes.dark : palettes.light;

        for (let i = 0; i < count; i++) {
            blobs.push({
                x: Math.random() * width,
                y: Math.random() * height,
                baseX: Math.random() * width,
                baseY: Math.random() * height,
                radius: 150 + Math.random() * 220,
                color: colors[i % colors.length],
                alpha: 0.08 + Math.random() * 0.08,
                speedX: 0.16 + Math.random() * 0.22,
                speedY: 0.12 + Math.random() * 0.18,
                phase: Math.random() * Math.PI * 2,
                wobble: 44 + Math.random() * 80
            });
        }
    }

    function resizeCanvas() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        createBlobs();
    }

    function drawBlob(blob, time) {
        const driftX = Math.sin(time * blob.speedX + blob.phase) * blob.wobble;
        const driftY = Math.cos(time * blob.speedY + blob.phase * 0.7) * blob.wobble;
        const x = blob.baseX + driftX;
        const y = blob.baseY + driftY;
        const radius = blob.radius + Math.sin(time * 0.45 + blob.phase) * 28;
        const [r, g, b] = blob.color;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${blob.alpha})`);
        gradient.addColorStop(0.46, `rgba(${r}, ${g}, ${b}, ${blob.alpha * 0.45})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawNoise() {
        ctx.save();
        ctx.globalAlpha = isDarkTheme() ? 0.035 : 0.025;

        for (let i = 0; i < 120; i++) {
            const shade = isDarkTheme() ? 255 : 7;
            ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${Math.random()})`;
            ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
        }

        ctx.restore();
    }

    function render(now) {
        const time = now * 0.001;
        ctx.clearRect(0, 0, width, height);

        if (document.body.dataset.vantaActive === "true") {
            raf = requestAnimationFrame(render);
            return;
        }

        ctx.globalCompositeOperation = "source-over";
        blobs.forEach((blob) => drawBlob(blob, time));

        ctx.globalCompositeOperation = isDarkTheme() ? "screen" : "multiply";
        blobs.slice(0, 4).forEach((blob) => drawBlob(blob, time + 3.4));

        ctx.globalCompositeOperation = "source-over";
        drawNoise();

        raf = requestAnimationFrame(render);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    raf = requestAnimationFrame(render);

    window.addEventListener("pagehide", () => {
        if (raf) {
            cancelAnimationFrame(raf);
        }
    });
})();
