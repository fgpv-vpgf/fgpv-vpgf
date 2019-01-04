/* global TweenLite, TimelineLite */

/**
 * @module animationService
 * @memberof app.layout
 *
 * @description
 * The `animationService` service handles GSAP based animations. For IE or touch devices, the animation timeframe is set to almost zero to improve performance.
 */
angular
    .module('app.layout')
    .factory('animationService', animationService);

function animationService($rootElement, appInfo) {

    const service = {
        timeLineLite,
        to: animationWrapper('to'),
        from: animationWrapper('from'),
        fromTo: animationWrapper('fromTo'),
        set: TweenLite.set
    };

    return service;

    /**
    * Returns a new TimelineLite instance with 'to' and 'fromTo' methods overridden with custom implementation
    * @function  timeLineLite
    * @return  {Object} a new TimelineLite instance
    */
    function timeLineLite() {
        const tll = new TimelineLite(...arguments);
        // wrap original GSAP methods in custom method which can disable animations
        ['to', 'from', 'fromTo'].forEach(type => {
            tll['orig' + type] = tll[type];
            tll[type] = animationWrapper(type, tll);
        });

        return tll;
    }

    /**
    * Returns a function that can be called just like the original toWrap method, except this one disables animations for IE and touch devices.
    * @function  animationWrapper
    * @param     {String}   toWrap          the name of the existing method in TLLinstance to be wrapped
    * @param     {Object}   TLLinstance     an instance of TimelineLite, defaults to static TweenLite class
    * @return    {Function} a function which effectively replaces the original toWrap function
    */
    function animationWrapper(toWrap, TLLinstance = TweenLite) {
        return function () {
            const args = [...arguments];
            // set duration to 0.001 when animations are disabled so they complete almost immediately. Cannot be 0 or it fails.
            args[1] = appInfo.isIE11 || $rootElement.hasClass('rv-touch') ? 0.001 : args[1];
            const originalWrap = 'orig' + toWrap;
            return TLLinstance[originalWrap] ? TLLinstance[originalWrap](...args) : TLLinstance[toWrap](...args);
        };
    }
}
