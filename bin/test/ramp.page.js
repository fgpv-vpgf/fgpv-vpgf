class RAMPage {
    /**
     * Returns the first layer button in the legend panel.
     */
    get legendLayer() {
        return browser.element('rv-legend-control button');
    }

    /**
     * Returns the toggle visibility button of the first layer in the legend panel.
     */
    get toggleButton() {
        return browser.element('.data-test-toggle-button');
    }

    /**
     * Returns the button that toggles the symbology stack of the first layer in the legend panel.
     */
    get expandSymbologyStackButton() {
        return browser.element('.rv-symbol-trigger');
    }

    /**
     * Returns the first toggle symbology button of the first layer in the legend panel.
     */
    get toggleSymbologyButton() {
        return browser.element('.data-test-symbol-toggle-button');
    }
}

module.exports = RAMPage;
