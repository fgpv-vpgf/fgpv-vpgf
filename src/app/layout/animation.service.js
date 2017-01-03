/* global TweenLite, RV, TimelineLite */
(() => {

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

    function animationService($rootElement) {

        const service = {
            timeLineLite,
            to: toWrapper(),
            set: TweenLite.set,
            fromTo: fromToWrapper()
        };

        return service;

        /**
        * Returns a new TimelineLite instance with 'to' and 'fromTo' methods overridden with custom implementation
        * @function  timeLineLite
        * @return  {Object} a new TimelineLite instance
        */
        function timeLineLite() {
            const tll = new TimelineLite(...arguments);
            // used internally to avoid infinite loop of death caused by wrapping 'to' and 'fromTo' methods
            tll.origTo = tll.to;
            tll.origfromTo = tll.fromTo;
            // wrap existing 'to' and 'fromTo' methods with our custom implementation
            tll.to = toWrapper(tll);
            tll.fromTo = fromToWrapper(tll);

            return tll;
        }

        /**
        * Returns a function that can be called just like the original `to` method, except this one disables animations for IE and touch devices.
        * @function  toWrapper
        * @param   {Object} TLLinstance an optional timelineLite instance - otherwise static TweenLite is used
        * @return  {Function} a modified `to` method which can disable animations
        */
        function toWrapper(TLLinstance = TweenLite) {
            return function () {
                const args = [...arguments];
                // set duration to 0.001 when animations are disabled so they complete almost immediatly. Cannot be 0 or it fails.
                args[1] = disableAnimation() ? 0.001 : args[1];
                return TLLinstance.origTo ? TLLinstance.origTo(...args) : TLLinstance.to(...args);
            };
        }

        /**
        * Returns a function that can be called just like the original `fromTo` method, except this one disables animations for IE and touch devices.
        * @function  fromToWrapper
        * @param   {Object} TLLinstance an optional timelineLite instance - otherwise static TweenLite is used
        * @return  {Function} a modified `fromTo` method which can disable animations
        */
        function fromToWrapper(TLLinstance = TweenLite) {
            return function () {
                const args = [...arguments];
                // set duration to 0.001 when animations are disabled so they complete almost immediatly. Cannot be 0 or it fails.
                args[1] = disableAnimation() ? 0.001 : args[1];
                return TLLinstance.origfromTo ? TLLinstance.origfromTo(...args) : TLLinstance.fromTo(...args);
            };
        }

        /**
        * Determines if animations should be disabled.
        * @function  disableAnimation
        * @return  {Boolean} true if browser is IE or is touch enabled, false otherwise
        */
        function disableAnimation() {
            return RV.isIE || $rootElement.hasClass('rv-touch');
        }
    }
})();
