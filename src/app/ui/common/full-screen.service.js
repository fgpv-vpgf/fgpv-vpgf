import screenfull from 'screenfull';
/**
 * @module fullScreenService
 * @memberof app.ui
 *
 * Provides ability to place this viewer into fullscreen mode, and whether it is actively in fullscreen mode.
 */
angular
    .module('app.ui')
    .factory('fullScreenService', fullScreenService);

function fullScreenService($rootElement, configService, $interval, $rootScope, events) {
    const service = {
        toggle,
        isExpanded: () => screenfull.isFullscreen && $(screenfull.element).is($rootElement)
    };

    let lastChangedElement = $rootElement;
    let lastKnownCenter;
    let stopInterval;

    screenfull.on('change', onChange);

    $rootScope.$on(events.rvMapLoaded, (_, i) => {
        configService.getSync.map.instance.fullscreen = fs => {
            if ((service.isExpanded() && !fs) || (!service.isExpanded() && fs)) {
                service.toggle();
            }
        };
    });

    return service;

    function toggle() {
        $rootElement.css('position', (screenfull.isFullscreen ? 'relative' : 'static'));
        lastKnownCenter = configService.getSync.map.instance.extent.getCenter();
        screenfull.toggle($rootElement[0]);
    }

    function onChange() {
        // since this event fires for all viewers on a page, we keep track of the last element that went fullscreen
        lastChangedElement = screenfull.isFullscreen ? $(screenfull.element) : lastChangedElement;
        // only execute changes if this map instance was the last fullscreen map
        if (lastChangedElement.is($rootElement)) {
            // give browser/esri some time to update center, time it will take is unknown (roughly 0.5s to 1s)
            stopInterval = $interval(centerMap, 100);
            centerMap(); // invoke immediately just in case the transition was faster than 100ms
        }
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
