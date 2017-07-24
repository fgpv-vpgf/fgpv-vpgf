const templateUrl = require('./geosearch.html');

/**
 * @module rvGeosearch
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvGeosearch` directive let user enter text for a geolocation search.
 *
 */
angular
    .module('app.ui')
    .directive('rvGeosearch', rvGeosearch);

/**
 * `rvGeosearch` directive body.
 *
 * @function rvGeosearch
 * @return {object} directive body
 */
function rvGeosearch(layoutService, debounceService, globalRegistry, $rootElement, $rootScope,
    stateManager, events) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        controller: Controller,
        controllerAs: 'self',
        bindToController: true,
        link: (scope, element) => {

            // https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1668
            // IE requires a specific fix because it will not size a flex child's height correctly unless its parent has a set height (not percentage); so the height is set explicitly every time the main panel height changes;
            // read here for more details http://stackoverflow.com/a/35537510
            // tecnhically, this fix will work for all browsers, but it's ugly and should be reserved for IE only; other browsers are fixes using CSS just fine;
            if (globalRegistry.isIE) {
                const geosearchContentNode = element.find('.rv-geosearch-content:first');

                const debounceUpdateMaxHeight = debounceService.registerDebounce(newDimensions =>
                    geosearchContentNode.css('max-height', newDimensions.height - 10), 175, false, true); // 10 accounts for top margin :()

                layoutService.onResize(layoutService.panels.main, debounceUpdateMaxHeight);
            }

            // force focus on open geosearch because sometimes it is lost
            $rootScope.$on(events.rvGeosearchClose, () => $rootElement.find('.rv-app-geosearch').rvFocus());
        }
    };

    return directive;
}

function Controller(geosearchService, events, debounceService) {
    'ngInject';
    const self = this;

    self.service = geosearchService;

    const ref = {
        extentChangeListener: angular.noop
    };

    self.onItemFocus = debounceService.registerDebounce(onItemFocus, 700, false);
    self.onItemBlur = onItemBlur;
    self.onTopFiltersUpdate = onTopFiltersUpdate;
    self.onBottomFiltersUpdate = onBottomFiltersUpdate;

    return;

    /**
     * On focus, create a tooltip who contains all text section.
     *
     * @function onItemFocus
     * @private
     */
    function onItemFocus(evt) {
        const target = evt.target;

        // get li from event (can be the button or li itself) then children
        const li = !target.classList.contains('rv-results-item-body-button') ? target : target.parentElement;
        const children = li.children;

        // create tooltip element
        const div = document.createElement('div');
        div.className = 'rv-results-item-tooltip';
        div.appendChild(children[1]);
        div.appendChild(children[1]);
        div.appendChild(children[1]);
        li.appendChild(div);

        // check it the text exceed the menu width. If so, set the animation so text will move and
        // user will be able to see it.
        div.style.left = div.clientWidth > 380 ? `${360 - div.clientWidth}px` : 0;
    }

    /**
     * On blur, remove tooltip.
     *
     * @function onItemBlur
     * @private
     */
    function onItemBlur() {
        $('.rv-results-item-tooltip').children().unwrap();
    }

    /**
     * Triggers geosearch query on top filters (province, type) update.
     *
     * @function onTopFiltersUpdate
     * @private
     */
    function onTopFiltersUpdate() {
        geosearchService.runQuery();
    }

    /**
     * Triggers geosearch query on top filters (show only items visible in the current extent) update.
     *
     * @function onBottomFiltersUpdate
     * @private
     */
    function onBottomFiltersUpdate(visibleOnly) {
        if (visibleOnly) {
            ref.extentChangeListener = events.$on(events.rvExtentChange, geosearchService.runQuery);
        } else {
            ref.extentChangeListener(); // unsubscribe from the listener
        }

        // also run query once on each filters update to refresh the results
        geosearchService.runQuery();
    }
}
