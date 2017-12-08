/* global Logdown */
// eslint-disable-next-line max-statements

import geoapi from 'geoApi';

// check if window.RV has been created by ie-polyfills already, otherwise init
const RV = window.RV = window.RV ? window.RV : {};

// fixes logger issue where it can be called before it is loaded, this reverts it to console
// TODO: load logger lib before app starts
RV.logger = console;

// test user browser, true if IE false otherwise
RV.isIE = /Edge\/|Trident\/|MSIE /.test(window.navigator.userAgent);

// Safari problem with file saver: https://github.com/eligrey/FileSaver.js/#supported-browsers
// test if it is Safari browser on desktop and it if is, show a message to let user know we can't automatically save the file
// they have to save it manually the same way as when the canvas is tainted.
RV.isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent) &&
    !/(iPhone|iPod|iPad)/i.test(navigator.platform);

// set these outside of the initial creation in case the page defines RV for setting
// properties like dojoURL
Object.assign(RV, {
    getMap,
    ready,
    allScriptsLoaded: false,
    debug: {},
    _nodes: null,
    _deferredPolyfills: RV._deferredPolyfills || [] // holds callback for any polyfills or patching that needs to be done after the core.js is loaded
});

RV._deferredPolyfills.forEach(dp => dp());

const customAttrs = ['config', 'langs', 'service-endpoint', 'restore-bookmark', 'wait', 'keys', 'fullpage-app'];

const d = document;
const scripts = d.getElementsByTagName('script'); // get scripts

// TODO: make more robust; this way of getting script's url might break if the `asyn` attribute is added on the script tag
const seedUrl = scripts[scripts.length - 1].src; // get the last loaded script, which is this
const headNode = d.getElementsByTagName('head')[0];

// inject fonts
const fontsLink = d.createElement('link');
fontsLink.href = '//fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic';
fontsLink.rel = 'stylesheet';
headNode.appendChild(fontsLink);

// registry of map proxies
const mapRegistry = [];
let readyQueue = []; // array of callbacks waiting on script loading to complete

const mapProxy = {
    _appPromise: null,
    _initAppPromise: null,
    appID: null,

    _proxy(action, ...args) {
        return this._appPromise.then(appInstance =>
            appInstance[action](...args)
        );
    },

    _initProxy(action, ...args) {
        return this._initAppPromise.then(appInstance =>
            appInstance[action](...args)
        );
    },

    /**
     * RCS layers to be loaded once the map has been instantiated.
     *
     * @function    loadRcsLayers
     * @param {Array}  keys  array of strings containing RCS keys to be added
     */
    loadRcsLayers(keys) {
        this._proxy('loadRcsLayers', keys);
    },

    /**
     * Reset the map by removing all layers after the map has been instantiated
     *
     * @function    resetMap
     */
    resetMap() {
        this._proxy('resetMap');
    },

    /**
     * Sets the translation language and reloads the map.
     *
     * @function    setLanguage
     * @param   {String}    lang    the new language to use
     */
    setLanguage(lang) {
        this._proxy('setLanguage', lang);
    },

    /**
     * Returns a bookmark for the current viewers state.
     *
     * @function    getBookmark
     * @returns     {Promise}    a promise that resolves to the bookmark containing the state of the viewer
     */
    getBookmark() {
        return this._proxy('getBookmark');
    },

    /**
     * useBookmark loads the provided bookmark into the map application. Unlike initialBookmark, it does not need to be the first bookmark loaded nor does it require `rv-wait` on the map DOM node. This method is typically triggered by user actions, taking priority over existing bookmarks.
     *
     * @function    useBookmark
     * @param   {String}    bookmark    bookmark containing the desired state of the viewer
     */
    useBookmark(bookmark) {
        this._proxy('useBookmark', bookmark);
    },

    /**
     * initialBookmark is intended to be the first bookmark loaded by the map application (for example, when a bookmark comes in the URL bar) and should only be used if the `rv-wait` attribute is set on the map DOM node.  `rv-wait` will inform the viewer to wait until an unblocking call like initialBookmark is called.
     *
     * If a useBookmark call happens to be triggered before initialBookmark it will take priority (useBookmark is typically triggered by user actions which should take priority over automated actions).
     *
     * @function    initialBookmark
     * @param   {String}    bookmark    bookmark containing the desired state of the viewer
     */
    initialBookmark(bookmark) {
        this._initProxy('initialBookmark', bookmark);
    },

    /**
     *  Updates the extent of the map by centering and zooming the map.
     *
     * @function    centerAndZoom
     * @param {Number} x                    The x coord to center on
     * @param {Number} y                    The y coord to center on
     * @param {Object} spatialRef           The spatial reference for the coordinates
     * @param {Number} zoom                 The level to zoom to
     */
    centerAndZoom(x, y, spatialRef, zoom) {
        this._proxy('centerAndZoom', x, y, spatialRef, zoom);
    },

    /**
     * Loads using a bookmark from sessionStorage (if found) and a keyList.
     *
     * @function    restoreSession
     * @param   {Array}     keys      array of strings containing RCS keys to load
     */
    restoreSession(keys) {
        this._initProxy('restoreSession', keys);
    },

    /**
     * Returns an array of ids for rcs added layers.
     *
     * @function    getRcsLayerIDs
     * @returns     {Promise}     a promise which resolves to a list of rcs layer ids
     */
    getRcsLayerIDs() {
        return this._proxy('getRcsLayerIDs');
    },

    /**
     * Registers a plugin with a viewer instance.
     * This function expects a minimum of two parameters such that:
     *   - the first parameter is a plugin class reference
     *   - the second parameter is a unique plugin id string
     * Any additional parameters will be passed to the plugins init method
     *
     * @function    registerPlugin
     */
    registerPlugin() {
        this._loadPromise.then(app => app.registerPlugin(...arguments));
    },

    /**
    * Provides data needed for the display of a north arrow on the map for lambert and mercator projections. All other projections
    * are not supported, however mapPntCntr and mapScrnCntr are still returned so that if needed, external API's can be created for
    * any projection type.
    *
    * The returned object has the following properties:
    *    projectionSupported    {boolean}   true iff current projection is lambert or mercator
    *    screenX                {Number}    left offset for arrow to intersect line between map center and north point
    *    angleDegrees           {Number}    angle derived from intersection of horizontal axis line with line between map center and north point
    *    rotationAngle          {Number}    number of degrees to rotate north arrow, 0 being none with heading due north
    *    mapPntCntr             {Object}    lat/lng of center in current extent
    *    mapScrnCntr            {Object}    pixel x,y of center in current extent
    *
    * @function  northArrow
    * @returns  {Object}    an object containing data needed for either static or moving north arrows
    */
    getNorthArrowData() {
        return this._proxy('northArrow');
    },

    /**
    * Provides data needed for the display of a map coordinates on the map in latitude/longitude (degree, minute, second and decimal degree).
    *
    * The returned array can contain 2 items:
    *   if spatial reference ouput = 4326 (lat/long)
    *    [0]           {String}    lat/long in degree, minute, second (N/S) | lat/long in degree, minute, second (E/W)
    *    [1]           {String}    lat/long in decimal degree (N/S)| lat/long in decimal degree (E/W)
    *   otherwise
    *    [0]           {String}    number (N/S)
    *    [1]           {String}    number (E/W)
    *
    * @function  mapCoordinates
    * @returns  {Array}    an array containing data needed for map coordinates
    */
    getMapCoordinates() {
        return this._proxy('mapCoordinates');
    },


    /**
    * reinitial when a new config file is loaded
    * @function  reInitialize
    * @param {String} bookmark     The new bookmark when config is reloaded
    */
    reInitialize(bookmark = null) {
        this._proxy('reInitialize', bookmark);
    },

    _init(appID) {
        this.appID = appID;

        this._appPromise = new Promise(resolve =>
            // store a callback function in the proxy object itself for map instances to call upon readiness
            (this._registerMap = appInstance =>
                // resolve with the actual instance of the map;
                // after this point, all queued calls to `loadRcsLayers`, `setLanguage`, etc. will trigger
                resolve(appInstance))
        );

        // this promise waits to be resolved by the rvReady event on the angular side
        // unlike the other promises this is only resolved once during the page load cycle
        if (typeof this._loadPromise === 'undefined') {
            this._loadPromise = new Promise(resolve =>
                // store a callback function in the proxy object itself for map instances to call upon readiness
                (this._applicationLoaded = appInstance => resolve(appInstance))
            );
        }

        this._initAppPromise = new Promise(resolve =>
            // store a callback function in the proxy object itself for map instances to call upon readiness
            (this._registerPreLoadApi = appInstance =>
                // resolve with the actual instance of the map;
                // after this point, all queued calls to `loadRcsLayers`, `setLanguage`, etc. will trigger
                resolve(appInstance))
        );

        return this;
    },

    _deregisterMap() {
        this._init();
    }
};

const nodes = [].slice.call(document.querySelectorAll('[is=rv-map]'));
nodes.filter(node => nodes.indexOf(node) === -1).forEach(node => nodes.push(node));

// store nodes to use in app-seed; avoids a second DOM traversal
RV._nodes = nodes;

let counter = 0;

nodes.forEach(node => {

    let appId = node.getAttribute('id');

    customAttrs
        .filter(attrName => node.getAttribute(`data-rv-${attrName}`))
        .forEach(attrName => {
            node.setAttribute(`rv-${attrName}`, node.getAttribute(`data-rv-${attrName}`)); // getAttribute returns a string so data-rv-fullscreen-app="false" will copy correctly
            node.removeAttribute(`data-rv-${attrName}`);
        });

    if (!appId) {
        appId = 'rv-app-' + counter++;
        node.setAttribute('id', appId);
    }

    node.setAttribute('rv-trap-focus', appId);

    // basic touch device detection; if detected set rv-touch class so that touch mode is on by default
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        node.className += ' rv-touch';
    }

    // create debug object for each app instance
    RV.debug[appId] = {};

    mapRegistry[appId] = Object.create(mapProxy)._init(appId);
});

/**
 * The following enhancements are applied to make Logdown better for our use cases:
 *      1) Allows log prefixes to be added as the first argument to a logging function
 *         For example, RV.logger.warn('focusManager', 'is the best');
 *         Normally, prefixes cannot be defined after a Logdown instance is created. We correct this
 *         by wrapping console functions such that Logdown instances are created after the console message is executed.
 *
 *      2) We correct an issue where Logdown does not retrieve a pre-existing instance by prefix name, which causes prefix
 *         instances with the same name to have multiple colors.
 *
 * @function    enhanceLogger
 * @param       {Array}  enabledMethods    an array of console function string names like log, debug, warn that should be displayed
 * @return {Object} the logger object
 */
function enhanceLogger(enabledMethods = []) {
    const methods = ['debug', 'log', 'info', 'warn', 'error'];
    const logger = {};

    methods.forEach(type => {
        logger[type] = function() {
            const args = [].slice.call(arguments);
            if (enabledMethods.indexOf(type) !== -1) {
                getLogdownInstance(args.splice(0, 1)[0])[type](...args);
            }
        };
    });
    return logger;
}

/**
 * Logdown should return an existing instance of a logger if it finds one with matching prefixes. However, there seems to be a bug
 * where logdown does not trim() its prefix search when alignOutput is true - the extra spaces cause the error. So we manually try
 * to find instances and only create a new one if one if not found.
 *
 * @function    getLogdownInstance
 * @param       {String}  prefix    the name/prefix of the logger instance
 * @return {Object} an instance of the logdown logger
 */
function getLogdownInstance(prefix) {
    let logger = Logdown._instances.find(ld => ld.opts.prefix.trim() === prefix);
    // logger for prefix was not found, create a new one
    if (!logger) {
        logger = new Logdown({ prefix, alignOutput: true });
    }

    return logger;
}

/**
 * Called to buffer code until the library code has been fully loaded.  Behaves similar to jQuery style DOM ready events.
 * @function
 * @param {Function} callBack a function to be called once the library is loaded
 */
function ready(callBack) {
    if (RV.allScriptsLoaded) {
        callBack();
    } else {
        readyQueue.push(callBack);
    }
}

/**
 * Fires all callbacks waiting on the ready event and empties the callback queue.
 * @private
 */
function fireRvReady() {
    readyQueue.forEach(cb => cb());
    readyQueue = [];
}

// external "sync" function to retrieve a map instance
// in reality it returns a map proxy queueing calls to the map until it's ready
function getMap(id) {
    return mapRegistry[id];
}

/**
 * Compares two versions of a script, prints warnings to the console if the versions are not the same
 *
 * @private
 * @function versionCheck
 * @param  {String} ourVersion      our version of the script
 * @param  {String} theirVersion    their version of the script
 * @param  {String} scriptName      the name of the script
 */
function versionCheck(ourVersion, theirVersion, scriptName) {
    const ourVersionSplit = ourVersion.split('.');
    const versionDiff = theirVersion.split('.')
        // compare the two versions
        .map((x, index) => parseInt(x) - ourVersionSplit[index])
        // find first non-equal part
        .find(x => x !== 0);

    if (typeof versionDiff === 'undefined') {
        // the versions were equal
        return;
    }

    const warningMessgage = `${scriptName} ${theirVersion} is detected ` +
        `(${ versionDiff > 0 ? 'more recent' : 'older' } that expected ${ourVersion} version). ` +
        `No tests were done with this version. The viewer might be unstable or not work correctly.`;

    console.warn(warningMessgage);
}

RV.debug._trackFocus = trackFocusBuilder();

/**
 * Builds a focus tracking debug option.
 * @function trackFocusBuilder
 * @private
 * @return {Function} enables/disabled focus/blur event tracking on the page; this function accepts a boolean - `true` enables tracking; `false`, disables it
 */
function trackFocusBuilder() {
    let lastActiveElement = document.activeElement;

    let isActive = false;

    return () => {
        isActive = !isActive;
        if (isActive) {
            RV.logger.debug('trackFocus', 'Enabled');
            attachEvents();
        } else {
            RV.logger.debug('trackFocus', 'Disabled');
            detachEvents();
        }
    };

    /***/

    /**
     * Logs blur events.
     * @function detectBlur
     * @private
     * @param  {Object} event blur event
     */
    function detectBlur(event) {
        // Do logic related to blur using document.activeElement;
        // You can do change detection too using lastActiveElement as a history
        RV.logger.debug('trackFocus', 'blur detected', document.activeElement, event, isSameActiveElement());
    }

    /**
     * Checks if the currently active element is the same as the previosly focused one.
     * @function isSameActiveElement
     * @private
     * @return {Boolean} true if it's the same object
     */
    function isSameActiveElement() {
        let currentActiveElement = document.activeElement;
        if (lastActiveElement !== currentActiveElement) {
            lastActiveElement = currentActiveElement;
            return false;
        }

        return true;
    }

    /**
     * Logs focus events.
     * @function detectFocus
     * @private
     * @param  {Object} event focus event
     */
    function detectFocus(event) {
        // Add logic to detect focus and to see if it has changed or not from the lastActiveElement.
        RV.logger.debug('trackFocus', 'focus detected', document.activeElement, event, isSameActiveElement());
    }

    /**
     * Attaches listeners to the window to listen for focus and blue events.
     * @function attachEvents
     * @private
     */
    function attachEvents() {
        window.addEventListener('focus', detectFocus, true);
        window.addEventListener('blur', detectBlur, true);
    }

    /**
     * Detaches focus and blur listeners from the window.
     * @function detachEvents
     * @private
     */
    function detachEvents() {
        window.removeEventListener('focus', detectFocus, true);
        window.removeEventListener('blur', detectBlur, true);
    }
}
