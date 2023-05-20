import { escapeRegExp } from '../../Utils';
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

    let password = '';
    let passwordPasses = 4;

    do {
        // Generate password
        const randomTypedArray = new Uint32Array(options.length);

        password = [...crypto.getRandomValues(randomTypedArray)]
            .map(value => chars[value % chars.length])
            .join('');

        passwordPasses = 4;

        // Check to make sure password meets requirements
        if (options.includeLowercase && !password.match(/[a-z]/)) {
            passwordPasses--;
        }
        if (options.includeUppercase && !password.match(/[A-Z]/)) {
            passwordPasses--;
        }
        if (options.includeNumbers && !password.match(/[0-9]/)) {
            passwordPasses--;
        }
        if (options.includeSymbols && !password.match(new RegExp(`[${escapeRegExp(symbolChars)}]`))) {
            passwordPasses--;
        }
    } while (passwordPasses < 4 && passwordPasses < password.length);

    return password;
}
