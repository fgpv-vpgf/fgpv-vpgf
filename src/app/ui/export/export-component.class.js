/**
 * @module ExportComponent
 * @memberof app.ui
 * @requires dependencies
 * @description
 *
 * The `ExportComponent` service returns an ExportComponent class. It's used to create sections of the map export image.
 *
 */
angular
    .module('app.ui')
    .factory('ExportComponent', ExportComponentFactory);

function ExportComponentFactory($q, graphicsService) {
    class ExportComponent {
        /**
         * @function constructor
         * @param {String} id internal name of the component
         * @param {ExportComponent} [optional] optional initial setting of the component
         *                  value {Object} [optional={}] - value object which will be passed to component generators
         *                  generators {Array} [optional=[]] - an array of graphic generator functions
         *                      a generator function takes three parameters:
         *                          exportSize {ExportSize} - the currently selected map size
         *                          showToast {Function} - a function display a toast notifcation for the user
         *                          value {Object} [optional] - any value stored in the component
         *                      generator function may optionally return a value object which will override the component's stored value object (this can be useful if generator updates the value and it needs to persist)
         *                  graphicOrder {Array} [optional=null - an array if indexes indicating in what order the generator output should be merged; the length must match the number of generator functions; for example graphicorder [1, 3, 2] will merge the output of the third generator on top of the first, and the output of the second on top of that
         *                  isVisible {Boolean} [optional=true] - a flag indicating if the component is visible in the export dialog
         *                  isSelectable {Boolean} [optional=true] - a flag indicating if the user can change wheather the compoenent is included in the map export image
         *                  isSelected {Boolean} [optional=true] - a flag indicating if the compoenent is included in the map export image
         */
        constructor(id, { value = {}, generators = [], graphicOrder = null, isVisible = true,
            isSelectable = true, isSelected = true }) {
            const validToSelect = typeof value !== 'string' || value.length !== 0; // if value is a string and emtpy, the component would become unselectable
            this._id = id;
            this._config = {
                value,
                generators,
                graphicOrder: graphicOrder || generators.map((v, i) => i),
                isVisible,
                isSelectable: isSelectable && validToSelect,
                isSelected: isSelected && validToSelect
            };

            this._graphic = null;
            this._graphics = [];
            this._generateId = 0;
        }

        get value() {
            return this._config.value;
        }

        set value(value) {
            this._config.value = value;
        }

        get id() {
            return this._id;
        }

        get graphic() {
            return this._graphic;
        }

        get isSelected() {
            return this._config.isSelected;
        }

        set isSelected(value) {
            this._config.isSelected = value;
        }

        get isVisible() {
            return this._config.isVisible;
        }

        get isGenerating() {
            // Checks if the component is blocking image saving. If this component is included but the generation hasn't completed yet, it's blocking.
            return this._config.isSelected &&
                this._graphics.filter(v => v).length !== this._config.generators.length;
        }

        get isSelectable() {
            return this._config.isSelectable;
        }

        /**
         * Resets the current graphic to null.
         * @function reset
         * @return {Object} itself
         */
        reset() {
            this._graphic = null;
            this._graphics = [];

            return this;
        }

        /**
         * Generates component graphics if they are null (or if forced) using the generator functions and merging their outputs in the correct order (graphicOrder)
         * @function generate
         * @param {ExportSize} exportSize the currently selected map size
         * @param {Function} showToast function to show notification toasts inside the export dialog
         * @param {Boolean} refresh [optional = false] is true, forces generation of the graphics
         * @param {Number} generateId [optional = auto] used to track the most recent generation job to prevent stale graphic from being used
         */
        generate(exportSize, showToast, refresh = false, generateId = ++this._generateId) {
            if (this._graphic === null || refresh) {

                this._graphics = [];

                // iterate over generators
                this._config.generators.forEach((generator, generatorIndex) =>

                    // run each one in parallel
                    $q.resolve(generator(exportSize, showToast, this._config.value))
                        .then(({ graphic, value = null }) => {
                            // get the results; check if generator job is stale
                            if (this._generateId === generateId) {

                                // store the graphic in the correct order
                                const graphicIndex = this._config.graphicOrder[generatorIndex];
                                this._graphics[graphicIndex] = graphic;

                                // merge currently available graphics in a single canvas
                                this._graphic = graphicsService.mergeCanvases(this._graphics);

                                // if generator returns a value, store it
                                if (value !== null) {
                                    this._config.value = value;
                                }
                            }
                        })
                );
            }
        }
    }

    return ExportComponent;
}
