const fileContentTests = [
    '1,2,3,4',
    'abc,abc,abc,abc\n5,6,7,8',
    'aervb,2,3,4\r\n5,sdfsdf,7,8\r\n9,10,11,12',
    '"aervb",2,3,4\r\n5,"sdfsdf",7,8\r\n9,10,11,12'
];

describe('CSV Swap', () => {
    before(() => {
        cy.visit('csv_swap');
        cy.wait(15000);
    });

    beforeEach(() => {
        cy.visit('csv_swap');
    });

    fileContentTests.forEach((fileContent, index) => {
        it('File upload sets textbox ' + index.toString(), () => {
            cy.get('#csv-file-upload').selectFile({
                contents: Cypress.Buffer.from(fileContent),
                fileName: 'test.csv',
                mimeType: 'text/csv'
            });

            cy.get('#csv-textbox').should('have.value', fileContent.replace(/\r\n/g, '\n'));
        });
    });

    it('Swap empty string', () => {
        cy.get('#csv-textbox').clear();
        cy.get('#trigger-button').click();

        cy.get('#output-textbox').should('have.value', '');
    });

    for (let iCol = 1; iCol <= 3; iCol++) {
        for (let iRow = 1; iRow <= 3; iRow++) {
            it(`Swap ${iCol}x${iRow}`, () => {
                const input = Array.from({ length: iRow }, () => Array.from({ length: iCol }, () => randomString()).join(',')).join('\n');
                const expectedOutput = Array.from({ length: iCol }, (_, i) => Array.from({ length: iRow }, (_, j) => input.split('\n')[j].split(',')[i]).join(',')).join('\n');

                cy.get('#csv-textbox').clear();
                cy.get('#csv-textbox').type(input);
                cy.get('#trigger-button').click();

                cy.get('#output-textbox').should('have.value', expectedOutput);
            });
        }
    }
});

function randomString() {
    return '"' + Math.random().toString(36).substring(2, 15) + '"';
}
