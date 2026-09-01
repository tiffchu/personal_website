const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function applyTheme(theme) {
    root.setAttribute("data-theme", theme);

    if (!themeToggle) {
        return;
    }

    const darkModeActive = theme === "dark";
    themeToggle.textContent = darkModeActive ? "\u2600" : "\u263e";
    themeToggle.setAttribute("aria-label", darkModeActive ? "Switch to light mode" : "Switch to dark mode");
}

applyTheme(savedTheme || preferredTheme);

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        localStorage.setItem("theme", nextTheme);
        applyTheme(nextTheme);
    });
}
