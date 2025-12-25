import { escapeRegExp, getRandomInt } from "../../utils";

// Define character sets
const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numberChars = "0123456789";

export const DEFAULT_SYMBOLS = "!@#$%^&*()_-+=[]{};:'\",<.>/?";

export interface PasswordOptions {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    customSymbols: string;
}

export function generatePassword(options: PasswordOptions): string {
    const symbolChars = options.customSymbols || DEFAULT_SYMBOLS;

    // Initialize character set to use
    let chars = "";
    if (options.includeLowercase) {
        chars += lowercaseChars;
    }
    if (options.includeUppercase) {
        chars += uppercaseChars;
    }
    if (options.includeNumbers) {
        chars += numberChars;
    }
    if (options.includeSymbols) {
        chars += symbolChars;
    }

    let password = "";
    let passwordPasses = 4;

    // If there are no characters to choose from or non-positive length, return empty
    if (chars.length === 0 || options.length <= 0) {
        return "";
    }

    do {
        // Generate password using unbiased random indices
        let result = "";
        for (let i = 0; i < options.length; i++) {
            result += chars[getRandomInt(chars.length)];
        }
        password = result;

        passwordPasses = 4;

        // Check to make sure password meets requirements
        if (options.includeLowercase && !/[a-z]/.test(password)) {
            passwordPasses--;
        }
        if (options.includeUppercase && !/[A-Z]/.test(password)) {
            passwordPasses--;
        }
        if (options.includeNumbers && !/[0-9]/.test(password)) {
            passwordPasses--;
        }
        if (options.includeSymbols && !password.match(new RegExp(`[${escapeRegExp(symbolChars)}]`))) {
            passwordPasses--;
        }
    } while (passwordPasses < 4 && passwordPasses < password.length);

    return password;
}
