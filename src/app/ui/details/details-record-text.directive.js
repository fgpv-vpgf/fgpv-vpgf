const templateUrl = require('./details-record-text.html');
import { IdentifyMode } from 'api/layers';

/**
 * @module rvDetailsRecordText
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvDetailsRecordText` directive renders the data content of details.
 *
 */
angular.module('app.ui').directive('rvDetailsRecordText', rvDetailsRecordText);

/**
 *
 * `rvDetailsRecordText` directive body.
 *
 * @function rvDetailsRecordText
 * @param {object} $translate translation service
 * @param {object} $compile
 * @param {object} $timeout
 * @param {object} events events list
 * @param {object} detailService details service
 * @returns {object} directive body
 */
function rvDetailsRecordText($translate, $compile, $timeout, events, detailService) {
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

    function link(scope, el) {
        scope.$watch('self.item', () => {
            const self = scope.self;

            const l = self.item.requester.proxy._source;

            self.lang = $translate.use();
            events.$on(events.rvLanguageChanged, () => (self.lang = $translate.use()));

            // get template to override basic details output, null/undefined => show default
            self.details = l.config.details;

            if (!self.details || !self.details.template) {
                return;
            }

            detailService.getTemplate(l.layerId, self.details.template).then(template => {
                if (!self.details.parser) {
                    compileTemplate();
                    return;
                }

                detailService.getParser(l.layerId, self.details.parser).then(parseFunction => {
                    // if data is already retrieved
                    if (self.item.data.length > 0) {
                        parse();
                    } else {
                        // data not here yet, wait for it
                        const itemDataWatcher = scope.$watch('self.item.data[0]', newValue => {
                            if (!newValue) {
                                return;
                            }

                            itemDataWatcher();
                            parse();
                        });
                    }

                    function parse() {
                        // TODO: maybe instead of passing just the language, pass the full config
                        self.layer = eval(`${parseFunction}(self.item.data[0], self.lang);`);
                        compileTemplate();
                    }
                });

                function compileTemplate() {
                    // Causes the template compilation to wait for next digest cycle
                    // this ensures we have the data and don't display and "{{ VARIABLE }}"s
                    $timeout(() => {
                        // compile the template with the scope and append it to the mount
                        el.find('.template-mount')
                            .empty()
                            .append($compile(template)(scope));
                    });
                }
            });
        });
    }
}

function Controller($scope, appInfo, events, mapService) {
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
     * Redraws marker highlight for text records.
     *
     * @function _redrawHighlight
     * @private
     */
    function _redrawHighlight() {
        // adding marker highlight the click point because the layer doesn't support feature highlihght (not discernible geometry)
        if (!appInfo.mapi.layers.identifyMode.includes(IdentifyMode.Marker)) {
            return;
        }

        mapService.addMarkerHighlight(self.mapPoint, appInfo.mapi.layers.identifyMode.includes(IdentifyMode.Haze));
    }
}
