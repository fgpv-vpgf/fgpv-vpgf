const templateUrl = require('./slider.html');

/**
 * @module rvSlider
 * @module app.ui
 * @restrict E
 * @description
 *
 * The `rvSlider` directive creates the slider panel
 *
 */
angular
    .module('app.ui')
    .directive('rvSlider', rvSlider);

function rvSlider() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /*********/

    function Controller(events, sliderService, configService) {
        'ngInject';
        const self = this;

        self.toggleSetting = toggleSetting;
        self.toggleHisto = toggleHisto;
        self.sliderService = sliderService;
        self.isActive = false;

        // add loaded layers to slider layer selector
        configService.getAsync.then(config => {
            if (config.map.components.rangeSlider.enabled) {
                self.isActive = true;
                
                events.$on(events.rvLayerRecordLoaded, (event, layerName) => {
                    const entries = configService.getSync.map.legendBlocks.entries;
                    for (let entry of entries) {
                        // for every entry, check if we need to add them
                        getEntry(entry, layerName);
                    }
                });
            }
        });

        /**
         * From the legend block, get the entry to access the layer object.
         *
         * @function getEntry
         * @private
         * @param {Object} entry the legendBlocks entries
         * @param {String} layerName the layer name to find
         */
        function getEntry(entry, layerName) {
            if (entry.blockType === 'group') {
                // loop trough groups and get to their entry node
                for (let groupEntry of entry.entries) {
                    getEntry(groupEntry, layerName);
                }
            } else if (entry.blockType === 'node' && entry.layerRecordId === layerName &&
                (entry.layerType === 'esriFeature' || entry.layerType === 'esriDynamic')) {
console.log('entry ' + entry.layerRecordId)
                // it is a valid esri feature or dynamic entry so add the layer
                entry.formattedData.then(data => {
                    console.log('data ' + entry.layerRecordId)
                    setLayer(entry, data);
                });
            }
        }

        /**
         * Add needed properties to the layer object and push it to layers array.
         *
         * @function setLayer
         * @private
         * @param {Object} entry the legendBlocks entries
         * @param {String} data the layer formated data
         */
        function setLayer(entry, data) {
            const fieldsType = {
                'number': {},
                'date': {}
            };

            // set fields for the layer
            // it will work for string (from config file) when we implement category filter
            for (let field of data.fields) {
                if (field.type.endsWith('Double') || field.type.endsWith('Integer')) {
                    fieldsType.number[field.name] = field.alias;
                } else if (field.type === 'esriFieldTypeDate') {
                    fieldsType.date[field.name] = field.alias;
                }
            }

            // add slider section to layer with needed properties
            const fields = Object.assign({}, fieldsType.number, fieldsType.date);
            entry.slider = {
                number: fieldsType.number,
                date: fieldsType.date,
                fields: fields,
                field: Object.keys(fields)[0],
                interval: 10,
                ranges: {
                    number: { min: null, max: null },
                    date: { min: null, max: null }
                },
                limits: {
                    number: { min: null, max: null },
                    date: { min: null, max: null }
                } };

            // add the layer to array of layers
            sliderService.addLayer(entry);
        }

        /**
         * Toggle layer settings panel.
         *
         * @function toggleSetting
         * @private
         */
        function toggleSetting() {
            sliderService.toggleSetting();
        }

        /**
         * Toggle svg histogramme panel.
         *
         * @function toggleHisto
         * @private
         */
        function toggleHisto() {
            sliderService.toggleHisto();
        }
    }
}
