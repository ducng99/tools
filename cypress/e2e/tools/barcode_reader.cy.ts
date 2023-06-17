const barFiles = [
    ['cypress/fixtures/tools/barcode_reader/url.png', 'https://static.ducng.dev/tools'],
    ['cypress/fixtures/tools/barcode_reader/url.svg', 'https://static.ducng.dev/tools'],
    ['cypress/fixtures/tools/barcode_reader/multi-lines.png', 'test\nmulti\nlines'],
    ['cypress/fixtures/tools/barcode_reader/multi-lines.svg', 'test\nmulti\nlines'],
    ['cypress/fixtures/tools/barcode_reader/special-chars.png', '!@#$%^&*()_-+=[]{};:\'",<.>/?'],
    ['cypress/fixtures/tools/barcode_reader/special-chars.svg', '!@#$%^&*()_-+=[]{};:\'",<.>/?'],
    ['cypress/fixtures/tools/barcode_reader/colours.png', 'test colours'],
    ['cypress/fixtures/tools/barcode_reader/colours.svg', 'test colours'],
    ['cypress/fixtures/tools/barcode_reader/custom-shapes-highres.png', 'this is a very high resolution image'],
    ['cypress/fixtures/tools/barcode_reader/custom-shapes-highres.svg', 'this is a very high resolution image']
];

describe('Barcode reader', () => {
    beforeEach(() => {
        cy.visit('barcode_reader');
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
