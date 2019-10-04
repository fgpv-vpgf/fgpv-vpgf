/**
 * @module ExportComponent
 * @memberof app.ui
 * @requires dependencies
 * @description
 *
 * The `ExportComponent` service returns an ExportComponent class. It's used to create sections of the map export image.
 *
 */
angular.module('app.ui').factory('ExportComponent', ExportComponentFactory);

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
         *                          showToast {Function} - a function display a toast notification for the user
         *                          value {Object} [optional] - any value stored in the component
         *                      generator function may optionally return a value object which will override the component's stored value object (this can be useful if generator updates the value and it needs to persist)
         *                  graphicOrder {Array} [optional=null] - an array if indexes indicating in what order the generator output should be merged; the length must match the number of generator functions; for example graphicOrder [1, 3, 2] will merge the output of the third generator on top of the first, and the output of the second on top of that
         *                  graphicPosition {Array} { justify?: 'start' | 'center' | 'end'; align?: 'start' | 'center' | 'end' } [optional=[]] - an array of positioning info with the same number of items as in `graphicOrder` array; `justify` is horizontal, and `align` is vertical positioning; the default positioning is `center` for both directions
         *                  isVisible {Boolean} [optional=true] - a flag indicating if the component is visible in the export dialog
         *                  isSelectable {Boolean} [optional=true] - a flag indicating if the user can change whether the component is included in the map export image
         *                  isSelected {Boolean} [optional=true] - a flag indicating if the component is included in the map export image
         */
        constructor(
            id,
            {
                value = {},
                generators = [],
                graphicOrder = null,
                graphicPosition = null,
                isVisible = true,
                isSelectable = true,
                isSelected = true
            }
        ) {
            let validToSelect = typeof value !== 'string' || value.length !== 0; // if value is a string and empty, the component would become unselectable

            // handle title differently. Even if empty, show it because user can modify it
            if (id === 'title') {
                validToSelect = true;
                value = typeof value !== 'string' ? '' : value;
            }

            this._id = id;
            this._config = {
                value,
                generators,
                graphicOrder: graphicOrder || generators.map((v, i) => i),
                graphicPosition: graphicPosition || generators.map(() => ({ justify: 'center', align: 'center' })),
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
            return this._config.isSelected && this._graphics.filter(v => v).length !== this._config.generators.length;
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
         * @param {Number} timeout a delay before after which the generation is considered to have failed
         * @param {Function} showToast function to show notification toasts inside the export dialog
         * @param {Boolean} refresh [optional = false] is true, forces generation of the graphics
         * @param {Number} generateId [optional = auto] used to track the most recent generation job to prevent stale graphic from being used
         */
        generate(exportSize, timeout, showToast, refresh = false, generateId = ++this._generateId) {
            if (this._graphic === null || refresh) {
                this._graphics = [];

                // iterate over generators
                return $q.all(
                    this._config.generators.map((generator, generatorIndex) =>
                        // run each one in parallel
                        // generators no longer accept export size parameter; they get it directly from the export size service
                        $q
                            .resolve(generator(showToast, this._config.value, timeout))
                            .then(({ graphic, value = null }) => {
                                // get the results; check if generator job is stale
                                if (this._generateId === generateId) {
                                    // store the graphic in the correct order
                                    const graphicIndex = this._config.graphicOrder[generatorIndex];
                                    this._graphics[graphicIndex] = graphic;

                                    // get the height of the tallest component graphic
                                    const maximumHeight = Math.max(
                                        ...this._graphics.filter(v => v).map(_g => (_g ? _g.height : 0))
                                    );

                                    // create a base canvas with that height and the width of the map image
                                    const baseGraphic = graphicsService.createCanvas();
                                    baseGraphic.width = exportSize.width;
                                    baseGraphic.height = maximumHeight;

                                    // select available graphics and calculate their offsets relative to the base graphic
                                    const available = this._graphics.reduce(
                                        (map, graphic, index) => {
                                            // skip missing graphics or ones with 0 dimensions
                                            if (!graphic || graphic.width === 0 || graphic.height === 0) {
                                                return map;
                                            }

                                            const graphicPosition = this._config.graphicPosition[index];

                                            map.graphics.push(graphic);
                                            map.positions.push([
                                                calculateOffset(
                                                    graphicPosition.justify,
                                                    graphic.width,
                                                    baseGraphic.width
                                                ),
                                                calculateOffset(
                                                    graphicPosition.align,
                                                    graphic.height,
                                                    baseGraphic.height
                                                )
                                            ]);

                                            return map;
                                        },
                                        { graphics: [], positions: [] }
                                    );

                                    // merge currently available graphics in a single canvas using their corresponding positions
                                    this._graphic = graphicsService.mergeCanvases(
                                        [baseGraphic, ...available.graphics],
                                        available.positions
                                    );

                                    // if generator returns a value, store it
                                    if (value !== null) {
                                        this._config.value = value;
                                    }
                                }
                            })
                    )
                );
            }

            return Promise.resolve();
        }
    }

    /**
     * Calculates pixel offsets for canvas elements relative to the supplied container dimension.
     *
     * @param {*} positionValue position value "start", "end", or "center"
     * @param {*} elementDimension
     * @param {*} containerDimension
     * @returns pixel offset
     */
    function calculateOffset(positionValue, elementDimension, containerDimension) {
        switch (positionValue) {
            case 'start':
                return 0;

            case 'center':
                return (containerDimension - elementDimension) / 2;

            case 'end':
                return containerDimension - elementDimension;
        }
    }

    return ExportComponent;
}
