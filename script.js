const toggle = document.getElementById("theme-toggle");
const root = document.documentElement;

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    root.setAttribute("data-theme", savedTheme);
    toggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
}

toggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    toggle.textContent = next === "dark" ? "☀️" : "🌙";
});

const styleToggle = document.getElementById("style-toggle");

const savedStyle = localStorage.getItem("style") || "professional";
document.documentElement.setAttribute("data-style", savedStyle);

if (styleToggle) {
    styleToggle.textContent = savedStyle === "creative" ? "🧠" : "🎨";

    styleToggle.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-style");
        const next = current === "professional" ? "creative" : "professional";

        document.documentElement.setAttribute("data-style", next);
        localStorage.setItem("style", next);

        styleToggle.textContent = next === "creative" ? "🧠" : "🎨";
    });
}
