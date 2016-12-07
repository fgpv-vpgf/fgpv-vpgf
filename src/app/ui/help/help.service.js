(() => {
    'use strict';

    /**
     * @module helpService
     * @memberof app.ui
     * @description
     *
     * The `helpService` service provides stores for help items
     *
     */
    angular
        .module('app.ui.help')
        .service('helpService', helpService);

    function helpService($mdDialog, $translate, translations, storageService, sideNavigationService) {
        // all help sections (populated when elements tagged with rv-help are created)
        const registry = [];

        // all help sections currently drawn
        const drawnCache = [];

        const service = {
            register,
            unregister,
            registry,
            drawnCache,
            setDrawn,
            clearDrawn,

            open
        };

        return service;

        /**
         * Opens help panel.
         *
         * @function open
         */
        function open() {
            sideNavigationService.close();

            $mdDialog.show({
                controller: HelpSummaryController,
                controllerAs: 'self',
                templateUrl: 'app/ui/help/help-summary.html',
                parent: storageService.panels.shell,
                disableParentScroll: false,
                targetEvent: event,
                clickOutsideToClose: true,
                fullscreen: false
            });
        }

        /**
        * Adds an object to the service's registry.
        *
        * @function register
        * @param {Object} object    the object to be added
        */
        function register(object) {
            registry.push(object);
        }

        /**
        * Removes an object from the service's registry.
        *
        * @function unregister
        * @param {Object} object    the object to be removed
        */
        function unregister(object) {
            const index = registry.indexOf(object);
            if (index !== -1) {
                registry.splice(index, 1);
            }
        }

        /**
        * Adds an object to the service's cache of already drawn help sections.
        *
        * @function setDrawn
        * @param {Object} object    the object to be added
        */
        function setDrawn(object) {
            drawnCache.push(object);
        }

        /**
        * Clears the service's cache of already drawn help sections.
        *
        * @function clearDrawn
        */
        function clearDrawn() {
            drawnCache.length = 0;
        }

        // FIXME add docs
        function HelpSummaryController() {
            const self = this;
            self.closeHelpSummary = () => $mdDialog.hide();

            self.sections = Object.keys(translations[$translate.use()].help)
                .map(sectionName =>
                    ({ name: sectionName, isExpanded: false }));

            console.log(self);
        }
    }
})();
