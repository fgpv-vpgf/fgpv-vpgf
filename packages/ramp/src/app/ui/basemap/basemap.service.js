/**
 * @module basemapService
 * @memberof app.ui
 * @description
 *
 * The `basemapService` is responsible for providing a list of selectable basemaps, and tracking
 * the currently selected basemap.
 *
 */
angular
    .module('app.ui')
    .factory('basemapService', basemapService);

function basemapService($rootElement, $mdSidenav, $q) {

    let closePromise;

    const service = {
        open,
        close,
        toggle,
        isOpen,
        onClose: () => closePromise // returns promise that resolves when panel has closed (by any means)
    };

    return service;

    /**
     * Opens basemap panel.
     * @function open
     * @return  {Promise}   resolves to undefined when panel animation is complete
     */
    function open() {
        closePromise = $q($mdSidenav('right').onClose)
            .then(() => setOtherChromeOpacity(1));

        setOtherChromeOpacity(0.2);

        // close the side menu
        $mdSidenav('left').close();

        return $mdSidenav('right')
            .open()
            // Once the side panel is open, set focus on the panel
            .then(() => $('md-sidenav[md-component-id="right"] button').first().rvFocus());

        /**
         * Makes all other chrome almost transparent so the basemap is more clearly visible
         * @function setOtherChromeOpacity
         * @private
         */
        function setOtherChromeOpacity(opacity) {
            $rootElement.find(`.panel-contents, rv-appbar`).css('opacity', opacity);
            $rootElement.find(`.rv-esri-map .layersDiv > *:not(:first)`).css('opacity', opacity);
        }
    }

    /**
     * Closes basemap panel.
     * @function close
     * @return  {Promise}   resolves to undefined when panel animation is complete
     */
    function close() {
        return $mdSidenav('right').close();
    }

    /**
     * Toggles basemap panel open/close.
     * @function toggle
     * @return  {Promise}   resolves to undefined when panel animation is complete
     */
    function toggle() {
        return isOpen() ? close() : open();
    }

    /**
     * Determines if the basemap panel is currently open/opening or closed/closing
     * @function toggle
     * @return  {Boolean}   true iff open/opening, false otherwise
     */
    function isOpen() {
        return $mdSidenav('right').isOpen();
    }
}
