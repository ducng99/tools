const barFiles = [
    ['cypress/fixtures/tools/barcode_utils/url.png', 'https://static.ducng.dev/tools'],
    ['cypress/fixtures/tools/barcode_utils/url.svg', 'https://static.ducng.dev/tools'],
    ['cypress/fixtures/tools/barcode_utils/multi-lines.png', 'test\nmulti\nlines'],
    ['cypress/fixtures/tools/barcode_utils/multi-lines.svg', 'test\nmulti\nlines'],
    ['cypress/fixtures/tools/barcode_utils/special-chars.png', '!@#$%^&*()_-+=[]{};:\'",<.>/?'],
    ['cypress/fixtures/tools/barcode_utils/special-chars.svg', '!@#$%^&*()_-+=[]{};:\'",<.>/?'],
    ['cypress/fixtures/tools/barcode_utils/colours.png', 'test colours'],
    ['cypress/fixtures/tools/barcode_utils/colours.svg', 'test colours'],
    ['cypress/fixtures/tools/barcode_utils/custom-shapes-highres.png', 'this is a very high resolution image'],
    ['cypress/fixtures/tools/barcode_utils/custom-shapes-highres.svg', 'this is a very high resolution image'],
    ['cypress/fixtures/tools/barcode_utils/madness.png', 'no clue\nwhat this is\nmate\n1234657890-=_+[]:"}{,/.><?\nno clue\nwhat this is\nmate\n1234657890-=_+[]:"}{,/.><?\nno clue\nwhat this is\nmate\n1234657890-=_+[]:"}{,/.><?\nno clue\nwhat this is\nmate\n1234657890-=_+[]:"}{,/.><?\nno clue\nwhat this is\nmate\n1234657890-=_+[]:"}{,/.><?'],
];

describe('Barcode scanner', () => {
    beforeEach(() => {
        cy.visit('barcode_utils');
        cy.get('#barcode-image-file-upload', { timeout: 15000 });
        cy.get('#trigger-button', { timeout: 15000 });
        cy.get('#output-textbox', { timeout: 15000 });
    });

    barFiles.forEach((file, index) => {
        it('File upload test ' + index.toString(), () => {
            cy.get('#barcode-image-file-upload').selectFile(file[0]);
            cy.get('#output-textbox').should('have.value', file[1]);
            cy.get('#trigger-button').click();
            cy.get('#output-textbox').should('have.value', file[1]);
        });
    });
});
