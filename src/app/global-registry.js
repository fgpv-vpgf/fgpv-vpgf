'use strict';

import geoapi from 'geoApi';

/**
 * These are global values defined in the RV registry. They can be overridden by creating a global `RV` object with the same properties __before__ `injector.js` is executed.
 */
const rvDefaults = {
    dojoURL: '//js.arcgis.com/3.22/init.js' // layer loading functionality breaks in 3.23/24
};

/**
 * @global
 * @name RV
 * @desc The global object for the viewer.  Used for providing an API to the surrounding page.
 */
// check if the global RV registry object already exists
if (typeof window.RV === 'undefined') {
    window.RV = {};
}

const RV = window.RV; // just a reference

// apply default values to the global RV registry
Object.keys(rvDefaults)
    .forEach(key => applyDefault(key, rvDefaults[key]));

// initialize gapi and store a return promise
RV.gapiPromise = geoapi(RV.dojoURL, window);

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

class BasePlugin {
    get id () { return this._id; }
    set id (id) { this._id = id; }

    get api () { return this._api; }

    set translations (t) { this._translations = t; }
    get translations () { return this._translations; }

    setTranslatableProp (name, value) {
        this[name] = 'plugin.' + this.id + '.' + value;
    }

    constructor (pluginID, api) {
        this.id = pluginID;
        this._api = api;
    }
}

class MenuItem extends BasePlugin {
    get type () { return 'link'; }

    get action () { return this._action; }
    set action (a) { this._action = a; }

    set name (n) { this.setTranslatableProp('_name', n); }
    get name () { return this._name; }
}

RV.BasePlugins = {
    MenuItem
};

RV.Plugins = {};
