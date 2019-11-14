'use strict';

/**
 * @class Root
 */
class Root {
    // the thing every thing else inherits from.
    // thing in here should be applicable to both layer-ish classes (including FCs),
    // and legend-ish classes.

    constructor () {
        // TODO maybe pass in config, store it?

        this._name = '';
    }

    // everyone needs a name
    get name () { return this._name; }
    set name (value) { this._name = value; }

    get symbology () { return this._symbology; }
    set symbology (value) { this._symbology = value; }

    get extent () { return this._extent; }
    set extent (value) { this._extent = value; }

}

module.exports = () => ({
    Root
});
