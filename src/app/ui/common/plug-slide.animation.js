import {Power1} from 'gsap';

// Using the first inner div to make sure we select something that renders
const RV_PANEL_SELECTOR = 'div:first';
const RV_PLUG_SLIDE_DURATION = 0.3;
const RV_PLUG_SLIDE_ID_DATA = 'rv-plug-slide-id';
const RV_SWIFT_IN_OUT_EASE = Power1;

let sequences = {}; // store animation sequences
let counter = 1; // simple id for animation sequences
let animSrv;

/**
 * @module rvPlugSlide
 * @memberof app.ui
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
const module = angular.module('app.ui');
const directions = ['down', 'right', 'up', 'left'];
const animationTypes = { slide: makeSlideAnim, fade: makeFadeAnim };

// register animations, loops through directions and types
directions.forEach((direction, index) =>
    Object.keys(animationTypes).forEach(type => {
        module
            .animation(`.rv-plug-${type}-${direction}`,
                animationBuilder(type, index, false))
            .animation(`.rv-plug-${type}-${direction}-grand`,
                animationBuilder(type, index, true));
    }));

// stationary fade animation
module
    .animation('.rv-plug-fade', animationBuilder('fade', 4, false));

// TODO: add option to change duration through an attribute
// TODO: add option to add delay before animation starts through an attribute

/**
 * Animates plug's panel.
 *
 * @function animationBuilder
 * @param  {String}  type        type of animation (fade, slide, etc.)
 * @param  {Number}  direction   direction of movement (0 - down, 1 - right, 2 - up, 3 - left, 4 - stationary)
 * @param  {Bool}    grand       type of shift (see top comment)
 * @return {Object}  service     object with `enter` and `leave` functions
 */
function animationBuilder(type, direction, grand) {
    return ($rootElement, animationService) => {
        'ngInject';

        const func = animationTypes[type];
        animSrv = animationService;
        return {
            enter: func($rootElement, direction, false, grand),
            leave: func($rootElement, direction, true, grand),
            addClass: ngShowHideWrapper(true, func, $rootElement, direction, grand),
            removeClass: ngShowHideWrapper(false, func, $rootElement, direction, grand)
        };
    };
}

/**
* Creates Fade animations
*
* @function  makeFadeAnim
* @param  {Object}   $rootElement
* @param  {Number}   direction   direction of movement (0 - down, 1 - right, 2 - up, 3 - left, 4 - stationary)
* @param  {Bool}     reverse     whether to reverse the animation direction
* @param  {Bool}     grand       type of shift (see top comment)
* @param  {Object}   element     plug node
* @param  {Function} callback    callback from angular
*/
function makeFadeAnim($rootElement, direction, reverse, grand) {
    return (element, callback) => {
        let duration = RV_PLUG_SLIDE_DURATION;
        let shift = calculateShift($rootElement, element, direction, grand);

        let start = {
            x: shift.x,
            y: shift.y,
            z: 0,
            opacity: 0
        };

        let end = {
            x: '0%',
            y: '0%',
            z: 0,
            opacity: 1
        };

        let config = {
            ease: RV_SWIFT_IN_OUT_EASE,
            onComplete: cleanup(element, callback),
            clearProps: 'transform,opacity' // http://tiny.cc/dbuh4x; http://tiny.cc/wbuh4x
        };

        buildTween(element, callback, duration, reverse, start, end, config);
    };
}

/**
* Creates Slide animations
*
* @function makeSlideAnim
* @param  {Object}   $rootElement
* @param  {Number}   direction   direction of movement (0 - down, 1 - right, 2 - up, 3 - left, 4 - stationary)
* @param  {Bool}     reverse     whether to reverse the animation direction
* @param  {Bool}     grand       type of shift (see top comment)
* @param  {Object}   element     plug node
* @param  {Function} callback    callback from angular
*/
function makeSlideAnim($rootElement, direction, reverse, grand) {
    return (element, callback) => {
        let duration = RV_PLUG_SLIDE_DURATION;
        let shift = calculateShift($rootElement, element, direction, grand);

        let start = {
            x: shift.x,
            y: shift.y,
            z: 0
        };

        let end = {
            x: '0%',
            y: '0%',
            z: 0
        };

        let config = {
            ease: RV_SWIFT_IN_OUT_EASE,
            onComplete: cleanup(element, callback),
            clearProps: 'transform' // http://tiny.cc/dbuh4x; http://tiny.cc/wbuh4x
        };

        buildTween(element, callback, duration, reverse, start, end, config);
    };
}

/**
* Retrieves the panel size of an element, based on animation direction
*
* @function getPanelSize
* @param  {Object}  element     plug node
* @param  {Number}  direction   direction of movement (0 - down, 1 - right, 2 - up, 3 - left, 4 - stationary)
* @return {Number}  size        size of relevant dimension
*/
function getPanelSize(element, direction) {
    if (direction % 2 === 0) { // Down, Up
        return element.find(RV_PANEL_SELECTOR).outerHeight(true);
    } else { // Left, Right
        return element.find(RV_PANEL_SELECTOR).outerWidth(true);
    }
}

/**
* Calculates the delta needed for a grand animation
*
* @function deltaHelper
* @param  {Object}  $rootElement
* @param  {Object}  element      plug node
* @param  {Number}  direction    direction of movement (0 - down, 1 - right, 2 - up, 3 - left, 4 - stationary)
* @return {Number}  delta        amount the panel should move
*/
function deltaHelper($rootElement, element, direction) {
    let delta = 10;

    if (direction === 0) { // DOWN
        delta += element.position().top + getPanelSize(element, direction);
    } else if (direction === 1) { // RIGHT
        delta += element.position().left + getPanelSize(element, direction);
    } else if (direction === 2) { // UP
        // not adding on to 10 because there is no drop shadow above the panel
        delta = $rootElement.outerHeight(true) - element.position().top;
    } else { // LEFT
        delta += $rootElement.outerWidth(true) - element.position().left;
    }

    return delta;
}

/**
* Calculates the amount to translate the panel
*
* @function calculateShift
* @param  {Object}  $rootElement
* @param  {Object}  element     plug node
* @param  {Number}  direction   direction of movement (0 - down, 1 - right, 2 - up, 3 - left, 4 - stationary)
* @param  {Bool}    grand       type of shift (see top comment)
* @return {Object}  shift       amount to move the panel
*/
function calculateShift($rootElement, element, direction, grand) {
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

    if (direction !== 4) {
        let delta = grand ? deltaHelper($rootElement, element, direction).toString() : '100%';

        // based on direction, set starting `x` or `y` attributes of the node
        shift[travel[direction]] = modifier[direction] + delta;
    }

    return shift;
}

/**
* Deletes the element's current animation sequence and calls angulars callback
*
* @function cleanup
* @param  {Object}   element    plug node
* @param  {Function} callback   callback from angular
*/
function cleanup(element, callback) {
    return () => {
        delete sequences[element.data(RV_PLUG_SLIDE_ID_DATA)];
        callback();
    };
}

/**
 * Makes call to animation from 'ng-show' and 'ng-hide' work the same as enter/leave
 *
 * @function ngShowHideWrapper
 * @param  {boolean}    addClass    a flag indicating whether the `ng-hide` class was added or removed
 * @return {function}               bootstrapped open or close function
 */
function ngShowHideWrapper(addClass, func, $rootElement, direction, grand) {
    return (element, cssClass, callback) => {
        // both `ng-hide` and `ng-show` use `ng-hide` css class
        const action = {
            true: func($rootElement, direction, true, grand),
            false: func($rootElement, direction, false, grand)
        };

        // pick the action to perform;
        // `addClass` flips the action depending on whether the class is added or removed
        action[addClass](element, callback);
    };
}

/**
* Handles building the animation tween
*
* @function buildTween
* @param  {Object}   element    plug node
* @param  {Function} callback   callback from angular
* @param  {Number}   duration   length of animation in seconds
* @param  {Bool}     reverse    whether to reverse the animation direction
* @param  {Object}   start      beginning state for the animation
* @param  {Object}   end        end state for the animation
* @param  {Object}   config     additional flags for the actual end state
*/
function buildTween(element, callback, duration, reverse, start, end, config) {
    // Check if a sequence is already tied to the element, if so reverse it.
    // (if the animation still exists it must be ongoing)
    let sequence = sequences[element.data(RV_PLUG_SLIDE_ID_DATA)];
    if (sequence) {
        sequence.reverse().eventCallback('onReverseComplete', cleanup(element, callback));
        return;
    }

    // Build and store the tween
    let id = counter++;
    /* sequences[id] = animSrv.fromTo(element.find(RV_PANEL_SELECTOR), duration,
        reverse ? end : start,
        angular.extend({}, reverse ? start : end, config)); */
    
    element.data(RV_PLUG_SLIDE_ID_DATA, id);

    // CIP: skip content plug animations effectively disabling them
    sequences[id] = animSrv.set(element.find(RV_PANEL_SELECTOR), angular.extend({}, reverse ? start : end, config));
    cleanup(element, callback)();

}
