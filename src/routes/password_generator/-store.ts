import { createStore } from "solid-js/store";

export const DEFAULT_SYMBOLS = "!@#$%^&*()_-+=[]{};:'\",<.>/?";

export interface PasswordOptions {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    customSymbols: string;
}

export const PasswordOptionsStore = createStore<PasswordOptions>({
    length: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
    customSymbols: DEFAULT_SYMBOLS,
});

export function updateOptions(options: Partial<PasswordOptions>) {
    PasswordOptionsStore[1]((state) => {
        const updatedOptions = { ...state, ...options };
        localStorage.setItem("password-generator-options", JSON.stringify(updatedOptions));
        return updatedOptions;
    });
}
