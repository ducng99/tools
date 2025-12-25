export type ColourScheme = "light" | "dark" | "auto";

export const getStoredTheme = () => localStorage.getItem("theme") as ColourScheme | null;
export const setStoredTheme = (theme: ColourScheme) => localStorage.setItem("theme", theme);

export const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
        return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const setBootstrapTheme = (theme: ColourScheme) => {
    if (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    }
    else {
        document.documentElement.setAttribute("data-bs-theme", theme);
    }
};

setBootstrapTheme(getPreferredTheme());
