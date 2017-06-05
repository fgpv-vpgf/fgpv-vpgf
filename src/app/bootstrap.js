$('head').append('<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic" type="text/css" />');

const customAttrs = ['config', 'langs', 'service-endpoint', 'restore-bookmark', 'wait', 'keys', 'fullpage-app'];

// eslint-disable-next-line max-statements
// disabled checks on above line due to 'too many statements in this function' (jshint W071)

// TODO: find out where logging library went...
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
    viewerElements: [],
    debug: {},
    _deferredPolyfills: RV._deferredPolyfills || [] // holds callback for any polyfills or patching that needs to be done after the core.js is loaded
});

$('[is=rv-map]').each((index, v) => {
    let appID = v.getAttribute('id');
    RV.debug[appID] = {}; // create debug object for each app instance
    RV.viewerElements.push(v);

    if (!appID) {
        appID = `rv-app-${index}`;
        v.setAttribute('id', appID);
    }

    v.setAttribute('rv-trap-focus', appID);

    // basic touch device detection; if detected set rv-touch class so that touch mode is on by default
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        v.className += ' rv-touch';
    }

    customAttrs
        .filter(attrName => v.getAttribute(`data-rv-${attrName}`))
        .forEach(attrName => {
            v.setAttribute(`rv-${attrName}`, v.getAttribute(`data-rv-${attrName}`)); // getAttribute returns a string so data-rv-fullscreen-app="false" will copy correctly
            v.removeAttribute(`data-rv-${attrName}`);
    });
});

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
