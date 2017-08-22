/*eslint max-statements: ["error", 32]*/
/* global screenfull, RV */

import {Power1} from 'gsap';
import screenfull from 'screenfull';

const RV_DURATION = 0;
const RV_SWIFT_IN_OUT_EASE = Power1;
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
 * @requires $rootElement, $timeout, referenceService, gapiService
 * @description
 *
 * The `fullscreen` factory makes the map go "Boom!".
 *
 */
angular
    .module('app.ui')
    .factory('fullScreenService', fullScreenService);

function fullScreenService($rootElement, $timeout, referenceService, gapiService, animationService, configService, appInfo) {
    const ref = {
        isExpanded: false,
        toggleLock: false,
        tl: undefined,

        body: angular.element('body'),

        mapContainerNode: undefined,
        shellNode: undefined,
        shellNodeBox: undefined,

        trueCenterPoint: undefined
    };

    const service = {
        toggle,
        isExpanded: () => ref.isExpanded,
        isFullPageApp: () => configService.getAsync.then(conf => conf.fullscreen)
    };

    if (screenfull.enabled) {
        screenfull.onchange(() => toggle(true));
    } else {
        service.toggle = angular.noop;
    }

    return service;

    /***/

    /**
     * Toggles the full-screen state by running animation which expands the shell node to take over the entire page at the same time animating the map container node to the map centered in the expanding container; reverse animation works similarly.
     * @function toggle
     * @param   {Boolean}   autoToggle  true if toggle is caused by escape key in fullscreen mode, shoud be false otherwise
     */
    function toggle(autoToggle) {

        // if there are multiple viewers on the page screenfull.onchange will trigger in all viewers when one of them goes into fullscreen mode
        // avoid this by storing the actual fullscreen appID, if they don't match ignore the event
        if (!autoToggle) {
            RV._fullscreenToggleAppID = appInfo.id;
        } else if (RV._fullscreenToggleAppID !== appInfo.id) {
            return;
        }

        onComplete();
        // we handle two cases here:
        //    - The user enables/disables fullscreen mode via a button in the viewer
        //    - Fullscreen mode is disabled via the escape key
        if (ref.toggleLock) {
            ref.toggleLock = false;
            return;
        } else if (!autoToggle) {
            ref.toggleLock = true;
            screenfull.toggle();
        }

        // pause and kill currently running animation
        if (ref.tl) {
            ref.tl.pause().kill();
        }

        // store current center point of the map
        ref.trueCenterPoint = configService.getSync.map.instance.extent.getCenter();

        if (!ref.isExpanded) {

            ref.tl = animationService.timeLineLite({
                paused: true
            });

            // get the container of all map layers
            ref.mapContainerNode = referenceService.mapNode.find('> .container > .container');
            ref.shellNode = referenceService.panels.shell;
            ref.shellNodeBox = ref.shellNode[0].getBoundingClientRect();

            // make overflow on the root element visible so we can 'pop' the map shell out
            ref.tl.set($rootElement, {
                overflow: 'visible',
                'z-index': FULL_SCREEN_Z_INDEX
            });

            // pop out shell to make it ready for animation
            ref.tl.set(ref.shellNode, {
                position: 'fixed',
                top: ref.shellNodeBox.top,
                left: ref.shellNodeBox.left,
                bottom: window.innerHeight - ref.shellNodeBox.bottom,
                right: document.body.clientWidth - ref.shellNodeBox.right, // width without scrollbars
                'z-index': FULL_SCREEN_Z_INDEX,
                height: 'auto',
                width: 'auto',
                margin: 0
            });

            // animate map layer container in the opposite direction to counteract its drifting up and left
            ref.tl.to(ref.mapContainerNode, RV_DURATION, {
                top: window.innerHeight / 2 - ref.shellNodeBox.height / 2,
                left: document.body.clientWidth / 2 - ref.shellNodeBox.width / 2,
                ease: RV_SWIFT_IN_OUT_EASE
            }, 0);

            // animate shell taking over the page
            ref.tl.to(ref.shellNode, RV_DURATION, {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                ease: RV_SWIFT_IN_OUT_EASE
            }, 0);

            // rv-full-screen class will hide all the host page content except the full-screened viewer
            ref.tl.set(ref.body, { className: '+=rv-full-screen' });

            ref.isExpanded = !ref.isExpanded;
            ref.tl.play();
        } else {
            ref.tl = animationService.timeLineLite({
                paused: true
            });

            // need to restore host page content to visibility
            ref.tl.set(ref.body, { className: '-=rv-full-screen' });

            // animate map layer container in the oppositve directive to counteract collapse of the shell
            ref.tl.to(ref.mapContainerNode, RV_DURATION, {
                top: -(window.innerHeight / 2 - ref.shellNodeBox.height / 2),
                left: -(document.body.clientWidth / 2 - ref.shellNodeBox.width / 2),
                ease: RV_SWIFT_IN_OUT_EASE
            }, 0);

            // animate collapse of the shell to its previous size
            ref.tl.to(ref.shellNode, RV_DURATION, {
                top: ref.shellNodeBox.top,
                left: ref.shellNodeBox.left,
                bottom: window.innerHeight - ref.shellNodeBox.bottom,
                right: document.body.clientWidth - ref.shellNodeBox.right, // width without scrollbars
                ease: RV_SWIFT_IN_OUT_EASE
            }, 0);

            // clear all properties left after animation completes
            ref.tl.set(ref.shellNode, {
                clearProps: 'all'
            });

            // clear all properties left after animation completes
            ref.tl.set($rootElement, {
                clearProps: 'all'
            });

            ref.isExpanded = !ref.isExpanded;
            ref.tl.play();
        }
    }

    /**
     * Cleans up after the full-screen animation completes.
     * Removes leftover properties from the map container node and re-centers the map.
     * @private
     * @function onComplete
     */
    function onComplete() {
        const map = configService.getSync.map.instance;
        const originalPanDuration = map.mapDefault('panDuration');
        map.mapDefault('panDuration', 0);
        map.resize();
        map.reposition();

        // wait for a bit before recentring the map
        // if call right after animation completes, the map object still confused about its true size and extent
        $timeout(() => {
            // center the map
            map.centerAt(ref.trueCenterPoint);

            // clear offset properties on the map container node
            animationService.set(ref.mapContainerNode, {
                clearProps: 'top,left'
            });

            map.mapDefault('panDuration', originalPanDuration);
        }, 500);
    }
}
