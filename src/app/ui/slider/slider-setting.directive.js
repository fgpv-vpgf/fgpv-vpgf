const templateUrl = require('./slider-setting.html');

/**
 * @module rvSliderSetting
 * @module app.ui
 * @restrict E
 * @description
 *
 * The `rvSliderSetting` directive creates setting panel
 *
 */
angular
    .module('app.ui')
    .directive('rvSliderSetting', rvSliderSetting);

function rvSliderSetting() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: { },
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /*********/

    function Controller(sliderService) {
        'ngInject';
        const self = this;
        self.sliderService = sliderService;
        self.updateLayer = updateLayer;
        self.updateAttribute = updateAttribute;
        self.updateInterval = updateInterval;
        self.updateLimits = updateLimits;
        self.updateRange = updateRange;

        /**
         * Fired when layer is changed from the setting panel. It reinit the slider with the new layer.
         * It will keep value is user returns to this layer
         *
         * @function updateLayer
         */
        function updateLayer() {
            // get the selected layer and set it the active one
            self.activeLayer = sliderService.getLayer(self.selectedLayerId);
            sliderService.setActiveLayer(self.activeLayer);

            // set the field type use (number or date) then init slider
            if (typeof self.activeLayer !== 'undefined') {
                setFieldType();
                setSlider();
            }
        }

        /**
         * Fired when field is changed from the setting panel. It reinit the slider with the new field.
         * It will reinit all values as well
         *
         * @function updateLayer
         */
        function updateAttribute() {
            // set the field type use (number or date)
            setFieldType();

            // resest limits and ranges when we change layer selected field
            const slider = self.activeLayer.slider;
            slider.limits[self.selectedType].min = null;
            slider.limits[self.selectedType].max = null;
            slider.ranges[self.selectedType].min = null;
            slider.ranges[self.selectedType].max = null;

            // init slider
            setSlider();
        }

        /**
         * Set type of field selected by the user (number or date)
         *
         * @function updateLayer
         * @private
         */
        function setFieldType() {
            const slider = self.activeLayer.slider;
            self.selectedType = (slider.number.hasOwnProperty(slider.field)) ? 'number' : 'date';
        }

        /**
         * Reinit slider when interval is modified
         *
         * @function updateInterval
         */
        function updateInterval() {
            setSlider();
        }

        /**
         * Reinit slider when limits are modified
         *
         * @function updateLimits
         */
        function updateLimits() {
            const limits = parseValues('limits');
            const ranges = parseValues('ranges');
            const rangesSlider = self.activeLayer.slider.ranges[self.selectedType];

            // if limits are outside bounds of ranges values, adapt ranges
            if (ranges.min < limits.min) {
                rangesSlider.min = limits.min;
            }
            if (ranges.max > limits.max) {
                rangesSlider.max = limits.max;
            }

            setSlider();
        }

        /**
         * Reinit slider when ranges are modified
         *
         * @function updateRange
         */
        function updateRange() {
            const limits = parseValues('limits');
            const ranges = parseValues('ranges');
            const limitsSlider = self.activeLayer.slider.limits[self.selectedType];

            // if ranges are outside bounds of limits values, adapt limits
            if (ranges.min < limits.min) {
                limitsSlider.min = ranges.min;
                limits.min = ranges.min;
            }
            if (ranges.max > limits.max) {
                limitsSlider.max = ranges.max;
                limits.max = ranges.max;
            }

            setSlider();
        }

        /**
         * Reinit slider with proper values
         *
         * @function setSlider
         * @private
         */
        function setSlider() {
            const limits = parseValues('limits');
            const ranges = parseValues('ranges');
            sliderService.initSlider(self.selectedType, self.activeLayer.slider.interval,
                limits.min, limits.max, ranges.min, ranges.max);
        }

        /**
         * Parse limits and ranges values
         *
         * @function parseValues
         * @private
         * @param {String} type field type (number or date)
         * @return {Object} minimum and maximum parsed values
         */
        function parseValues(type) {
            const slider = self.activeLayer.slider[type][self.selectedType];
            const min = (self.selectedType === 'number') ? slider.min : (slider.min !== null) ? slider.min : null;
            const max = (self.selectedType === 'number') ? slider.max : (slider.max !== null) ? slider.max : null;

            return { min, max };
        }
    }
}