import * as Page from "./etPage"

const { describe, it, before } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

describe('the enhancedTable panel', () => {
    let browser
    
    before(async function({ remote }) {
        browser = remote;
        await remote.get('http://localhost:6001/enhancedTable/samples/et-test.html')
        await Page.open(browser)
    })

    it('should open when a layer is clicked', async function () {
        const panel = await Page.panel(browser)
        expect(await panel.isDisplayed()).to.be.true
    });
});

export {}; // see: https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files
