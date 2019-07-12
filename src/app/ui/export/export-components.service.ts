import angular from 'angular';

type InitialExportConfig = {
    [key: string]: {
        generators: any[];
        graphicOrder?: number[];
        graphicPosition?: { justify?: 'start' | 'center' | 'end'; align?: 'start' | 'center' | 'end' }[];
        isVisible?: boolean;
    };
};

type ExportComponentsService = {
    items: ExportComponent[] | null;
    init: (force?: boolean) => Promise<void>;
    update: (timeout: number, showToast: (...args: any[]) => void) => Object;
    get: (id: string) => ExportComponent;
};

type ExportComponent = any;

/**
 * @module exportComponentsService
 * @memberof app.ui
 * @requires dependencies
 * @description
 *
 * The `exportComponentsService` service handles available map export components.
 *
 */
angular.module('app.ui').factory('exportComponentsService', exportComponentsService);

exportComponentsService.$inject = ['$q', 'ExportComponent', 'configService', 'exportSizesService', 'exportGenerators'];

function exportComponentsService(
    $q: any,
    ExportComponent: any,
    configService: any,
    exportSizesService: any,
    exportGenerators: any
) {
    // these are initial configs for the default map export components; all default values are being filled by the ExportComponent constructor class
    const initialExportConfig: InitialExportConfig = {
        title: {
            generators: [exportGenerators.titleGenerator],
            isVisible: false
        },
        map: {
            generators: [
                exportGenerators.mapDummyGenerator,
                exportGenerators.mapSVGGenerator,
                exportGenerators.mapImageGenerator
            ],
            graphicOrder: [0, 2, 1]
        },
        mapElements: {
            generators: [exportGenerators.scalebarGenerator, exportGenerators.northarrowGenerator],
            // position scalebar on the left, and north-arrow on the right side of the export image
            graphicPosition: [
                {
                    justify: 'start',
                    align: 'center'
                },
                {
                    justify: 'end',
                    align: 'center'
                }
            ]
        },
        legend: {
            generators: [exportGenerators.legendGenerator]
        },
        footnote: {
            generators: [exportGenerators.footnoteGenerator]
        },
        timestamp: {
            generators: [exportGenerators.timestampGenerator],
            isVisible: false
        },
        // NOTE: example of adding the new component/generator
        text: {
            generators: [exportGenerators.customMarkupGenerator]
        }
    };

    // indicates the order of the components, top to bottom
    const componentOrder = ['title', 'map', 'mapElements', 'legend', 'footnote', 'timestamp' /* 'text' */];

    const service: ExportComponentsService = {
        items: null,

        init,
        update,
        get
    };

    // HACK: export generators directly
    (<any>window).exportService = initialExportConfig;

    return service;

    /**
     * Generates (or regenerates) the graphics from all export components after they initialized.
     * @function update
     * @param {Number} timeout a delay before after which the generation is considered to have failed
     * @param {Function} showToast [optional = angular.noop] a function to show notification toasts in the export dialog
     * @return {Object} the service itself
     */
    function update(timeout: number, showToast = angular.noop) {
        const promise = init().then(() =>
            $q.all(
                service.items!.map(item => item.generate(exportSizesService.selectedOption, timeout, showToast, true))
            )
        );

        return promise;
    }

    /**
     * Creates ExportComponents using values from the config.
     *
     * @function init
     * @param {Boolean} force [optional = false] indicates that export components will be created anew, all setting will be reset to defaults; the config will be read again; this should be used after switching being different config files
     * @return {Promise} a promise resolving after the initialization is complete
     */
    function init(force = false) {
        let initPromise;

        // TODO: if config changed (like changing language or loading from a bookmark, need to reenable export components)
        if (service.items === null || force) {
            service.items = [];

            initPromise = configService.getAsync.then((config: any) => {
                componentOrder.forEach(id => {
                    const exportComponent = config.services.export[id];

                    // add generators and graphic orders to the export component configs
                    exportComponent.generators = initialExportConfig[id].generators;
                    exportComponent.graphicOrder = initialExportConfig[id].graphicOrder;
                    exportComponent.graphicPosition = initialExportConfig[id].graphicPosition;

                    service.items!.push(new ExportComponent(id, exportComponent));
                });
            });
        } else {
            initPromise = $q.resolve();
        }

        return initPromise;
    }

    /**
     * Returns an ExportComponent with the specified name.
     *
     * @function get
     * @param {String} id the internal name of the component
     * @return {ExportComponent} component with the specified id
     */
    function get(id: string): ExportComponent {
        return service.items!.find(c => c.id === id);
    }
}
