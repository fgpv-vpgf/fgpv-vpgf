class RAMPage {
    /**
     * Returns the first layer button in the legend panel.
     */
    get legendLayer() {
        return browser.element('rv-legend-control button');
    }
}

module.exports = RAMPage;
