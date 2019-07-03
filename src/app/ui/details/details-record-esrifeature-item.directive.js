const templateUrl = require('./details-record-esrifeature-item.html');

/**
 * @module rvDetailsRecordEsrifeatureItem
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvDetailsRecordEsrifeatureItem` directive renders a single identify result from an esri feature (and dynamic) layers.
 * This directive is used to delay rendering of identify results. Sometimes there are hundreds of them and users are unlikely to look at most of them. The details record sections are collapsed and nothing beyond the title is added to the dom.
 * Identify results is rendered when the collapsed section header is hovered over or receives focus. This removes the slight delay when compiled html is inseted into the template on section expand.
 *
 */
angular.module('app.ui').directive('rvDetailsRecordEsrifeatureItem', rvDetailsRecordEsrifeatureItem);

function rvDetailsRecordEsrifeatureItem(SymbologyStack, stateManager, detailService, $translate, events, $compile, $timeout) {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {
            item: '=',
            requester: '=',
            solorecord: '=',
            toggleHighlight: '=',
            initHighlight: '=',
            findFeature: '='
        },
        link: link,
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /***/

    function link(scope, el) {
        const self = scope.self;

        const index = self.requester.proxy.itemIndex;
        // check for specified columns in config (in table)
        let includedColumns = [];
        if (self.requester.proxy._source.config) {
            const tableColumns = self.requester.proxy._source.config.table.columns;
            includedColumns = tableColumns.map(col => col.data);
        }
        let excludedColumns = ['SHAPE', 'Shape', 'rvSymbol', 'rvInteractive']; // anything that should be hidden by default
        if (stateManager.display.details.hidden) {
            excludedColumns = excludedColumns.concat(stateManager.display.details.hidden[index]);
        }

        self.lang = $translate.use();
        events.$on(events.rvLanguageChanged, () => (self.lang = $translate.use()));

        self.isExpanded = self.solorecord;
        self.isRendered = self.solorecord;

        // pre-filter the columns used by the datagrid out of the returned data
        // if there specific columns for the table set by the config use them
        if (includedColumns.length) {
            self.item.data = self.item.data.filter(column => includedColumns.indexOf(column.field) > -1);
        }
        // filter out any items hidden in the table
        self.item.data = self.item.data.filter(column => excludedColumns.indexOf(column.field) === -1);

        if (self.requester.proxy._source.config) {
            self.details = self.requester.proxy._source.config.details;
        }

        if (self.details && self.details.template) {
            detailService.getTemplate(self.requester.proxy._source.layerId, self.details.template).then(template => {
                if (self.details.parser) {
                    detailService
                        .getParser(self.requester.proxy._source.layerId, self.details.parser)
                        .then(parseFunction => {
                            // TODO: maybe instead of passing just the language, pass the full config
                            self.layer = eval(`${parseFunction}(self.item.data, self.lang);`);

                            compileTemplate();
                        });
                } else {
                    // creates an object from the details array of {field.key: field.value, etc.}
                    // for use in the template
                    self.layer = self.item.data.reduce((prev, current) => {
                        prev[current['key']] = current['value'];
                        return prev;
                    }, {});
                    compileTemplate();
                }

                function compileTemplate() {
                    // push update so that template gets the info from the parser
                    $timeout(() => {
                        // compile the template with the scope and append it to the mount
                        el.find('.template-mount').append($compile(template)(scope));
                    });
                }
            });
        }

        // set an attribute field to check for list of objects representing hyperlinks
        if (self.item && self.item.data) {
            self.item.data.forEach(data => {
                // check if data is an array of objects with href and title attributes
                if (Array.isArray(data.value)) {
                    data.listOfLinks = data.value.every(d => d.href && d.title) ? true : false;
                } else {
                    data.listOfLinks = false;
                }
            })
        }

        // wrap raw symbology item into a symbology stack object
        self.item.symbologyStack = new SymbologyStack(null, self.item.symbology);

        // highlight the feature as soon as it renders
        self.initHighlight(self.item.oid);
    }
}

function Controller() {
    'ngInject';
    const self = this;

    self.toggleDetails = toggleDetails;

    /**
     * Expand/collapse identify record section.
     * @function toggleDetails
     */
    function toggleDetails() {
        self.isRendered = true;
        self.isExpanded = !self.isExpanded;

        self.toggleHighlight(self.item.oid, self.isExpanded);
    }
}
