import * as Page from "./etPage"

const { describe, it, before } = intern.getPlugin('interface.bdd');
const { expect } = intern.getPlugin('chai');

describe('the enhancedTable headers', () => {
    let browser
    
    before(async function({ remote }) {
        browser = remote;
        await remote.get('http://localhost:6001/enhancedTable/samples/et-test.html')
        await Page.open(browser)
    })

    it('should have a first column with a disabled move left button', async function () {
        const btn = await Page.firstColumnLeftButton(browser)
        expect(await btn.isEnabled()).to.be.true
    });

    it('should have a last column with a disabled move right button', async function () {
        const btn = await Page.lastColumnRightButton(browser)
        expect(await btn.isEnabled()).to.be.true
    });
});

export {}; // see: https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files