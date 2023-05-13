import { DEFAULT_SYMBOLS, type PasswordOptions } from './store';

export function generatePassword(options: PasswordOptions) {
    // Define character sets
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numberChars = '0123456789';
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

    const randomTypedArray = new Uint32Array(options.length);

    return [...crypto.getRandomValues(randomTypedArray)]
        .map(value => chars[value % chars.length])
        .join('');
}
