const sidePanelPage = require('./sidePanel-page.js');

describe('Side Navigation', function() {
    const sidePanel = new sidePanelPage();
    it('should open when clicked from the Menu Bar', function() {
        sidePanel.open();
        expect(sidePanel.el.element(by.css('button')).isDisplayed()).toBeTruthy();
    });
});