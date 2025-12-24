import { For, createSignal, onCleanup } from "solid-js";
import { toFirstUpperCase } from "../../utils";

type ColourScheme = "light" | "dark" | "auto";

const getStoredTheme = () => localStorage.getItem("theme") as ColourScheme | null;
const setStoredTheme = (theme: ColourScheme) => localStorage.setItem("theme", theme);

const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
        return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const setTheme = (theme: ColourScheme) => {
    if (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    }
    else {
        document.documentElement.setAttribute("data-bs-theme", theme);
    }
};

export default function ThemeToggle() {
    const [currentTheme, setCurrentTheme] = createSignal<ColourScheme>(getPreferredTheme());

    setTheme(getPreferredTheme());

    const onPreferedColorSchemeChange = () => {
        const storedTheme = getStoredTheme();
        if (storedTheme !== "light" && storedTheme !== "dark") {
            setTheme(getPreferredTheme());
        }
    };

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onPreferedColorSchemeChange);

    onCleanup(() => {
        window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", onPreferedColorSchemeChange);
    });

    const onThemeChangeClick = (theme: ColourScheme) => {
        setTheme(theme);
        setStoredTheme(theme);
        setCurrentTheme(theme);
    };

    const getThemeIcon = (theme: ColourScheme) => {
        switch (theme) {
            case "light":
                return <i class="bi bi-sun-fill"></i>;
            case "dark":
                return <i class="bi bi-moon-stars-fill"></i>;
            case "auto":
            default:
                return <i class="bi bi-circle-half"></i>;
        }
    };

    const currentThemeIcon = () => getThemeIcon(currentTheme());

    return (
        <>
            <button class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                {currentThemeIcon()}
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
                <For each={["light", "dark", "auto"]}>
                    {
                        theme => (
                            <li>
                                <button class={"d-flex dropdown-item rounded-1" + (currentTheme() === theme ? " active" : "")} onClick={() => { onThemeChangeClick(theme as ColourScheme); }} role="button">
                                    {getThemeIcon(theme as ColourScheme)}
                                    <span class="ms-2">{toFirstUpperCase(theme)}</span>
                                    {
                                        currentTheme() === theme && <i class="bi bi-check2 ms-auto"></i>
                                    }
                                </button>
                            </li>
                        )
                    }
                </For>
            </ul>
        </>
    );
}
