(() => { // jshint ignore:line
    // disabled checks on above line due to 'too many statements in this function' (jshint W071)

    /**
     * Dynamically injects the main viewer script and styles references.
     * TODO: need to check how viewer works if there is already a version of jQuery on the page; maybe load a jQuery-less version of the viewer then.
     * Reference on script loading: http://www.html5rocks.com/en/tutorials/speed/script-loading/
     */

    // versions of scripts to inject
    const versions = {
        jQuery: '2.2.1',
        dataTables: '1.10.11'
    };
    const URLs = {
        jQuery: `http://ajax.aspnetcdn.com/ajax/jQuery/jquery-${versions.jQuery}.min.js`,
        dataTables: `https://cdn.datatables.net/${versions.dataTables}/js/jquery.dataTables.min.js`
    };
    const d = document;
    const scripts = d.getElementsByTagName('script'); // get scripts

    // TODO: make more robust; this way of getting script's url might break if the `asyn` attribute is added on the script tag
    const seedUrl = scripts[scripts.length - 1].src; // get the last loaded script, which is this
    const repo = seedUrl.substring(0, seedUrl.lastIndexOf('/'));

    const headNode = d.getElementsByTagName('head')[0];
    const bodyNode = d.getElementsByTagName('body')[0];

    // inject styles
    const stylesLink = d.createElement('link');
    stylesLink.href = `${repo}/main.css`;
    stylesLink.type = 'text/css';
    stylesLink.rel = 'stylesheet';
    stylesLink.media = 'screen,print';

    headNode.appendChild(stylesLink);

    // inject fonts
    const fontsLink = d.createElement('link');
    fontsLink.href = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic';
    fontsLink.rel = 'stylesheet';

    headNode.appendChild(fontsLink);

    const scriptsArr = [];

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
        ourVersion = ourVersion.split('.');
        const versionDiff = theirVersion.split('.')
            // compare the two versions
            .map((x, index) => parseInt(x) - ourVersion[index])
            // find first non-equal part
            .find(x => x !== 0);

        if (typeof versionDiff === 'undefined') {
            // the versions were equal
            return;
        }
        const fillText = versionDiff > 0 ? 'more recent' : 'older';
        console.warn(`The current ${scriptName} version is ${fillText} than expected for the viewer; ` +
                        `expected: ${versions.jQuery}`);
    }

    // append proper srcs to scriptsArray
    if (!window.jQuery) {
        // TODO: should we use a local file here instead?
        scriptsArr.push(URLs.jQuery, URLs.dataTables);
    } else if (!$.fn.dataTable) {
        scriptsArr.push(URLs.dataTables);
        versionCheck(versions.jQuery, $.fn.jquery, 'jQuery');
    } else {
        versionCheck(versions.jQuery, $.fn.jquery, 'jQuery');
        versionCheck(versions.dataTables, $.fn.dataTable.version, 'dataTable');
    }

    scriptsArr.push(`${repo}/core.js`);

    scriptsArr.forEach(src => {
        const currScript = d.createElement('script');
        currScript.src = src;
        currScript.async = false;
        currScript.type = 'text/javascript';
        bodyNode.appendChild(currScript);
    });

    // check if the global RV registry object already exists
    if (typeof window.RV === 'undefined') {
        window.RV = {
            getMap,
            debug: {},
            _nodes: null
        };
    }

    const RV = window.RV; // just a reference

    // registry of map proxies
    const mapRegistry = [];

    // appeasing this rule makes the code fail disallowSpaceAfterObjectKeys
    /* jscs:disable requireSpacesInAnonymousFunctionExpression */
    const mapProxy = {
        _appPromise: null,
        _initAppPromise: null,

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

        loadRcsLayers(keys) {
            this._proxy('loadRcsLayers', keys);
        },

        setLanguage(lang) {
            this._proxy('setLanguage', lang);
        },

        getBookmark() {
            return this._proxy('getBookmark');
        },

        useBookmark(bookmark) {
            this._proxy('useBookmark', bookmark);
        },

        initialBookmark(bookmark) {
            this._initProxy('initialBookmark', bookmark);
        },

        centerAndZoom(x, y, spatialRef, zoom) {
            this._proxy('centerAndZoom', x, y, spatialRef, zoom);
        },

        _init() {
            this._appPromise = new Promise(resolve =>
                // store a callback function in the proxy object itself for map instances to call upon readiness
                this._registerMap = appInstance =>
                    // resolve with the actual instance of the map;
                    // after this point, all queued calls to `loadRcsLayers`, `setLanguage`, etc. will trigger
                    resolve(appInstance)
            );

            this._initAppPromise = new Promise(resolve =>
                // store a callback function in the proxy object itself for map instances to call upon readiness
                this._registerPreLoadApi = appInstance =>
                    // resolve with the actual instance of the map;
                    // after this point, all queued calls to `loadRcsLayers`, `setLanguage`, etc. will trigger
                    resolve(appInstance)
            );

            return this;
        },

        _deregisterMap() {
            this._init();
        }
    };
    /* jshint:enable requireSpacesInAnonymousFunctionExpression */

    // convert html collection to array:
    // https://babeljs.io/docs/learn-es2015/#math-number-string-object-apis
    const nodes = [].slice.call(document.getElementsByClassName('fgpv'));

    // store nodes to use in app-seed; avoids a second DOM traversal
    RV._nodes = nodes;

    let counter = 0;

    nodes.forEach(node => {

        if (!node.getAttribute('id')) {
            node.setAttribute('id', 'rv-app-' + counter++);
        }

        // create debug object for each app instance
        RV.debug[node.getAttribute('id')] = {};

        mapRegistry[node.getAttribute('id')] = Object.create(mapProxy)._init(node);
    });

    /***/

    // external "sync" function to retrieve a map instance
    // in reality it returns a map proxy queueing calls to the map until it's ready
    function getMap(id) {
        return mapRegistry[id];
    }
})();

(function() {
    'use strict';

    const RV = window.RV; // just a reference
    RV.debug._trackFocus = trackFocusBuilder();

    /**
     * Builds a focus tracking debug option.
     * @function trackFocusBuilder
     * @private
     * @return function  enables/disabled focus/blur event tracking on the page; this function accepts a boolean - `true` enables tracking; `false`, disables it
     */
    function trackFocusBuilder() {
        let lastActiveElement = document.activeElement;

        let isActive = false;

        return () => {
            isActive = !isActive;
            if (isActive) {
                console.debug('trackFocus is enabled.');
                attachEvents();
            } else {
                console.debug('trackFocus is disabled.');
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
            console.debug('[trackFocus]: blur', document.activeElement, event, isSameActiveElement());
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
            console.debug('[trackFocus]: focus', document.activeElement, event, isSameActiveElement());
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
}());
