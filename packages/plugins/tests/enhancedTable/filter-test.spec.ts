import * as Page from "./etPage"

const { describe, it, before } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

describe('the enhancedTable filters', () => {  
    before(async function({ remote }) {
        await remote.get('http://localhost:6001/enhancedTable/samples/et-test.html')
        await Page.open(remote)
    })

    it('should have a selector dropdown', async function ({ remote }) {
        const selector = await Page.selectorDropDown(remote)
        expect(await selector.isEnabled()).to.be.true
    });

    it('should have a number filter with min', async function ({ remote }) {
        const numSelector = await Page.minNumberInput(remote)
        expect(await numSelector.isEnabled()).to.be.true
    });

    it('should have a number filter with max', async function ({ remote }) {
        const numSelector = await Page.maxNumberInput(remote)
        expect(await numSelector.isEnabled()).to.be.true
    });
});

export {}; // see: https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files
