import { For, Show, createSignal, onCleanup, type JSX } from "solid-js";
import { toFirstUpperCase } from "../../utils";
import styles from "./ThemeToggle.module.css";
import { Dynamic } from "solid-js/web";
import { type ColourScheme, getPreferredTheme, getStoredTheme, setBootstrapTheme, setStoredTheme } from "../../theme";

const themeIcons: Record<ColourScheme, () => JSX.Element> = {
    light: () => <i class="bi bi-sun-fill"></i>,
    dark: () => <i class="bi bi-moon-stars-fill"></i>,
    auto: () => <i class="bi bi-circle-half"></i>,
};

export default function ThemeToggle() {
    const [currentTheme, setCurrentTheme] = createSignal<ColourScheme>(getPreferredTheme());

    const onPreferedColorSchemeChange = () => {
        const storedTheme = getStoredTheme();
        if (storedTheme !== "light" && storedTheme !== "dark") {
            setBootstrapTheme(getPreferredTheme());
        }
    };

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onPreferedColorSchemeChange);

    onCleanup(() => {
        window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", onPreferedColorSchemeChange);
    });

    const onThemeChangeClick = (theme: ColourScheme) => {
        setBootstrapTheme(theme);
        setStoredTheme(theme);
        setCurrentTheme(theme);
    };

    return (
        <>
            <button class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <Dynamic component={themeIcons[currentTheme()]} />
            </button>
            <ul class={`dropdown-menu dropdown-menu-end shadow ${styles["dropdown-menu"]}`}>
                <For each={["light", "dark", "auto"] as ColourScheme[]}>
                    {
                        theme => (
                            <li>
                                <button class="d-flex dropdown-item rounded-1" classList={{ active: currentTheme() === theme }} onClick={() => onThemeChangeClick(theme)} role="button">
                                    {themeIcons[theme]()}
                                    <span class="ms-2">{toFirstUpperCase(theme)}</span>
                                    <Show when={currentTheme() === theme}>
                                        <i class="bi bi-check2 ms-auto"></i>
                                    </Show>
                                </button>
                            </li>
                        )
                    }
                </For>
            </ul>
        </>
    );
}
