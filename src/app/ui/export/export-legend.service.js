/* global SVG, canvg */
(() => {
    'use strict';

    // margin of the legend container
    const LEGEND_MARGIN = {
        t: 20,
        r: 20,
        b: 20,
        l: 20
    };
    const SECTION_SPACING = 10; // horizontal spacing between legend sections

    const LAYER_GUTTER = 24;
    const GROUP_GUTTER = 16;
    const ITEM_GUTTER = 8;
    const IMAGE_GUTTER = 8;
    const SYMBOL_SIZE = 32;

    /**
     * @ngdoc service
     * @name exportLegendService
     * @module app.ui
     * @requires dependencies
     * @description
     *
     * The `exportLegendService` service generates svg image of the legend breaking into into columns.
     *
     */
    angular
        .module('app.ui')
        .service('exportLegendService', exportLegendService);

    function exportLegendService($q, $rootElement, geoService) {
        const service = {
            generate
        };

        return service;

        /***/

        /**
         * Creates a legend svg graphic from the geoService legend entries.
         * @function generate
         * @param {Number} availableWidth width of the legend graphic, should match width of the exported map image
         * @param {Number} prefferedSectionWidth width of the individual legend sections inside the legend graphic
         * @return {Promise} promise with resovles with a canvas containing the legend
         */
        function generate(availableWidth = 1500, prefferedSectionWidth = 500) {

            // TODO: if section is wider than it's taller, reduce the number of sections
            // TODO: break item names when they overflow even if there are no spaces in the name

            const legendData = extractLegendTree(geoService.legend);

            // make a hidden node to construct a legend in
            const hiddenNode = angular.element('<div>').css('visibility', 'hidden');
            $rootElement.append(hiddenNode);

            const legend = SVG(hiddenNode[0]).size(availableWidth, 100);
            const legendSection = legend.group();

            let sectionCount = Math.floor((availableWidth) / prefferedSectionWidth);
            const sectionWidth =
                (availableWidth -
                    (LEGEND_MARGIN.l + LEGEND_MARGIN.r + (sectionCount - 1) * SECTION_SPACING)) /
                sectionCount;

            legendSection.clear();
            const svgLegend = makeLegend(legendSection, legendData, sectionWidth);
            const sectionHeight = findOptimumSectionHeight(svgLegend, sectionCount);

            wraplegend(svgLegend, sectionHeight, sectionWidth, sectionCount);

            const totalLegendHeight = sectionHeight + LEGEND_MARGIN.t + LEGEND_MARGIN.b;

            // set the height of the legend based on the height of its sections
            legend
                .height(totalLegendHeight)
                .viewbox(0, 0, availableWidth, totalLegendHeight);

            hiddenNode.remove();

            const localCanvas = document.createElement('canvas'); // create canvas element
            const generationPromise = $q(resolve => {
                canvg(localCanvas, legend.node.outerHTML, {
                    ignoreAnimation: true,
                    ignoreMouse: true,
                    renderCallback: () =>
                        resolve(localCanvas)
                });
            });

            return generationPromise;
        }

        /**
         * Finds an optimum legend section height to minimize empty space; also marks legend items for wrapping.
         *
         * Initially, the legend is constructed as a single list (section) and this function determines the best places to wrap it. It iterates over legend items keeping a running height. When the running height is greater than the height of the section, the element straddling the boundary )(with items following it) is wrapped (moved to a new section). Since that element was removed from the section, the total height of remaining elements is less than the section height and the difference is added to the running height.
         *
         * If after splitting the legend into `sectionCount` number of columns, the running height of the legend is greater than `sectionCount x sectionHeight` it means the legend doesn't fit. The section height is increased by 1px and tested again. After the minimum section height is found, do forty two more iterations increasing the section height. After that, pick the section height which results is smallest amount of whitespace. Whitespace is created when large legend elements (wms images) are wrapped.
         *
         * @function findOptimumSectionHeight
         * @private
         * @param {Object} svgLegend generated svg legend in a single columns
         * @param {Number} sectionCount number of sections to break the legend into
         * @return {Number} calculated section height
         */
        function findOptimumSectionHeight(svgLegend, sectionCount) {
            let sectionHeight = svgLegend.height / sectionCount; // naive section height

            let minDelta = sectionHeight;
            let minSectionHeight = sectionHeight;
            let wrapItems = [];

            let repeat = true;
            let iteration = 1; // tracking number of iteration we go through as we try to find an optimum section height

            while (repeat) {
                // console.log('@@', iteration);

                let counter = 1; // section count
                let deltaHeight = 0; // height adjustment when wrapping an item at the lower section boundary
                const tempWrapItems = [];

                if (sectionCount === 1) {
                    break;
                }

                for (let i = 0; i < svgLegend.items.length; i++) {
                    const svg = svgLegend.items[i];

                    if (svg.rbox().height + svg.y() + deltaHeight >= sectionHeight * counter) {
                        deltaHeight += sectionHeight * counter - (svg.y() + deltaHeight);
                        const self = svg.remember('self');
                        tempWrapItems.push(self);

                        counter++;
                    }
                }

                const delta = sectionHeight * sectionCount - (deltaHeight + svgLegend.height);

                sectionHeight += 1;

                if (delta > 0) { // delta > 0 indicates the legend height is less than combined section height
                    iteration++;

                    if (delta < minDelta) {
                        minDelta = delta;
                        minSectionHeight = sectionHeight;
                        wrapItems = tempWrapItems;
                    }

                    // stop after a proper number of iterations and use the section height corresponding to the smallest amount of whitespace
                    if (iteration > 42) {
                        sectionHeight = minSectionHeight;
                        wrapItems.forEach(item =>
                            item.wrap = true);
                        repeat = false;
                    }

                }
            }

            return sectionHeight;
        }

        /**
         * Wraps the single column legend into several by splitting group and redrawing grouping lines
         * @function wraplegend
         * @private
         * @param {Object} svgLegend generated svg legend in a single columns
         * @param {Number} sectionHeight section height
         * @param {Number} sectionWidth section widht
         * @param {Number} sectionCount number of sections to break the legend into
         */
        function wraplegend(svgLegend, sectionHeight, sectionWidth, sectionCount) {

            // create wrap legend sections
            const sections = Array.from(Array(sectionCount)).map(() => svgLegend.container.set());

            let sectionId = 0;
            let currentSection = sections[sectionId];

            const itemStoreSet = svgLegend.container.set(); // create a new set for legend items; set is needed to shift all the items at the same time
            const lineStoreSet = svgLegend.lines; // use a group line set from svgLegend

            // moves legend items from an array to a set
            svgLegend.items.forEach(svg =>
                itemStoreSet.add(svg));

            svgLegend.items.forEach(svg => {
                // wrap the legend at elements previously marked
                if (svg.remember('self').wrap) {

                    const svgY = svg.y();

                    // cut the group lines at the wrapping point
                    let i = lineStoreSet.length();
                    while (i--) {
                        const line = lineStoreSet.get(i);
                        const [lineX, lineY, lineHeight] = [line.x(), line.y(), line.height()];

                        // if the line starts below the wrapping element, skip
                        if (lineY > svgY) {
                            continue;
                        }

                        // if the line starts above and ends below the wrapping element
                        if (lineY + lineHeight > svgY) {
                            // split the line in two parts: above and below the wrap
                            const up = svgLegend.container.line(lineX, lineY, lineX, Math.min(svgY, sectionHeight))
                                .stroke('black');
                            const down = svgLegend.container.line(lineX, svgY, lineX, lineY + lineHeight)
                                .stroke('black');

                            line.remove(); // remove original line
                            currentSection.add(up); // store the above part in the  current section
                            lineStoreSet.add(down); // add the below part to the list store for future wrapping (a single line can wrap and be cut multiple time)

                        } else {
                            currentSection.add(line); // if the line fits in the current section, add it there
                        }

                        lineStoreSet.remove(line); // remove that line from the store so it's not processed at further wrappings
                    }

                    currentSection = sections[++sectionId];

                    // shifts legend items and grouped lines up to wrap up current section
                    itemStoreSet.dy(-svgY);
                    lineStoreSet.dy(-svgY);
                }

                // move a legend item from the bucket store to the current section set
                currentSection.add(svg);
                itemStoreSet.remove(svg);
            });

            // move the left over group lines to the current section
            const lineCount = lineStoreSet.length();
            for (let i = 0; i < lineCount; i++) {
                currentSection.add(lineStoreSet.get(i));
            }

            lineStoreSet.clear();

            // move the sections into proper positions
            sections.forEach((section, index) => {
                const dx = LEGEND_MARGIN.l + sectionWidth * index + SECTION_SPACING * index;

                section.dmove(dx, LEGEND_MARGIN.t);

                // draws borders around individual sections
                /*legend.rect(sectionWidth, sectionHeight)
                    .dmove(dx, LEGEND_MARGIN.t)
                    .fill('transparent').stroke({ color: 'black', opacity: 0.2 }).back();*/
            });
        }

        /**
         * Creates a single column legend from a legend tree object.
         * @function makeLegend
         * @private
         * @param {Object} container parent svg object
         * @param {Array} items top level item in the legend tree object
         * @param {Number} sectionWidth section width to wrap the item name to
         * @return {Object} object with generated legend items and grouping lines, the total legend height and container reference
         */
        function makeLegend(container, items, sectionWidth) {
            let runningHeight = 0;
            let runningIndent = 0;
            const indentD = 16;

            const itemStore = [];
            const lineSet = container.set();

            items.forEach(item => makeLayer(item));

            return {
                container,
                height: runningHeight,
                items: itemStore,
                lines: lineSet
            };

            /**
             * Makes a legend element (header, group, layer, or a symbology item).
             * @function makeLegendElement
             * @private
             * @param {Object} item legend tree item to use
             */
            function makeLegendElement(item) {
                if (item.hasOwnProperty('items')) {
                    makeGroup(item);
                } else {
                    makeItem(item);
                }
            }

            /**
             * Creates a layer legend and adds it to the graphic.
             * @function makeLayer
             * @param {Object} layer layer symbology from the legend tree
             */
            function makeLayer(layer) {
                makeHeader(layer, 18);

                layer.items.forEach(item => {
                    makeLegendElement(item);
                });

                runningHeight += LAYER_GUTTER;
            }

            /**
             * Creates a group legend and adds it to the graphic.
             * @function makeGroup
             * @private
             * @param {Object} group group symbology from the legend tree
             */
            function makeGroup(group) {
                makeHeader(group, 16);

                const startHeight = runningHeight;
                runningIndent++;

                group.items.forEach(item => {
                    makeLegendElement(item);
                });

                runningIndent--;

                const endHeight = runningHeight;
                const line = container
                    .line(runningIndent * indentD, startHeight, runningIndent * indentD, endHeight)
                    .stroke({ color: 'black', width: 1, opacity: 0.8 });
                lineSet.add(line);

                runningHeight += GROUP_GUTTER;
            }

            /**
             * Creates a item legend and adds it to the graphic.
             * @function makeItem
             * @private
             * @param {Object} item item symbology from the legend tree
             */
            function makeItem(item) {
                const { name, svgcode } = item;
                const legendItem = container.group().remember('self', item);
                let flow;

                const flowAttributes = {
                    'font-family': 'Roboto',
                    'font-weight': 'normal',
                    'font-size': 14,
                    anchor: 'start'
                };

                const imageItem = legendItem.group().svg(svgcode).first();
                const imageItemViewbox = imageItem.viewbox();

                if (imageItemViewbox.height > SYMBOL_SIZE || imageItemViewbox.width > SYMBOL_SIZE) {

                    flow = legendItem
                        .textflow(name, sectionWidth - runningIndent * indentD)
                        .attr(flowAttributes)
                        .dy(-4);

                    imageItem
                        .size(imageItemViewbox.width, imageItemViewbox.height)
                        .dy(flow.bbox().height + IMAGE_GUTTER);

                } else {
                    flow = legendItem
                        .textflow(name, sectionWidth - SYMBOL_SIZE - IMAGE_GUTTER - runningIndent * indentD)
                        .attr(flowAttributes)
                        .dmove(SYMBOL_SIZE + IMAGE_GUTTER, -4); // what is -4?

                    // center line if only one
                    if (flow.bbox().height < SYMBOL_SIZE) {
                        flow.cy(SYMBOL_SIZE / 2).dy(-4);
                    }
                }

                legendItem.move(runningIndent * indentD, runningHeight);
                runningHeight += legendItem.rbox().height + ITEM_GUTTER;

                itemStore.push(legendItem);

                return legendItem;
            }

            /**
             * Creates a header and adds it to the graphic.
             * @function makeHeader
             * @private
             * @param {Object} item header item from the legend tree
             * @param {Number} size size of the header
             */
            function makeHeader(item, size) {
                const name = item.name || '';
                const header = container
                    .textflow(name, sectionWidth - runningIndent * indentD)
                    .attr({
                        'font-family': 'Roboto',
                        'font-weight': 'normal',
                        'font-size': size,
                        anchor: 'start'
                    })
                    .remember('self', item)
                    .move(runningIndent * indentD, runningHeight); // TODO: add gutter;

                runningHeight += header.rbox().height + size / 2; // TODO: add gutter

                itemStore.push(header);

                return header;
            }
        }

        /**
         * Extract symbology legend tree from the legend entries
         *
         * @function extractLegendTree
         * @private
         * @param {Object} legendEntry legend entry
         */
        function extractLegendTree(legendEntry) {
            return legendEntry.items
                // filter out placeholders, invisible and "removed" legend entries which are in the "undo" time frame which are not proper

                .filter(item =>
                    item.options.visibility.value &&
                    !item.removed &&
                    item.type !== 'placeholder')

                .map(item => {
                    if (item.type === 'group') {
                        return {
                            name: item.name,
                            items: extractLegendTree(item)
                        };

                    } else if (item.type === 'layer') {
                        return {
                            name: item.name,
                            items: item.symbology.map(({ name, svgcode }) => {
                                return {
                                    name,
                                    svgcode,
                                    type: item.layerType
                                };
                            })
                        };
                    }
                });
        }
    }
})();
