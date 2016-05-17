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
     * if we have version X.Y.Z, and we're comparing to A.B.C
     * Their version is bigger if and only if
     * A > X OR A = X and B > Y OR A = X and B = Y and C > Z
     *
     * Swap out '>' with '<' for seeing if their version is smaller
     *
     * @param  {String} ourVersion      our version of the script
     * @param  {String} theirVersion    their version of the script
     * @param  {String} scriptName      the name of the script
     */
    function versionCheck(ourVersion, theirVersion, scriptName) {
        ourVersion = ourVersion.split('.');
        const versionDiff = theirVersion.split('.').map((x, index) => parseInt(x) - ourVersion[index]);

        if (versionDiff[0] > 0 || versionDiff[0] === 0 && versionDiff[1] > 0 ||
            versionDiff[0] === 0 && versionDiff[1] === 0 && versionDiff[2] > 0) {

            console.warn(`The current ${scriptName} version is more recent than expected for the viewer; ` +
                         `expected: ${versions.jQuery}`);
        } else if (versionDiff[0] < 0 || versionDiff[0] === 0 && versionDiff[1] < 0 ||
                versionDiff[0] === 0 && versionDiff[1] === 0 && versionDiff[2] < 0) {

            console.warn(`The current ${scriptName} version is older than expected for the viewer; ` +
                         `expected: ${versions.jQuery}`);
        }
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
        window.RV = {};
    }

    const RV = window.RV; // just a reference

    // registry of map proxies
    const mapRegistry = [];
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
            this._appInstance = new Promise((resolve) =>
                // store a callback function in the proxy object itself for map instances to call upon readiness
                this._registerMap = appInstance =>
                    // resolve with the actual instance of the map;
                    // after this point, all queued calls to `loadRcsLayers`, `setLanguage`, etc. will trigger
                    resolve(appInstance)
            );

            return this;
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

        mapRegistry[node.getAttribute('id')] = Object.create(mapProxy)._init(node);
    });

    /***/

    // external "sync" function to retrieve a map instance
    // in reality it returns a map proxy queueing calls to the map until it's ready
    function getMap(id) {
        return mapRegistry[id];
    }
})();
