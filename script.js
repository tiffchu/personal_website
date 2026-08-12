const toggle = document.getElementById("theme-toggle");
const root = document.documentElement;

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

const projectSummaries = Array.from(document.querySelectorAll(".project-summary"));

function setProjectSummaryHeight(summary, expanded) {
    const fullHeight = summary.scrollHeight;
    const collapsedHeight = Math.ceil(fullHeight / 3);

    summary.style.setProperty("--summary-collapsed-height", `${collapsedHeight}px`);
    summary.style.maxHeight = expanded ? `${fullHeight}px` : `${collapsedHeight}px`;
}

projectSummaries.forEach((summary) => {
    const toggleButton = document.querySelector(
        `.project-summary-toggle[aria-controls="${summary.id}"]`
    );

    if (!toggleButton) {
        return;
    }

    const projectCard = summary.closest(".project-card");

    projectCard?.classList.add("is-collapsible");
    setProjectSummaryHeight(summary, false);

    toggleButton.addEventListener("click", () => {
        const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
        const nextExpanded = !isExpanded;

        summary.classList.toggle("is-expanded", nextExpanded);
        projectCard?.classList.toggle("is-expanded", nextExpanded);
        toggleButton.setAttribute("aria-expanded", String(nextExpanded));
        toggleButton.querySelector("span").textContent = nextExpanded ? "Read less" : "Read more";
        setProjectSummaryHeight(summary, nextExpanded);
    });
});

function refreshProjectSummaries() {
    projectSummaries.forEach((summary) => {
        const toggleButton = document.querySelector(
            `.project-summary-toggle[aria-controls="${summary.id}"]`
        );

        if (!toggleButton) {
            return;
        }

        const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
        setProjectSummaryHeight(summary, isExpanded);
    });
}

window.addEventListener("load", refreshProjectSummaries);
window.addEventListener("resize", refreshProjectSummaries);

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
        activeRadius: 0.46,
        gap: 24,
        proximity: 120,
        speedTrigger: 135,
        shockRadius: 150,
        shockStrength: 1.4,
        swipeStrength: 0.72,
        hoverPull: 0.085,
        velocityInfluence: 0.00028,
        maxPointerSpeed: 700,
        maxDotVelocity: 0.82,
        maxDotOffset: 5.25,
        pointerLag: 0.16,
        hoverDelay: 0.14,
        hoverDecay: 0.42,
        impulseDecay: 0.72,
        spring: 0.026,
        friction: 0.77
    };
    const pointer = {
        x: -10000,
        y: -10000,
        targetX: -10000,
        targetY: -10000,
        lastX: null,
        lastY: null,
        lastTime: 0,
        velocityX: 0,
        velocityY: 0,
        targetVelocityX: 0,
        targetVelocityY: 0,
        presence: 0,
        impulse: 0,
        active: false
    };
    let dots = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastRenderTime = 0;

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

    function darken(color, amount) {
        return {
            r: Math.max(0, Math.round(color.r * amount)),
            g: Math.max(0, Math.round(color.g * amount)),
            b: Math.max(0, Math.round(color.b * amount))
        };
    }

    function getPalette() {
        const styles = getComputedStyle(root);
        const isDark = root.getAttribute("data-theme") === "dark";
        const base = parseColor(styles.getPropertyValue("--accent"), isDark ? "#8ad6d2" : "#075463");

        return {
            base,
            active: darken(base, isDark ? 0.62 : 0.44),
            baseAlpha: isDark ? 0.34 : 0.28,
            activeAlpha: isDark ? 0.64 : 0.68
        };
    }

    function mix(start, end, amount) {
        return Math.round(start + (end - start) * amount);
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function limitVector(x, y, maxLength) {
        const length = Math.hypot(x, y);

        if (length <= maxLength || length === 0) {
            return { x, y, length };
        }

        const scale = maxLength / length;
        return {
            x: x * scale,
            y: y * scale,
            length: maxLength
        };
    }

    function getMaxDotOffset() {
        const maxRadius = Math.max(settings.dotRadius, settings.activeRadius);

        return Math.max(
            0,
            Math.min(settings.maxDotOffset, settings.gap / 2 - maxRadius - 0.5)
        );
    }

    function constrainDotMotion(dot) {
        const velocity = limitVector(dot.vx, dot.vy, settings.maxDotVelocity);

        dot.vx = velocity.x;
        dot.vy = velocity.y;

        const maxOffset = getMaxDotOffset();
        const offsetLength = Math.hypot(dot.xOffset, dot.yOffset);

        if (offsetLength <= maxOffset || offsetLength === 0) {
            return;
        }

        const offsetScale = maxOffset / offsetLength;

        dot.xOffset *= offsetScale;
        dot.yOffset *= offsetScale;

        const normalX = dot.xOffset / maxOffset;
        const normalY = dot.yOffset / maxOffset;
        const outwardVelocity = dot.vx * normalX + dot.vy * normalY;

        if (outwardVelocity > 0) {
            dot.vx -= outwardVelocity * normalX;
            dot.vy -= outwardVelocity * normalY;
        }
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

    function pullDots(centerX, centerY, radius, strength, velocityX, velocityY) {
        dots.forEach((dot) => {
            const dx = dot.cx - centerX;
            const dy = dot.cy - centerY;
            const distance = Math.hypot(dx, dy);

            if (distance > radius || distance === 0) {
                return;
            }

            const falloff = 1 - distance / radius;
            const easedFalloff = falloff * falloff * falloff;
            const force = strength * easedFalloff;

            dot.vx += (-dx / distance) * force + velocityX * settings.velocityInfluence * easedFalloff;
            dot.vy += (-dy / distance) * force + velocityY * settings.velocityInfluence * easedFalloff;
            constrainDotMotion(dot);
        });
    }

    function updatePointer(now) {
        const elapsed = lastRenderTime ? now - lastRenderTime : 16;
        const dt = clamp(elapsed / 1000, 0.001, 0.05);
        const follow = 1 - Math.exp(-dt / settings.pointerLag);
        const velocityFollow = 1 - Math.exp(-dt / (settings.pointerLag * 1.45));
        const presenceTarget = pointer.active ? 1 : 0;
        const presenceTau = pointer.active ? settings.hoverDelay : settings.hoverDecay;
        const presenceFollow = 1 - Math.exp(-dt / presenceTau);

        pointer.x += (pointer.targetX - pointer.x) * follow;
        pointer.y += (pointer.targetY - pointer.y) * follow;
        pointer.velocityX += (pointer.targetVelocityX - pointer.velocityX) * velocityFollow;
        pointer.velocityY += (pointer.targetVelocityY - pointer.velocityY) * velocityFollow;
        pointer.presence += (presenceTarget - pointer.presence) * presenceFollow;

        if (pointer.impulse > 0.01) {
            pullDots(
                pointer.x,
                pointer.y,
                settings.proximity,
                pointer.impulse,
                pointer.velocityX,
                pointer.velocityY
            );
            pointer.impulse *= Math.pow(settings.impulseDecay, dt * 60);
        } else {
            pointer.impulse = 0;
        }

        lastRenderTime = now;
    }

    function handlePointerMove(event) {
        const rect = canvas.getBoundingClientRect();
        const now = performance.now();
        const lastTime = pointer.lastTime || now - 16;
        const elapsed = Math.max(now - lastTime, 16);
        const lastX = pointer.lastX ?? event.clientX;
        const lastY = pointer.lastY ?? event.clientY;
        const rawVelocityX = ((event.clientX - lastX) / elapsed) * 1000;
        const rawVelocityY = ((event.clientY - lastY) / elapsed) * 1000;
        const velocity = limitVector(rawVelocityX, rawVelocityY, settings.maxPointerSpeed);
        const speed = velocity.length;

        const nextX = event.clientX - rect.left;
        const nextY = event.clientY - rect.top;
        const shouldSnapPointer = pointer.lastX === null && pointer.presence < 0.01;

        pointer.targetX = nextX;
        pointer.targetY = nextY;

        if (shouldSnapPointer) {
            pointer.x = nextX;
            pointer.y = nextY;
        }

        pointer.lastX = event.clientX;
        pointer.lastY = event.clientY;
        pointer.lastTime = now;
        pointer.targetVelocityX = velocity.x;
        pointer.targetVelocityY = velocity.y;
        pointer.active = true;

        if (speed > settings.speedTrigger) {
            const strength = ((speed - settings.speedTrigger) / (settings.maxPointerSpeed - settings.speedTrigger)) * settings.swipeStrength;

            pointer.impulse = Math.max(pointer.impulse, clamp(strength, 0, settings.swipeStrength));
        }
    }

    function handlePointerLeave() {
        pointer.active = false;
        pointer.targetX = pointer.x;
        pointer.targetY = pointer.y;
        pointer.lastX = null;
        pointer.lastY = null;
        pointer.targetVelocityX = 0;
        pointer.targetVelocityY = 0;
    }

    function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        pullDots(
            event.clientX - rect.left,
            event.clientY - rect.top,
            settings.shockRadius,
            settings.shockStrength,
            0,
            0
        );
    }

    function drawDot(dot, palette) {
        const currentX = dot.cx + dot.xOffset;
        const currentY = dot.cy + dot.yOffset;
        const dx = currentX - pointer.x;
        const dy = currentY - pointer.y;
        const distance = Math.hypot(dx, dy);
        const hover = pointer.presence > 0.01 && distance < settings.proximity
            ? pointer.presence * (1 - distance / settings.proximity)
            : 0;

        if (hover > 0 && distance > 0.01) {
            const pull = settings.hoverPull * hover * hover;

            dot.vx += (-dx / distance) * pull;
            dot.vy += (-dy / distance) * pull;
        }

        dot.vx += -dot.xOffset * settings.spring;
        dot.vy += -dot.yOffset * settings.spring;
        dot.vx *= settings.friction;
        dot.vy *= settings.friction;
        dot.xOffset += dot.vx;
        dot.yOffset += dot.vy;
        constrainDotMotion(dot);

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

    function render(now) {
        const palette = getPalette();

        updatePointer(now);
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
