/**
 * @module sliderService
 * @memberof app.ui
 * @description
 *
 * The `sliderService` is ...
 *
 */
angular
    .module('app.ui')
    .factory('sliderService', sliderService);

function sliderService($rootScope, events, $filter, $timeout) {

    const service = {
        initSlider,
        stepSlider,
        refreshSlider,
        lock,
        addLayer,
        getLayer,
        setActiveLayer,
        toggleSetting,
        toggleHisto,
        isSettingOpen: true,
        isHistoOpen: true,
        slider: { lock: true },
        layersName: {}
    };

    let layers =[];
    let activeLayer;
    let activeType;

    init();

    return service;

    /************/

    /**
     * Initialize the slideEnded event to set the definition query.
     *
     * @function init
     * @private
     */
    function init() {
        $rootScope.$on('slideEnded', () => {
            setDefQuery();
        });
    }

    /**
     * Initialize the slider.
     *
     * @function initSlider
     *
     * @param {String} type type of slider (number or date)
     * @param {Interger} interval number of intervals to use to show the data
     * @param {Number} limitMin the minimum limit for the dataset. If null, use dataset minimum value
     * @param {Number} limitMax the maximum limit for the dataset. If null, use dataset maximum value
     * @param {Number} rangeMin the minimum range value. If null, use dataset minimum value
     * @param {Number} rangeMax the maximum range value. If null, use dataset maximum value
     */
    function initSlider(type, interval, limitMin = null, limitMax = null, rangeMin = null, rangeMax = null) {
        activeType = type;

        limitMin = (limitMin !== null && typeof limitMin !== 'number') ? limitMin.getTime() : limitMin;
        limitMax = (limitMin !== null && typeof limitMin !== 'number') ? limitMax.getTime() : limitMax;

        getStats(type, interval, limitMin, limitMax).then(stats => {
            const info = getSliderInfo(stats, interval, limitMin, limitMax, rangeMin, rangeMax);

            service.slider = {
                lock:  service.slider.lock,
                interval: interval,
                type: activeType,
                minValue: (typeof info.minValue === 'number') ? info.minValue : info.minValue.getTime(),
                maxValue: (typeof info.maxValue === 'number') ? info.maxValue : info.maxValue.getTime(),
                options: {
                    floor: (typeof info.floor === 'number') ? info.floor : info.floor.getTime(),
                    ceil: (typeof info.ceil === 'number') ? info.ceil : info.ceil.getTime(),
                    step: info.step,
                    precision: info.precision,
                    noSwitching: true,
                    showTicks: true,
                    draggableRange: true,
                    enforceStep: false
                }
            };

            if (activeType === 'date') {
                service.slider.options.translate = dateMillis => {
                    return formatDate(dateMillis);
                }
            }

            setDefQuery();

            // set handles WCAG
            setwcagHandles();
        });
    }

    /**
     * Get the slider information to initalize.
     *
     * @function getSliderInfo
     * @private
     * @param {Object} stats Object who contains minimum and maximum values for the dataset
     * @param {Interger} interval number of intervals to use to show the data
     * @param {Number} limitMin the minimum limit for the dataset. If null, use dataset minimum value
     * @param {Number} limitMax the maximum limit for the dataset. If null, use dataset maximum value
     * @param {Number} rangeMin the minimum range value. If null, use dataset minimum value
     * @param {Number} rangeMax the maximum range value. If null, use dataset maximum value
     * @return {Object} contain the minimum and maximum range, minimum and maximum limits, step for each interval and step precision
     */
    function getSliderInfo(stats, interval, limitMin, limitMax, rangeMin, rangeMax) {
        const step = (stats.max - stats.min) / interval;
        const precision = (step.toString().split('.')[1] || []).length;

        let minValue = (rangeMin !== null) ? rangeMin : stats.min;
        let maxValue = (rangeMax !== null) ? rangeMax : stats.max;
        let floor = (limitMin !== null) ? limitMin : stats.min;
        let ceil = (limitMax !== null) ? limitMax : stats.max;

        return { minValue, maxValue, floor, ceil, step, precision };
    }

    /**
     * Set the slider handles WCAG (tabable).
     *
     * @function setwcagHandles
     * @private
     */
    function setwcagHandles() {
        // set tabindex on hadle to be wcag (needs the timeout because it is reset to 0 if not)
        // to have an element focusable inside the RAMP container, its tabindex must not be 0;
        // tabindex 0 is controlled by the browser; RAMP focus manager will ignore such elements and not set focus to them;
        $timeout(() => {
            Array.from(document.getElementsByClassName('rz-pointer')).forEach(handle => { handle.tabIndex = '-2' });
        }, 100);
    }

    /**
     * Format fdate from milliseconds to day/month/year.
     *
     * @function formatDate
     * @private
     * @param {Interger} dateMillis number of intervals to use to show the data
     * @return {String} formated date
     */
    function formatDate(dateMillis) {
        const date = new Date(dateMillis);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }

    /**
     * Set the definition query to apply to the layer.
     *
     * @function setDefQuery
     * @private
     */
    function setDefQuery() {
        const layerSlider = activeLayer.slider;
        const attr = layerSlider.field;
        const slider = service.slider;

        // synchronize range
        layerSlider.ranges[activeType].min = (activeType === 'number') ? slider.minValue : new Date(slider.minValue);
        layerSlider.ranges[activeType].max = (activeType === 'number') ? slider.maxValue : new Date(slider.maxValue);

        if (activeType === 'number') {
            activeLayer.definitionQuery = `${attr} >=  ${slider.minValue} AND ${attr} <  ${slider.maxValue}`;
        } else {
            const min = new Date(slider.minValue);
            const max = new Date(slider.maxValue);
            const dateMin = `${min.getMonth() + 1}/${min.getDate()}/${min.getFullYear()}`;
            const dateMax = `${max.getMonth() + 1}/${max.getDate()}/${max.getFullYear()}`;
            activeLayer.definitionQuery = `${attr} >= DATE \'${dateMin}\' AND ${attr} <= DATE \'${dateMax}\'`;
        }

        // calculate count / percent
        const values = [];
        activeLayer.formattedData.then(data => {
            for (let feature of data.rows) {
                if (feature[attr] >= slider.minValue &&
                        feature[attr] <= slider.maxValue) {
                    values.push(feature[attr]);
                }
            }

            layerSlider.selectCount = values.length
            layerSlider.percentCount = Math.ceil(values.length / layerSlider.count * 100);
        });
    }

    /**
     * Get statistics about the layer to set the slider.
     *
     * @function getStats
     * @private
     * @param {String} type type of slider (number or date)
     * @param {Interger} interval number of intervals to use to show the data
     * @param {Number} limitMin the minimum limit for the dataset. If null, use dataset minimum value
     * @param {Number} limitMax the maximum limit for the dataset. If null, use dataset maximum value
     * @return {Object} contain the minimum and maximum datasets limits
     */
    function getStats(type, interval, limitMin = null, limitMax = null) {
        const values = [];

        return new Promise(resolve => {
            activeLayer.formattedData.then(data => {

                // get values
                for (let feature of data.rows) {
                    values.push(feature[activeLayer.slider.field]);
                }

                // check with limits to use. If null, use the calculated one
                const min = (limitMin === null) ? Math.min.apply(null, values) : limitMin;
                const max = (limitMax === null) ? Math.max.apply(null, values) : limitMax;
                activeLayer.slider.count = values.length;

                // calculate the delta then get the range of one interval
                const delta = max - min;
                const range = delta / interval;

                // calculate the number of elements by interval
                let bounds = min;
                let i = 0;
                const items = [];
                while (i <= interval) {
                    if (i !== interval) {
                        items.push(getCount(values, bounds, bounds + range));
                    } else {
                        // last loop, add item === to max to the last interval
                        items[interval -1] = items[interval -1] + getCount(values, bounds, bounds + range);
                    }

                    bounds += range;
                    i++;
                }

                // draw svg rectangles
                drawSVG(items, interval);

                // synchronize limits
                if (type === 'date') {
                    activeLayer.slider.limits[activeType].min = new Date(min);
                    activeLayer.slider.limits[activeType].max = new Date(max);
                } else {
                    activeLayer.slider.limits[activeType].min = min;
                    activeLayer.slider.limits[activeType].max = max;
                }

                resolve({ min, max });
            });
        });
    }

    /**
     * Return the number of elements selected inside limits.
     *
     * @function setwcagHandles
     *
     * @param {Array} values array of values to filter
     * @param {Number} min the minimum value for the filter
     * @param {Number} max the maximum value for the filter
     * @return {Integer} number of element filtered
     */
    function getCount(values, min, max) {
        return values.filter(value => value >= min && value < max).length;
    }

    /**
     * Draw svg rectangles from the array of values distribution.
     *
     * @function drawSVG
     * @private
     * @param {Array} rectangles array who contains number of elements for each interval
     * @param {Interger} interval the interval
     * @param {Number} max the maximum value for the filter
     */
    function drawSVG(rectangles, interval) {
        const svgElem = document.getElementById('drawing');
        const width = (svgElem.closest('.rv-slider-histo').offsetWidth - 24) / interval;
        const maxHeight = Math.max(...rectangles);

        // clean before adding
        while (svgElem.firstChild) {
            svgElem.removeChild(svgElem.firstChild);
        }

        const draw = SVG('drawing').size('100%', '100%');
        let start = 0;
        for (let rect of rectangles) {
            const height = (rect * 50) / maxHeight;
            draw.rect(width, height)
                .attr({ 'fill': '#ffe6ff', 'stroke': 'black', 'stroke-width': 1 }).move(start, 50 - height);

            start += width;
        }
    }

    /**
     * Step the slider range.
     *
     * @function setwcagHandles
     *
     * @param {String} side side for the step (up or down)
     * @return {Boolean} true if left anchor is at the right limits (need to pause if playing)
     */
    function stepSlider(side) {
        const slider = service.slider;
        const limits = activeLayer.slider.limits[activeType];

        // set step and get the precision to round range values
        let step = (side === 'up') ? slider.options.step : -slider.options.step;
        const precision = (step.toString().split('.')[1] || []).length;

        // set left anchor
        slider.minValue = (slider.lock) ? slider.minValue :
            setLeftAnchor(side, step, precision, slider.minValue, slider.maxValue, limits.min, limits.max);

        // set right anchor
        slider.maxValue = setRightAnchor(side, step, precision, slider.minValue, slider.maxValue, limits.min, limits.max);

        // event to trigger the definition query update
        events.$broadcast('slideEnded');

        return (limits.max - parseInt(slider.maxValue)) < step;
    }

    /**
     * Set the left anchor values.
     *
     * @function setLeftAnchor
     * @private
     * @param {String} side side for the step (up or down)
     * @param {Number} step step value
     * @param {Number} precision precision to use for stepping
     * @param {Number} sliderMin the minimum range value
     * @param {Number} sliderMax the maximum range value
     * @param {Number} limitMin the minimum limit for the dataset
     * @param {Number} limitMax the maximum limit for the dataset
     * @return {Number} value for left anchor
     */
    function setLeftAnchor(side, step, precision, sliderMin, sliderMax, limitMin, limitMax) {
        let value = 0;
        if (side === 'down') {
            // left anchor needs to be higher or equal to min limit
            if (Math.floor(sliderMin + step) < limitMin) {
                value = limitMin;
            } else {
                value = sliderMin + step;
            }
        } else {
            // left anchor needs to be lower the max limit and right anchor value
            if (Math.ceil(sliderMin + step) < limitMax && Math.ceil(sliderMin + step) < sliderMax + step) {
                value = sliderMin + step;
            } else {
                value = sliderMin;
            }
        }

        return parseFloat(value.toFixed(precision));
    }

    /**
     * Set the right anchor values.
     *
     * @function setRightAnchor
     * @private
     * @param {String} side side for the step (up or down)
     * @param {Number} step step value
     * @param {Number} precision precision to use for stepping
     * @param {Number} sliderMin the minimum range value
     * @param {Number} sliderMax the maximum range value
     * @param {Number} limitMin the minimum limit for the dataset
     * @param {Number} limitMax the maximum limit for the dataset
     * @return {Number} value for right anchor
     */
    function setRightAnchor(side, step, precision, sliderMin, sliderMax, limitMin, limitMax) {
        let value = 0;
        if (side === 'up') {
            // right anchor needs to be lower or equal to max limit
            if (Math.ceil(sliderMax + step) > limitMax) {
                value = limitMax;
            } else {
                value = sliderMax + step;
            }
        } else {
            // right anchor needs to be higher the min limit and left anchor value
            if (Math.floor(sliderMax + step) > limitMin && Math.floor(sliderMax + step) > sliderMin + step) {
                value = sliderMax + step;
            } else {
                value = sliderMax;
            }
        }

        return parseFloat(value.toFixed(precision));
    }

    /**
     * Refresh slider.
     *
     * @function refreshSlider
     */
    function refreshSlider() {
        initSlider(service.slider.type, service.slider.interval);
    }

    /**
     * Set tif left anchor is lock or not.
     *
     * @function lock
     *
     * @param {Boolean} isLocked true if lock; false otherwise
     */
    function lock(isLocked) {
        service.slider.lock = isLocked;
    }

    /**
     * Toggle settings panel.
     *
     * @function toggleSetting
     */
    function toggleSetting() {
        service.isSettingOpen = !service.isSettingOpen;
    }

    /**
     * Toggle histogram panel.
     *
     * @function toggleSetting
     */
    function toggleHisto() {
        service.isHistoOpen = !service.isHistoOpen;

        const elem = document.getElementsByClassName('rz-selection')[0];
        elem.style.height =  service.isHistoOpen ? '95px' : '20px';
    }

    /**
     * Toggle settings panel.
     *
     * @function addLayer
     *
     * @param {Object} layer layer to add to the slider
     */
    function addLayer(layer) {
        layers.push(layer);
        service.layersName[layer._layerRecordId] = layer.name;
    }

    /**
     * Get a layer from id.
     *
     * @function getLayer
     *
     * @param {String} id layer id
     * @return {Object} selectLayer the selected layer
     */
    function getLayer(id) {
        let selectLayer;
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]._layerRecordId === id) selectLayer = layers[i];
        }

        return selectLayer;
    }

    /**
     * Set the active layer.
     *
     * @function setActiveLayer
     *
     * @param {Object} layer layer to use as selected layer
     */
    function setActiveLayer(layer) {
        activeLayer = layer;
    }
}