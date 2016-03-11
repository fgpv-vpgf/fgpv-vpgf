/* global geoapi */
(() => {

    /**
     * These are global values defined in the RV registry. They can be overridden by creating a global `RV` object with the same properties __before__ `injector.js` is executed.
     */
    const rvDefaults = {
        dojoURL: 'http://js.arcgis.com/3.14/'
    };

    // check if the global RV registry object already extists
    if (typeof window.RV === 'undefined') {
        window.RV = {};
    }

    const RV = window.RV; // just a reference

    // apply default values to the global RV registry
    Object.keys(rvDefaults)
        .forEach(key => applyDefault(key, rvDefaults[key]));

    // initialize gapi and store a return promise
    RV.gapiPromise = geoapi(RV.dojoURL, window);

    /***/

    /**
     * Checks if a property is already set and applies the default.
     * @param  {String} name  property name
     * @param  {String|Object|Number} value default value
     */
    function applyDefault(name, value) {
        if (typeof RV[name] === 'undefined') {
            RV[name] = value;
        }
    }
})();
