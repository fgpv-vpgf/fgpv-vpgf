(() => {
    /**
     * Dynamically injects the main viewer script and styles references.
     * TODO: need to check how viewer works if there is already a version of jQuery on the page; maybe load a jQuery-less version of the viewer then.
     * Reference on script loading: http://www.html5rocks.com/en/tutorials/speed/script-loading/
     */
    const URLs = {
        jQuery: 'http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.2.1.min.js',
        dataTables: 'https://cdn.datatables.net/1.10.11/js/jquery.dataTables.min.js'
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

    // append proper srcs to scriptsArray
    if (!window.jQuery) {
        // TODO: should we use a local file here instead?
        scriptsArr.push(URLs.jQuery, URLs.dataTables);
    } else if (!$.fn.dataTable) {
        scriptsArr.push(URLs.dataTables);
    }
    scriptsArr.push(`${repo}/core.js`);

    scriptsArr.forEach(src => {
        const currScript = d.createElement('script');
        currScript.src = src;
        currScript.async = false;
        currScript.type = 'text/javascript';
        bodyNode.appendChild(currScript);
    });

    // check if the global RV registry object already extists
    if (typeof window.RV === 'undefined') {
        window.RV = {};
    }

    const RV = window.RV; // just a reference

    // "private" registry of map proxies
    const _mapRegistry = [];
    RV._mapRegistry = _mapRegistry;
    RV.getMap = getMap;

    // appeasing this rule makes the code fail disallowSpaceAfterObjectKeys
    /* jscs:disable requireSpacesInAnonymousFunctionExpression */
    const mapProxy = {
        _appInstance: null,

        _proxy(action, ...args) {
            this._appInstance.then(appInstance =>
                appInstance[action](...args)
            );
        },

        loadRcsLayers(keys) {
            this._proxy('loadRcsLayers', keys);
        },

        setLanguage(lang) {
            this._proxy('setLanguage', lang);
        },

        _init() {
            this._appInstance = new Promise((resolve) => {
                // store a callback function in the proxy object itself for map instances to call upon readiness
                this._registerMap = appInstance => {
                    // store actual instance of the map; after this point, all queued calls to `addRcsLayer`, `switchLanguage`, etc. will trigger
                    resolve(appInstance);
                };
            });

            return this;
        }
    };
    /* jshint:enable requireSpacesInAnonymousFunctionExpression */

    const nodes = Array.from(document.getElementsByClassName('fgpv'));
    let counter = 0;

    nodes.forEach(node => {

        if (!node.getAttribute('id')) {
            node.setAttribute('id', 'rv-app-' + counter++);
        }

        _mapRegistry[node.getAttribute('id')] = Object.create(mapProxy)._init();
    });

    /***/

    // external "sync" function to retrieve a map instance
    // in reality it returns a map proxy queueing calls to the map until it's ready
    function getMap(id) {
        return _mapRegistry[id];
    }
})();
