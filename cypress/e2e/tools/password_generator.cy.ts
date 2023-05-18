import { DEFAULT_SYMBOLS, type PasswordOptions } from '../../../src/tools/password_generator/store';
import { escapeRegExp } from '../../../src/Utils';

// Generate all possible options
const passwordOptionsSets: PasswordOptions[] = [];
for (let length = 8; length <= 10; length++) {
    for (let includeLowercase = 0; includeLowercase <= 1; includeLowercase++) {
        for (let includeUppercase = 0; includeUppercase <= 1; includeUppercase++) {
            for (let includeNumbers = 0; includeNumbers <= 1; includeNumbers++) {
                for (let includeSymbols = 0; includeSymbols <= 1; includeSymbols++) {
                    passwordOptionsSets.push({
                        length,
                        includeLowercase: !!includeLowercase,
                        includeUppercase: !!includeUppercase,
                        includeNumbers: !!includeNumbers,
                        includeSymbols: !!includeSymbols,
                        customSymbols: DEFAULT_SYMBOLS,
                        updateOptions: () => {}
                    });
                }
            }
        }
    }
}

describe('Password Generator', () => {
    beforeEach(() => {
        cy.visit('password_generator');
        cy.get('#passwordLength', { timeout: 15000 });
        cy.get('#includeUppercase', { timeout: 15000 });
        cy.get('#includeLowercase', { timeout: 15000 });
        cy.get('#includeNumbers', { timeout: 15000 });
        cy.get('#includeSymbols', { timeout: 15000 });
        cy.get('#customSymbols', { timeout: 15000 });
        cy.get('#generateButton', { timeout: 15000 });
        cy.get('#passwordOutput', { timeout: 15000 });
    });

    passwordOptionsSets.forEach(options => {
        it('Generate password with options: ' + JSON.stringify(options), () => {
            cy.get('#passwordLength').clear().type(options.length.toString());

            if (options.includeLowercase) {
                cy.get('#includeLowercase').check();
            } else {
                cy.get('#includeLowercase').uncheck();
            }

            if (options.includeUppercase) {
                cy.get('#includeUppercase').check();
            } else {
                cy.get('#includeUppercase').uncheck();
            }

            if (options.includeNumbers) {
                cy.get('#includeNumbers').check();
            } else {
                cy.get('#includeNumbers').uncheck();
            }

            if (options.includeSymbols) {
                cy.get('#includeSymbols').check();

                if (options.customSymbols) {
                    cy.get('#customSymbols').clear().type(options.customSymbols);
                }
            } else {
                cy.get('#includeSymbols').uncheck();
            }

            cy.get('#generateButton').click();

            cy.get('#passwordOutput').invoke('val').then(passwordValue => {
                if (options.includeLowercase) {
                    expect(passwordValue).to.match(/[a-z]/);
                } else {
                    expect(passwordValue).to.not.match(/[a-z]/);
                }

                if (options.includeUppercase) {
                    expect(passwordValue).to.match(/[A-Z]/);
                } else {
                    expect(passwordValue).to.not.match(/[A-Z]/);
                }

                if (options.includeNumbers) {
                    expect(passwordValue).to.match(/[0-9]/);
                } else {
                    expect(passwordValue).to.not.match(/[0-9]/);
                }

                if (options.includeSymbols) {
                    expect(passwordValue).to.match(new RegExp(`[${escapeRegExp(options.customSymbols || DEFAULT_SYMBOLS)}]`));
                }
            });
        });
    });
});
