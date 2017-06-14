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

    /**
     * Utility for triggering an event and giving it to the listeners
     *
     * @function _fireEvent
     * @private
     * @param {Array} handlerArray      array of event handler functions
     * @param {...Object} eventParams   arbitrary set of parameters to pass to the event handler functions
     */
    _fireEvent (handlerArray, ...eventParams) {
        // if we don't copy the array we could be looping on an array
        // that is being modified as it is being read
        handlerArray.slice(0).forEach(l => l(...eventParams));
    }

}

module.exports = () => ({
    Root
});
