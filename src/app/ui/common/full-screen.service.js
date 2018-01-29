import screenfull from 'screenfull';

const FULL_SCREEN_Z_INDEX = 50;
// README: this is a simplest solution to https://github.com/fgpv-vpgf/fgpv-vpgf/issues/671
// Angular Material uses z-index of 100 for the drop-menu, setting app's z-index below that will allow for the menu to show up while still blocking the host page
// There might be a problem if the host page uses z-indexes larger than 50 or 100, in which case full-screen would not work.
// A more complete solution would be to override $z-index- variables defined in Angular Material with higher values and up z-index here as well.
// There seems to be some of the z-index- in Angular Material which are not derived from variables (in version 1.0.5);
// This should be revisited after upgrading Angular Material or in case additional bug reports (host page having higher z-index for example)

/**
 * @module fullScreenService
 * @memberof app.ui
 *
 * Provides ability to place this viewer into fullscreen mode, and whether it is actively in fullscreen mode.
 */
angular
    .module('app.ui')
    .factory('fullScreenService', fullScreenService);

function fullScreenService($rootElement, configService, $interval, events) {
    const service = {
        toggle,
        isExpanded: () => screenfull.isFullscreen && $(screenfull.element).is(angular.element('body'))
    };

    let lastChangedElement = $rootElement;
    let lastKnownCenter;
    let stopInterval;

    // override default brower full screen exiting action
    document.addEventListener('fullscreenchange', exitFullScreenHandler);
    document.addEventListener('webkitfullscreenchange', exitFullScreenHandler);
    document.addEventListener('mozfullscreenchange', exitFullScreenHandler);
    document.addEventListener('MSFullscreenChange', exitFullScreenHandler);

    events.$on(events.rvMapLoaded, (_, i) => {
        configService.getSync.map.instance.fullscreen = fs => {
            if ((service.isExpanded() && !fs) || (!service.isExpanded() && fs)) {
                service.toggle();
            }
        };
    });

    return service;

    /**
     * Handler browser full screen exiting event
     *
     * @function exitFullScreenHandler
     */
    function exitFullScreenHandler() {
        if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
            _exitFullScreen();
        }
    }

    /**
     * Toggle full screen mode
     *
     * @function toggle
     */
    function toggle() {
        if (screenfull.isFullscreen) {
            _exitFullScreen();
        } else {
            _enterFullScreen();
        }
    }

    /**
     * Modify elements needed in entering full screen
     *
     * @function _enterFullScreen
     * @private
     */
    function _enterFullScreen() {
        lastKnownCenter = configService.getSync.map.instance.extent.getCenter();
        const body = angular.element('body');
        const shellNode = angular.element('rv-shell');
        body.attr('style', 'width: 100%; height: 100%');
        $rootElement.attr('style', `overflow: visible; z-index: ${FULL_SCREEN_Z_INDEX};`);
        shellNode.attr('style', `position: fixed; margin: 0; z-index: ${FULL_SCREEN_Z_INDEX};`);
        angular.element('body').addClass('rv-full-screen');
        screenfull.toggle(body[0]);
        onChange();
    }

    /**
     * Modify elements needed in entering full screen
     *
     * @function _exitFullScreen
     * @private
     */
    function _exitFullScreen() {
        lastKnownCenter = configService.getSync.map.instance.extent.getCenter();
        const body = angular.element('body');
        const shellNode = angular.element('rv-shell');
        body.attr('style', '');
        $rootElement.attr('style', '');
        shellNode.attr('style', '');
        angular.element('body').removeClass('rv-full-screen');
        screenfull.toggle(body[0]);
        onChange();
    }

    function onChange() {
        // give browser/esri some time to update center, time it will take is unknown (roughly 0.5s to 1s)
        stopInterval = $interval(centerMap, 100);
        centerMap(); // invoke immediately just in case the transition was faster than 100ms
    }

    /**
     * Re-centers the map iff the center has changed anytime after the fullscreen toggle has been called.
     */
    function centerMap() {
        const cntr = configService.getSync.map.instance.extent.getCenter();
        if (lastKnownCenter.x !== cntr.x || lastKnownCenter.y !== cntr.y) {
            configService.getSync.map.instance.centerAt(lastKnownCenter);
            $interval.cancel(stopInterval);
        }
    }

}
