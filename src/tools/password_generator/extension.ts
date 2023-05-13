import { DEFAULT_SYMBOLS, type PasswordOptions } from './store';

// Define character sets
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numberChars = '0123456789';

export function generatePassword(options: PasswordOptions): string {
    const symbolChars = options.customSymbols || DEFAULT_SYMBOLS;

    // Initialize character set to use
    let chars = '';
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

    // Generate password
    const randomTypedArray = new Uint32Array(options.length);

    const password = [...crypto.getRandomValues(randomTypedArray)]
        .map(value => chars[value % chars.length])
        .join('');

    // Final check to make sure password meets requirements
    if (options.includeLowercase && !password.match(/[a-z]/)) {
        return generatePassword(options);
    }
    if (options.includeUppercase && !password.match(/[A-Z]/)) {
        return generatePassword(options);
    }
    if (options.includeNumbers && !password.match(/[0-9]/)) {
        return generatePassword(options);
    }
    if (options.includeSymbols && !password.match(new RegExp(`[${escapeRegExp(symbolChars)}]`))) {
        return generatePassword(options);
    }

    return password;
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'); // $& means the whole matched string
}
