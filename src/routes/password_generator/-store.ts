import { createStore } from "solid-js/store";
import { createComputed } from "solid-js";
import { DEFAULT_SYMBOLS } from "./-extension";
import type { PasswordOptions } from "./-extension";

export function useOptions() {
    const [options, setOptions] = createStore<PasswordOptions>({
        length: 16,
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
        customSymbols: DEFAULT_SYMBOLS,
    });

    createComputed(() => {
        const savedOptions = localStorage.getItem("password-generator-options");
        if (savedOptions) {
            try {
                setOptions(JSON.parse(savedOptions));
            }
            catch {
                console.warn("Failed to parse stored password generator options, resetting to defaults.");
                localStorage.removeItem("password-generator-options");
            }
        }
    });

    function updateOptions(options: Partial<PasswordOptions>) {
        setOptions((state) => {
            const updatedOptions = { ...state, ...options };
            localStorage.setItem("password-generator-options", JSON.stringify(updatedOptions));
            return updatedOptions;
        });
    }

    return [options, updateOptions] as const;
}
