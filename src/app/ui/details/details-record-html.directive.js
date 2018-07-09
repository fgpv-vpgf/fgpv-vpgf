const templateUrl = require('./details-record-html.html');

/**
 * @module rvDetailsRecordHtml
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvDetailsRecordHtml` directive renders the data content of details.
 *
 */
angular.module('app.ui').directive('rvDetailsRecordHtml', rvDetailsRecordHtml);

/**
 *
 * `rvDetailsRecordHtml` directive body.
 *
 * @function rvDetailsRecordHtml
 * @param {object} $translate translation service
 * @param {object} events events list
 * @param {object} detailService details service
 * @returns {object} directive body
 */
function rvDetailsRecordHtml($translate, events, detailService) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            item: '=',
            mapPoint: '='
        },
        link: link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /*****/

    function link(scope) {
        const self = scope.self;

        const l = self.item.requester.proxy._source;

        self.lang = $translate.use();
        events.$on(events.rvLanguageChanged, () => (self.lang = $translate.use()));

        // get template to override basic details output, null/undefined => show default
        self.templateUrl = l.config._source.templateUrl;

        if (!l.config._source.parserUrl) {
            return;
        }

        detailService.getParser(l.layerId, l.config._source.parserUrl).then(parseFunction => {
            // if data is already retrieved
            if (self.item.data.length > 0) {
                parse();
            } else {
                // data not here yet, wait for it
                scope.$watchCollection('self.item.data', parse);
            }
            // push update so that template gets the info from the parser
            scope.$apply();

            function parse() {
                // TODO: maybe instead of passing just the language, pass the full config
                self.layer = eval(`${parseFunction}(self.item.data[0], self.lang);`);
            }
        });
    }
}

function Controller($scope, events, mapService) {
    'ngInject';
    const self = this;

    $scope.$on(events.rvHighlightDetailsItem, (event, item) => {
        if (item !== self.item) {
            return;
        }

        _redrawHighlight();
    });

    // watch for selected item changes; reset the highlight;
    $scope.$watch('self.item', newValue => {
        if (typeof newValue !== 'undefined') {
            _redrawHighlight();
        }
    });

    /**
     * Redraws marker highlight for html records.
     *
     * @function _redrawHighlight
     * @private
     */
    function _redrawHighlight() {
        // adding marker highlight the click point because the layer doesn't support feature highlihght (not discernible geometry)
        mapService.addMarkerHighlight(self.mapPoint, true);
    }
}
