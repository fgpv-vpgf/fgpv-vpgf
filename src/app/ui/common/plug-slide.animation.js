/* global Ease, BezierEasing, TweenLite, TimelineLite */

(() => {
    'use strict';

    const RV_PANEL_CLASS = '.panel';
    const RV_PLUG_SLIDE_DURATION = 0.3;
    const RV_PLUG_SLIDE_ID_DATA = 'rv-plug-slide-id';
    const RV_SWIFT_IN_OUT_EASE = new Ease(BezierEasing(0.35, 0, 0.25, 1));
    const RV_PLUG_PANEL_SIZE_DATA = 'rv-plug-panel-size';

    let sequences = {}; // store animation sequences
    let counter = 1; // simple id for animation sequences

    /**
     * @ngdoc service
     * @name rvPlugSlide
     * @module app.ui.common
     * @description
     *
     * The `rvPlugSlide` is an animation. It animates enter and leave events on view plugs by applying transitions to plugs' panels. It will not work with just any node.
     *
     * ```html
     * <!-- plug's panel will be animated by sliding it down from -100% of its height relative to itself -->
     * <div class="rv-plug-slide-down"></div>
     *
     * <!-- plug's panel will be animated by sliding it down from -100% of its height relative to the app's root element -->
     * <div class="rv-plug-slide-down-grand"></div>
     *
     */
    angular
        .module('app.ui.common')
        .animation('.rv-plug-slide-down', plugSlideBuilder(0))
        .animation('.rv-plug-slide-right', plugSlideBuilder(1))
        .animation('.rv-plug-slide-up', plugSlideBuilder(2))
        .animation('.rv-plug-slide-left', plugSlideBuilder(3))
        .animation('.rv-plug-slide-down-grand', plugSlideGrandBuilder(0))
        .animation('.rv-plug-slide-right-grand', plugSlideGrandBuilder(1))
        .animation('.rv-plug-slide-up-grand', plugSlideGrandBuilder(2))
        .animation('.rv-plug-slide-left-grand', plugSlideGrandBuilder(3));

    // TODO: add option to change duration through an attribute
    // TODO: add option to add delay before animation starts through an attribute

    /**
     * Animates plug's panel.
     *
     * @param  {Number} direction direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
     * @return {Object} service object with `enter` and `leave` functions
     */
    function plugSlideBuilder(direction) {
        return $rootElement => {
            'ngInject';
            const service = {
                enter: slideEnterBuilder($rootElement, direction),
                leave: slideLeaveBuilder($rootElement, direction)
            };

            return service;
        };
    }

    /**
     * Animates plug's panel.
     *
     * @param  {Number} direction direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
     * @return {Object} service object with `enter` and `leave` functions
     */
    function plugSlideGrandBuilder(direction) {
        return $rootElement => {
            'ngInject';
            const service = {
                enter: enter,
                leave: leave
            };

            return service;

            ///////////////

            /**
             * Animates grand `enter` event.
             * @param  {Object}   element  plug node
             * @param  {Function} callback
             * @param  {Object} service looks like service object; not used
             */
            function enter(...args) {
                // ...args is spread from ES6: https://babeljs.io/docs/learn-es2015/#default-rest-spread
                // we use it to hide parameters we don't control. Angular passes in 3; element, callback, service
                slideEnterBuilder($rootElement, direction)(...args, null);
            }

            /**
             * Animates grand `leave` event.
             * @param  {Object}   element  plug node
             * @param  {Function} callback
             * @param  {Object} service looks like service object; not used
             */
            function leave(...args) {
                // ...args is ES6 spread: see above 'enter' function
                slideLeaveBuilder($rootElement, direction)(...args, null);
            }
        };

    }

    /**
     * Animates `enter` event.
     * @param  {Object} $rootElement
     * @param  {Number} direction direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
     * @param  {Object}   element  plug node
     * @param  {Function} callback
     * @param  {Object} service looks like service object; not used
     * @param  {Number} delta travel distance (defaults to '100%')
     */
    function slideEnterBuilder($rootElement, direction) {
        return (element, callback, service, delta = '100%') => {
            // create new paused sequence
            let sequence = sequenceBuilder($rootElement, element, callback, direction, delta);
            sequences[counter] = sequence; // store sequence for reference
        };
    }

    /**
     * Animates `leave` event.
     * @param  {Object}   $rootElement
     * @param  {Number} direction = 0 direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
     * @param  {Object}   element  plug node
     * @param  {Function} callback
     */
    function slideLeaveBuilder($rootElement, direction) {
        return (element, callback, service, delta = '100%') => {
            let sequenceId = element.data(RV_PLUG_SLIDE_ID_DATA);
            let sequence = sequences[sequenceId];

            if (sequence) {
                if (getPanelSize(element, direction) !== element.data(RV_PLUG_PANEL_SIZE_DATA)) {
                    //redo sequence
                    sequence = sequenceBuilder($rootElement, element,
                                                    callback, direction, delta);

                    sequence
                        .totalProgress(sequences[sequenceId].totalProgress(), true)
                        .pause();
                }

                sequence
                    .pause()
                    .eventCallback('onReverseComplete', () => {
                        console.log('Plug Slide [reversed]', direction, 'is complete.');

                        // more on delete: http://perfectionkills.com/understanding-delete/
                        delete sequences[sequenceId]; // release for garbage
                        delete sequences[element.data(RV_PLUG_SLIDE_ID_DATA)];
                        element.data(RV_PLUG_SLIDE_ID_DATA, null); // remove data attribute

                        callback();
                    })
                    .reverse();
            }
        };
    }

    /**
    * Retrieves the panel size of an element, based on animation direction
    * @param  {Object}   element  plug node
    * @param  {Number} direction = 0 direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
    */
    function getPanelSize(element, direction) {
        if (direction % 2 === 0) { //Down, Up
            return element.data(RV_PLUG_PANEL_SIZE_DATA,
                element.find(RV_PANEL_CLASS).outerHeight(true));
        } else { //Left, Right
            return element.data(RV_PLUG_PANEL_SIZE_DATA,
                element.find(RV_PANEL_CLASS).outerWidth(true));
        }
    }

    /**
    * Creates animation sequence
    * @param  {Object} $rootElement
    * @param  {Object}   element  plug node
    * @param  {Function} callback
    * @param  {Number} direction direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
    * @param  {Number} delta travel distance (defaults to '100%')
    */
    function sequenceBuilder($rootElement, element, callback, direction, delta) {
        // create new paused sequence
        const sequence = new TimelineLite({
            paused: true
        });

        let panel = element.find(RV_PANEL_CLASS); // get panel node
        let duration = RV_PLUG_SLIDE_DURATION; // figure out duration
        element.data(RV_PLUG_SLIDE_ID_DATA, ++counter); // store sequence id on the node

        // store current panel size on element, used to see if panel is morphed before leaving
        element.data(RV_PLUG_PANEL_SIZE_DATA, getPanelSize(element, direction));

        delta = delta || deltaHelper($rootElement, element, direction);

        if (panel) {
            sequence
                .add(makeSlideTween(direction, panel, duration, delta))
                .eventCallback('onComplete', () => {
                    console.log('Plug Slide', direction, 'is complete.');
                    callback();
                })
                .play();
        }

        return sequence;
    }

    /**
    * Calculates the delta needed for a grand animation
    * @param  {Object} $rootElement
    * @param  {Object}   element  plug node
    * @param  {Number} direction direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
    */
    function deltaHelper($rootElement, element, direction) {
        let delta = 10;

        if (direction === 0) { //DOWN
            delta += element.position().top + getPanelSize(element, direction);
        } else if (direction === 1) { //RIGHT
            delta += element.position().left + getPanelSize(element, direction);
        } else if (direction === 2) { //UP
            // not adding on to 10 because there is no drop shadow above the panel
            delta = $rootElement.outerHeight(true) - element.position().top;
        } else { //LEFT
            delta += $rootElement.outerWidth(true) - element.position().left;
        }

        return delta;
    }

    /**
     * Creates a slide tween.
     * @param  {Number} direction direction of movement
     * @param  {Object} panel     node to move
     * @param  {Number} duration  movement duration
     * @param  {String} delta     travel distance
     * @return {Object}           animation Tween
     */
    function makeSlideTween(direction, panel, duration, delta) {
        const shift = {
            x: 0,
            y: 0
        };

        const travel = {
            0: 'y',
            1: 'x',
            2: 'y',
            3: 'x'
        };

        const modifier = {
            0: '-',
            1: '-',
            2: '',
            3: ''
        };

        // based on direction, set starting `x` or `y` attributes of the node
        shift[travel[direction]] = modifier[direction] + delta;

        return TweenLite.fromTo(panel, duration, {
            x: shift.x,
            y: shift.y,
            z: 0
        }, {
            x: '0%',
            y: '0%',
            z: 0,
            ease: RV_SWIFT_IN_OUT_EASE,
            clearProps: 'transform' //, // http://tiny.cc/dbuh4x; http://tiny.cc/wbuh4x
        });
    }
})();
