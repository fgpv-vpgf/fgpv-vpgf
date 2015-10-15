/* global Ease, BezierEasing, TweenLite, TimelineLite  */

(function () {
    'use strict';

    const RV_PANEL_CLASS = '.panel';
    const RV_PLUG_SLIDE_DURATION = 0.3;
    const RV_PLUG_SLIDE_ID_DATA = 'rv-plug-slide-id';
    const RV_SWIFT_IN_OUT_EASE = (new Ease(BezierEasing(0.35, 0, 0.25, 1)))
        .get;

    let sequences = {}; // store animation sequences
    let counter = 1; // simple id for animation sequences

    /**
     * @ngdoc service
     * @name rvPlugSlide
     * @multiElement
     * @module app.ui.common
     * @description
     *
     * The `rvPlugSLide` is an animation. It animates enter and leave events on view plugs by applying transitions to plugs' panels. It will not work with just any node.
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
        .animation('.rv-plug-slide-down', plugSlide.bind())
        .animation('.rv-plug-slide-right', plugSlide.bind(null, 1))
        .animation('.rv-plug-slide-up', plugSlide.bind(null, 2))
        .animation('.rv-plug-slide-left', plugSlide.bind(null, 3))
        .animation('.rv-plug-slide-down-grand', plugSlideGrand.bind());

    // TODO: add option to change duration through an attribute
    // TODO: add option to add delay before animation starts through an attribute

    /**
     * Animates plug's panel.
     *
     * @param  {Number} direction = 0 direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
     * @return {Object} service object with `enter` and `leave` functions
     */
    function plugSlide(direction = 0) {
        const service = {
            enter: slideEnter.bind(null, direction),
            leave: slideLeave.bind(null, direction)
        };

        return service;
    }

    function plugSlideGrand(direction = 0) {
        const service = {
            enter: enter,
            leave: slideLeave.bind(null, direction)
        };

        return service;

        ///////////////

        /**
         * Animates grand `enter` event.
         * @param  {Object}   element  plug node
         * @param  {Function} callback
         */
        function enter(element, callback, service) {
            // FIXME: find a better way to calculate position relateive to the rootElement
            let delta = element.position()
                .top +
                element.find(RV_PANEL_CLASS)
                .outerHeight(true) + 10;

            slideEnter(direction, element, callback, service, delta);
        }
    }

    /**
     * Animates `enter` event.
     * @param  {Number} direction = 0 direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
     * @param  {Object}   element  plug node
     * @param  {Function} callback
     * @param  {Object} service looks like service object; not used
     * @param  {Number} delta travel distance (defaults to '100%')
     */
    function slideEnter(direction, element, callback, service, delta = '100%') {
        // create new paused sequence
        let sequence = new TimelineLite({
            paused: true
        });

        let panel = element.find(RV_PANEL_CLASS); // get panel node
        let duration = RV_PLUG_SLIDE_DURATION; // figure out duration
        element.data(RV_PLUG_SLIDE_ID_DATA, ++counter); // store sequence id on the node
        sequences[counter] = sequence; // store sequence for reference

        if (panel) {
            sequence
                .add(makeSlideTween(direction, panel, duration, delta))
                .eventCallback('onComplete', () => {
                    console.log('Plug Slide', direction, 'is complete.');
                    callback();
                })
                .play();
        }
    }

    /**
     * Animates `leave` event.
     * @param  {Number} direction = 0 direction of movement (0 - down, 1 - right, 2 - up, 3 - left)
     * @param  {Object}   element  plug node
     * @param  {Function} callback
     */
    function slideLeave(direction, element, callback) {
        let sequenceId = element.data(RV_PLUG_SLIDE_ID_DATA);
        let sequence = sequences[sequenceId];

        if (sequence) {
            sequence
                .pause()
                .eventCallback('onReverseComplete', () => {
                    console.log('Plug Slide [reversed]', direction, 'is complete.');

                    // more on delete: http://perfectionkills.com/understanding-delete/
                    delete sequences[sequenceId]; // release for garbage
                    element.data(RV_PLUG_SLIDE_ID_DATA, null); // remove data attribute

                    callback();
                })
                .reverse();
        }
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
