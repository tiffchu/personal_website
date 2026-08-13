const toggle = document.getElementById("theme-toggle");
const root = document.documentElement;

const typewriterName = document.querySelector(".typewriter-name");
const typewriterCursor = document.querySelector(".typewriter-cursor");

if (typewriterName && typewriterCursor && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const name = typewriterName.textContent;
    let characterIndex = 0;

    typewriterName.textContent = "";
    typewriterCursor.hidden = false;

    const typeNextCharacter = () => {
        typewriterName.textContent += name[characterIndex];
        characterIndex += 1;

        if (characterIndex < name.length) {
            window.setTimeout(typeNextCharacter, 115);
        } else {
            typewriterCursor.hidden = true;
        }
    };

    window.setTimeout(typeNextCharacter, 150);
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    root.setAttribute("data-theme", savedTheme);
} else {
    root.setAttribute("data-theme", "dark");
}

if (toggle) {
    const setThemeLabel = () => {
        toggle.textContent = root.getAttribute("data-theme") === "dark" ? "\u2600" : "\u263e";
    };

    setThemeLabel();

    toggle.addEventListener("click", () => {
        const current = root.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";

        root.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
        setThemeLabel();
        updateHomeVanta();
    });
}

let homeVantaEffect = null;

function updateHomeVanta() {
    const homeClouds = document.getElementById("home-vanta-clouds");

    if (!homeClouds) {
        return;
    }

    const shouldUseVanta = root.getAttribute("data-theme") === "light";
    document.body.dataset.vantaActive = String(shouldUseVanta);

    if (!shouldUseVanta) {
        if (homeVantaEffect) {
            homeVantaEffect.destroy();
            homeVantaEffect = null;
        }
        return;
    }

    if (!homeVantaEffect && window.VANTA && window.VANTA.CLOUDS && window.THREE) {
        homeVantaEffect = window.VANTA.CLOUDS({
            el: "#home-vanta-clouds",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            skyColor: 0x8cb9ff,
            cloudColor: 0xdbdbf0
        });
    }
}

window.addEventListener("load", updateHomeVanta);
updateHomeVanta();

document.querySelectorAll(".nav-links").forEach((navLinks) => {
    const links = Array.from(navLinks.querySelectorAll("a"));
    const activeLink = links.find((link) => link.classList.contains("active")) || links[0];

    function setPill(link) {
        if (!link) {
            links.forEach((item) => item.classList.remove("is-pill-target"));
            navLinks.style.setProperty("--pill-opacity", "0");
            return;
        }

        const navRect = navLinks.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        const styles = getComputedStyle(navLinks);
        const inset = parseFloat(styles.paddingLeft) || 0;

        links.forEach((item) => item.classList.toggle("is-pill-target", item === link));
        navLinks.style.setProperty("--pill-left", `${Math.max(0, linkRect.left - navRect.left - inset)}px`);
        navLinks.style.setProperty("--pill-width", `${linkRect.width}px`);
        navLinks.style.setProperty("--pill-opacity", "1");
    }

    links.forEach((link) => {
        link.addEventListener("mouseenter", () => setPill(link));
        link.addEventListener("focus", () => setPill(link));
    });

    navLinks.addEventListener("mouseleave", () => setPill(activeLink));
    navLinks.addEventListener("focusout", () => requestAnimationFrame(() => {
        if (!navLinks.contains(document.activeElement)) {
            setPill(activeLink);
        }
    }));

    window.addEventListener("resize", () => setPill(activeLink));
    window.addEventListener("load", () => setPill(activeLink));
    setPill(activeLink);
});

const finePointer = window.matchMedia("(pointer: fine)");

const dotGrid = document.createElement("div");
dotGrid.className = "dot-grid";
dotGrid.setAttribute("aria-hidden", "true");

const dotGridCanvas = document.createElement("canvas");
dotGridCanvas.className = "dot-grid__canvas";
dotGrid.appendChild(dotGridCanvas);
document.body.prepend(dotGrid);

initDotGrid(dotGrid, dotGridCanvas);

function initDotGrid(wrapper, canvas) {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return;
    }

    const settings = {
        dotRadius: 1.55,
        activeRadius: 3.45,
        gap: 24,
        proximity: 150,
        speedTrigger: 95,
        shockRadius: 230,
        shockStrength: 14,
        spring: 0.085,
        friction: 0.82
    };
    const pointer = {
        x: -10000,
        y: -10000,
        lastX: null,
        lastY: null,
        lastTime: 0,
        active: false
    };
    let dots = [];
    let width = 0;
    let height = 0;
    let dpr = 1;

    function parseColor(value, fallback) {
        const color = (value || fallback).trim();
        const hex = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);

        if (hex) {
            return {
                r: parseInt(hex[1], 16),
                g: parseInt(hex[2], 16),
                b: parseInt(hex[3], 16)
            };
        }

        const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);

        if (rgb) {
            return {
                r: Number(rgb[1]),
                g: Number(rgb[2]),
                b: Number(rgb[3])
            };
        }

        return parseColor(fallback, "#075463");
    }

    function getPalette() {
        const styles = getComputedStyle(root);
        const isDark = root.getAttribute("data-theme") === "dark";

        return {
            base: parseColor(styles.getPropertyValue("--accent"), isDark ? "#ffffff" : "#075463"),
            active: parseColor(styles.getPropertyValue("--accent-warm"), isDark ? "#ffffff" : "#ff7b6e"),
            baseAlpha: isDark ? 0.34 : 0.28,
            activeAlpha: isDark ? 0.95 : 0.92
        };
    }

    function mix(start, end, amount) {
        return Math.round(start + (end - start) * amount);
    }

    function buildGrid() {
        const rect = wrapper.getBoundingClientRect();
        width = rect.width || window.innerWidth;
        height = rect.height || window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.ceil(width * dpr);
        canvas.height = Math.ceil(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cols = Math.ceil(width / settings.gap) + 2;
        const rows = Math.ceil(height / settings.gap) + 2;
        const startX = (width - (cols - 1) * settings.gap) / 2;
        const startY = (height - (rows - 1) * settings.gap) / 2;

        dots = [];

        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < cols; x += 1) {
                dots.push({
                    cx: startX + x * settings.gap,
                    cy: startY + y * settings.gap,
                    xOffset: 0,
                    yOffset: 0,
                    vx: 0,
                    vy: 0
                });
            }
        }
    }

    function pushDots(centerX, centerY, radius, strength, velocityX, velocityY) {
        dots.forEach((dot) => {
            const dx = dot.cx - centerX;
            const dy = dot.cy - centerY;
            const distance = Math.hypot(dx, dy);

            if (distance > radius || distance === 0) {
                return;
            }

            const falloff = 1 - distance / radius;
            const force = strength * falloff * falloff;

            dot.vx += (dx / distance) * force + velocityX * 0.006 * falloff;
            dot.vy += (dy / distance) * force + velocityY * 0.006 * falloff;
        });
    }

    function handlePointerMove(event) {
        const rect = canvas.getBoundingClientRect();
        const now = performance.now();
        const lastTime = pointer.lastTime || now - 16;
        const elapsed = Math.max(now - lastTime, 16);
        const lastX = pointer.lastX ?? event.clientX;
        const lastY = pointer.lastY ?? event.clientY;
        const velocityX = ((event.clientX - lastX) / elapsed) * 1000;
        const velocityY = ((event.clientY - lastY) / elapsed) * 1000;
        const speed = Math.hypot(velocityX, velocityY);

        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.lastX = event.clientX;
        pointer.lastY = event.clientY;
        pointer.lastTime = now;
        pointer.active = true;

        if (speed > settings.speedTrigger) {
            pushDots(pointer.x, pointer.y, settings.proximity, Math.min(speed / 115, settings.shockStrength), velocityX, velocityY);
        }
    }

    function handlePointerLeave() {
        pointer.active = false;
        pointer.x = -10000;
        pointer.y = -10000;
        pointer.lastX = null;
        pointer.lastY = null;
    }

    function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        pushDots(
            event.clientX - rect.left,
            event.clientY - rect.top,
            settings.shockRadius,
            settings.shockStrength,
            0,
            0
        );
    }

    function drawDot(dot, palette) {
        dot.vx += -dot.xOffset * settings.spring;
        dot.vy += -dot.yOffset * settings.spring;
        dot.vx *= settings.friction;
        dot.vy *= settings.friction;
        dot.xOffset += dot.vx;
        dot.yOffset += dot.vy;

        const dx = dot.cx - pointer.x;
        const dy = dot.cy - pointer.y;
        const distance = Math.hypot(dx, dy);
        const hover = pointer.active && distance < settings.proximity
            ? 1 - distance / settings.proximity
            : 0;

        const radius = settings.dotRadius + (settings.activeRadius - settings.dotRadius) * hover;
        const alpha = palette.baseAlpha + (palette.activeAlpha - palette.baseAlpha) * hover;
        const r = mix(palette.base.r, palette.active.r, hover);
        const g = mix(palette.base.g, palette.active.g, hover);
        const b = mix(palette.base.b, palette.active.b, hover);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(dot.cx + dot.xOffset, dot.cy + dot.yOffset, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function render() {
        const palette = getPalette();

        ctx.clearRect(0, 0, width, height);
        dots.forEach((dot) => drawDot(dot, palette));
        ctx.globalAlpha = 1;
        requestAnimationFrame(render);
    }

    buildGrid();

    if ("ResizeObserver" in window) {
        const observer = new ResizeObserver(buildGrid);
        observer.observe(wrapper);
    } else {
        window.addEventListener("resize", buildGrid);
    }

    if (finePointer.matches) {
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerleave", handlePointerLeave);
        window.addEventListener("click", handleClick);
    }

    requestAnimationFrame(render);
}

document.querySelectorAll("[data-option-wheel]").forEach((wheel) => {
    const items = Array.from(wheel.querySelectorAll(".option-wheel__item"));
    const selectedAtLoad = Math.max(
        0,
        items.findIndex((item) => item.classList.contains("option-wheel__item--selected"))
    );
    const cfg = {
        count: items.length,
        fontSize: parseFloat(getComputedStyle(wheel).getPropertyValue("--ow-font-size")) || 3,
        spacing: 1.4,
        curve: 1,
        tilt: 6,
        blur: 2,
        fade: 0.25,
        minOpacity: 0.05,
        smoothing: 200,
        loop: wheel.closest(".home-page") !== null
    };
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const rowH = Math.max(cfg.fontSize * cfg.spacing * remPx, 1);
    const state = {
        pos: selectedAtLoad,
        target: selectedAtLoad,
        selected: selectedAtLoad,
        raf: null,
        last: 0,
        wheelTimer: null,
        drag: null,
        dragMoved: false
    };

    function render(now) {
        const dt = Math.min((now - state.last) / 1000, 0.05);
        state.last = now;
        const tau = Math.max(cfg.smoothing, 1) / 1000;
        const k = 1 - Math.exp(-dt / tau);
        let next = state.pos + (state.target - state.pos) * k;
        const settled = Math.abs(state.target - next) < 0.001;

        if (settled) {
            next = state.target;
        }

        state.pos = next;

        const tiltRad = (cfg.tilt * Math.PI) / 180;
        const radius = tiltRad > 0.0005 ? rowH / tiltRad : 0;

        items.forEach((item, index) => {
            let distance = index - next;

            if (cfg.loop && cfg.count > 1) {
                distance = ((distance % cfg.count) + cfg.count) % cfg.count;
                if (distance > cfg.count / 2) {
                    distance -= cfg.count;
                }
            }

            const absDistance = Math.abs(distance);
            let x = 0;
            let y = distance * rowH;
            let rotation = 0;

            if (radius > 0) {
                const angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, distance * tiltRad));
                y = radius * Math.sin(angle);
                x = radius * (1 - Math.cos(angle)) * cfg.curve;
                rotation = (-angle * 180) / Math.PI;
            }

            item.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rotation.toFixed(3)}deg)`;
            item.style.opacity = String(Math.max(cfg.minOpacity, 1 - absDistance * cfg.fade));
            item.style.filter = cfg.blur > 0 ? `blur(${(absDistance * cfg.blur).toFixed(2)}px)` : "none";
            item.style.setProperty("--ow-p", Math.max(0, 1 - Math.min(absDistance, 1)).toFixed(4));
        });

        state.raf = settled ? null : requestAnimationFrame(render);
    }

    function startLoop() {
        if (state.raf !== null) {
            cancelAnimationFrame(state.raf);
        }

        state.last = performance.now();
        state.raf = requestAnimationFrame(render);
    }

    function setSelected(index) {
        state.selected = index;
        items.forEach((item, itemIndex) => {
            const isSelected = itemIndex === index;
            item.classList.toggle("option-wheel__item--selected", isSelected);
            item.setAttribute("aria-selected", String(isSelected));
        });
    }

    function applyTarget(value, snap) {
        let next = value;

        if (!cfg.loop) {
            next = Math.min(Math.max(next, 0), Math.max(cfg.count - 1, 0));
        }

        if (snap) {
            next = Math.round(next);
        }

        state.target = next;
        const selected = cfg.loop
            ? ((Math.round(next) % cfg.count) + cfg.count) % cfg.count
            : Math.round(next);

        if (selected !== state.selected) {
            setSelected(selected);
        }

        startLoop();
    }

    wheel.addEventListener(
        "wheel",
        handleWheel,
        { passive: false }
    );

    function handleWheel(event) {
        event.preventDefault();
        event.stopPropagation();
        const delta = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY;
        const step = Math.max(-1, Math.min(1, delta / rowH));

        applyTarget(state.target + step, false);

        if (state.wheelTimer) {
            clearTimeout(state.wheelTimer);
        }

        state.wheelTimer = setTimeout(() => applyTarget(state.target, true), 140);
    }

    document.addEventListener(
        "wheel",
        (event) => {
            const inRightZone = event.clientX >= window.innerWidth * 0.8;

            if (inRightZone) {
                handleWheel(event);
            }
        },
        { passive: false }
    );

    wheel.addEventListener("pointerdown", (event) => {
        state.drag = { y: event.clientY, start: state.target, id: event.pointerId };
        state.dragMoved = false;
        wheel.classList.add("option-wheel--dragging");
    });

    wheel.addEventListener("pointermove", (event) => {
        if (!state.drag) {
            return;
        }

        const dy = event.clientY - state.drag.y;

        if (!state.dragMoved && Math.abs(dy) > 4) {
            state.dragMoved = true;
            wheel.setPointerCapture(state.drag.id);
        }

        if (state.dragMoved) {
            applyTarget(state.drag.start - dy / rowH, false);
        }
    });

    function endDrag() {
        if (!state.drag) {
            return;
        }

        state.drag = null;
        wheel.classList.remove("option-wheel--dragging");

        if (state.dragMoved) {
            applyTarget(state.target, true);
            setTimeout(() => {
                state.dragMoved = false;
            }, 0);
        }
    }

    wheel.addEventListener("pointerup", endDrag);
    wheel.addEventListener("pointercancel", endDrag);

    items.forEach((item, index) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();

            if (state.dragMoved) {
                setTimeout(() => {
                    state.dragMoved = false;
                }, 0);
                return;
            }

            const href = item.getAttribute("href");

            if (href) {
                window.location.href = href;
            }
        });
    });

    wheel.addEventListener("keydown", (event) => {
        let delta = null;

        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            delta = -1;
        } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            delta = 1;
        }

        if (delta === null) {
            return;
        }

        event.preventDefault();
        applyTarget(Math.round(state.target) + delta, true);
    });

    setSelected(selectedAtLoad);
    applyTarget(selectedAtLoad, false);
});
