class RAMPage {
    /**
     * Returns the first layer button in the legend panel.
     */
    get legendLayer() {
        return $('rv-legend-control > button');
    }

    /**
     * Returns the toggle visibility button of the first layer in the legend panel.
     */
    get toggleButton() {
        return $('.data-test-toggle-button');
    }

    /**
     * Returns the button that toggles the symbology stack of the first layer in the legend panel.
     */
    get expandSymbologyStackButton() {
        return $('.rv-symbol-trigger');
    }

    /**
     * Returns the first toggle symbology button of the first layer in the legend panel.
     */
    get toggleSymbologyButton() {
        return $('.data-test-symbol-toggle-button');
    }
}

module.exports = RAMPage;
