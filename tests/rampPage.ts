export function legendLayer() {
    return async function() {
        return await this.parent.findByCssSelector('rv-legend-control > button');
    }
}

export function toggleButton() {
    return async function() {
        return await this.parent.findByCssSelector('.data-test-toggle-button');
    }
}

export function expandSymbologyStackButton() {
    return async function() {
        return await this.parent.findByCssSelector('.rv-symbol-trigger');
    }
}

export function toggleSymbologyButton() {
    return async function() {
        return await this.parent.findByCssSelector('.data-test-symbol-toggle-button');
    }
}