(function () {
    'use strict';

    /**
     * @ngdoc function
     * @name FiltersPanelPlugController
     * @module app.layout
     * @description
     *
     * The `FiltersPanelPlugController` controller handles the filters panel plug view.
     * `self.active` is triggering an `active` CSS class to be added to the side panel plug when it's active.
     */
    angular
        .module('app.layout')
        .controller('FiltersPanelPlugController', FiltersPanelPlugController);

    /* ignore this for now
    angular.module('app.layout')
        .animation('.slide', [function () {
            var duration = 1;
            return {
                // make note that other events (like addClass/removeClass)
                // have different function input parameters
                enter: function (element, doneFn) {
                    console.log('start enter', jQuery(element), element.attr('class'));

                    TweenLite.fromTo(element, duration,
                        { opacity: 0 },
                        {  opacity: 1, onComplete: function () {

                            console.log('done enter!!', element.attr('class'));
                            doneFn();
                        } });

                    // remember to call doneFn so that angular
                    // knows that the animation has concluded
                },

                move: function (element, doneFn) {
                    jQuery(element)
                        .fadeIn(duration, doneFn);
                },

                leave: function (element, doneFn) {
                    console.log('start leave', jQuery(element), element.attr('class'));

                    TweenLite.fromTo(element, duration,
                        { opacity: 1 },
                        {  opacity: 0, onComplete: function () {

                            console.log('done enter!!', element.attr('class'));
                            doneFn();
                        }});


                }
            };
        }]);
    /*

    /* @ngInject */
    function FiltersPanelPlugController() {
        var self = this;
        self.active = true;
    }
})();
