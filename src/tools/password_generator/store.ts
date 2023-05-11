import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_SYMBOLS = '!@#$%^&*()_-+=';

export interface PasswordOptions {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    customSymbols: string;
    updateOptions: (options: Partial<PasswordOptions>) => void;
}

export const useStore = create<PasswordOptions>()(
    persist(
        (set) => ({
            length: 16,
            includeLowercase: true,
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true,
            customSymbols: DEFAULT_SYMBOLS,
            updateOptions: (options: Partial<PasswordOptions>) => {
                set(options);
            }
        }),
        {
            name: 'password-generator-options'
        }
    )
);
