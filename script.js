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
    });
}

const finePointer = window.matchMedia("(pointer: fine)");

if (finePointer.matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const cursorAura = document.createElement("div");
    cursorAura.className = "cursor-aura";
    cursorAura.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursorAura);

    window.addEventListener("pointermove", (event) => {
        cursorAura.classList.add("is-visible");
        cursorAura.style.left = `${event.clientX}px`;
        cursorAura.style.top = `${event.clientY}px`;
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
        cursorAura.classList.remove("is-visible");
    });
}

if (finePointer.matches) {
    document.querySelectorAll(".card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;

            card.style.setProperty("--glow-x", `${x}%`);
            card.style.setProperty("--glow-y", `${y}%`);
        });

        card.addEventListener("pointerleave", () => {
            card.style.removeProperty("--glow-x");
            card.style.removeProperty("--glow-y");
        });
    });
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
