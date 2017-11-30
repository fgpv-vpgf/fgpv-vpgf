import marked from 'marked';
import removeMd from 'remove-markdown';

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
 *
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

function exportLegendService($q, $rootElement, geoService, LegendBlock, configService, gapiService, graphicsService) {
    const service = {
        generate
    };

    return service;

    /***/

    /**
     * Creates a legend svg graphic from the geoService legend entries.
     * @function generate
     * @param {Number} availableHeight map height, used in legend wraping logic
     * @param {Number} availableWidth width of the legend graphic, should match width of the exported map image
     * @param {Number} preferredSectionWidth width of the individual legend sections inside the legend graphic
     * @return {Promise} promise with resolves with a canvas containing the legend
     */
    function generate(availableHeight = 500, availableWidth = 1500, preferredSectionWidth = 500) {

        // I think this todo is done.
        // TODO: break item names when they overflow even if there are no spaces in the name

        const legendData = extractLegendTree(configService.getSync.map.legendBlocks);

        // resolve with an empty 0 x 0 canvas if there is not layers in the legend
        if (legendData.length === 0) {
            return $q.resolve(graphicsService.createCanvas(0, 0));
        }

        // make a hidden node to construct a legend in
        const hiddenNode = angular.element('<div>').css('visibility', 'hidden');
        $rootElement.append(hiddenNode);

        const legend = SVG(hiddenNode[0]).size(availableWidth, 100);
        const legendSection = legend.group();

        const sectionInfo = {
            count: Math.floor(availableWidth / preferredSectionWidth) || 1, // section count should never be 0
            width: 0,
            height: 0
        };

        let svgLegend; // object containing  arrays of svg elements
        let legendDataCopy; // clone the legendData object since it will be modified in place
        let sectionsUsed = null;

        // keep optimizing while the number of used sections differs from the number of available sections
        while (sectionsUsed !== sectionInfo.count) {
            legendDataCopy = angular.copy(legendData);
            sectionInfo.count = sectionsUsed || sectionInfo.count;
            sectionInfo.width = getSectionWidth();

            legendSection.clear();

            // create svg legend
            svgLegend = makeLegend(legendSection, legendDataCopy, sectionInfo.width);

            // optimize; get back the number of sections used
            // if only one column available, ignore optimization
            sectionsUsed = sectionInfo.count === 1 ?
                1 :
                gapiService.gapi.legend.makeLegend(legendDataCopy, sectionInfo.count, availableHeight)
                    .sectionsUsed;
        }

        wraplegend(svgLegend, sectionInfo);

        const totalLegendHeight = sectionInfo.height + LEGEND_MARGIN.t + LEGEND_MARGIN.b;

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

        /**
         * Helper function which calculates the section width based on the number of sections and margins.
         * @function getSectionWidth
         * @private
         * @return {Number} returns the section width
         */
        function getSectionWidth() {
            return (availableWidth -
                (LEGEND_MARGIN.l + LEGEND_MARGIN.r + (sectionInfo.count - 1) * SECTION_SPACING)) /
            sectionInfo.count;
        }
    }

    /**
     * Wraps the single column legend into several by splitting group and redrawing grouping lines
     * @function wraplegend
     * @private
     * @param {Object} svgLegend generated svg legend in a single columns
     * @param {Object} sectionInfo object with the following section parameters:
     *                 {Number} sectionHeight section height
     *                 {Number} sectionWidth section widht
     *                 {Number} sectionCount number of sections to break the legend into
     */
    function wraplegend(svgLegend, sectionInfo) {

        // create wrap legend sections
        const sections = Array.from(Array(sectionInfo.count)).map(() => svgLegend.container.set());

        let sectionId = 0;
        let currentSection = sections[sectionId];

        const itemStoreSet = svgLegend.container.set(); // create a new set for legend items; set is needed to shift all the items at the same time
        const lineStoreSet = svgLegend.lines; // use a group line set from svgLegend

        // moves legend items from an array to a set
        svgLegend.items.forEach(svg =>
            itemStoreSet.add(svg));

        svgLegend.items.forEach(svg => {
            // wrap the legend at elements previously marked
            if (svg.remember('self').splitBefore) {

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
                        const up = svgLegend.container.line(lineX, lineY, lineX, Math.min(svgY, sectionInfo.height))
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
            const dx = LEGEND_MARGIN.l + sectionInfo.width * index + SECTION_SPACING * index;

            sectionInfo.height = Math.max(sectionInfo.height, section.bbox().h);
            section.dmove(dx, LEGEND_MARGIN.t);

            // draws borders around individual sections
            /*legend.rect(sectionInfo.width, sectionInfo.height)
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
            const startHeight = runningHeight;

            makeHeader(layer, 18);

            layer.items.forEach(item => {
                makeLegendElement(item);
            });

            layer.height = runningHeight - startHeight;

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

            group.height = runningHeight - startHeight;

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

            /// Use the narrower width as the bound for the image
            if (imageItemViewbox.width > sectionWidth){
                const imgLookFactor = 0.9; // So it'd have space on left and right for the visual look
                imageItemViewbox.height *= ((sectionWidth / imageItemViewbox.width) * imgLookFactor);
                imageItemViewbox.width = sectionWidth * imgLookFactor;
            }

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
            const heightToAppend = (legendItem.rbox().height > imageItemViewbox.height) ? legendItem.rbox().height : imageItemViewbox.height;
            runningHeight += heightToAppend + ITEM_GUTTER;

            item.height = legendItem.rbox().height;
            item.y = legendItem.y();

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

            // store header height and its position for future legend wrapping
            item.headerHeight = header.rbox().height;
            item.y = header.y();
            runningHeight += item.headerHeight + size / 2; // TODO: add gutter

            itemStore.push(header);

            return header;
        }
    }

    /**
     * Extract the flat symbology legend tree from the legend blocks
     *
     * @function extractLegendTree
     * @private
     * @param {LegendBlock} legendBlock the root legend block from which to extract the flat symbology tree.
     * @return {Array} a flat array of layers and their symbology items
     */
    function extractLegendTree(legendBlock) {

        const TYPE_TO_SYMBOLOGY = {
            [LegendBlock.TYPES.NODE]: entry =>
                ({
                    name: entry.name,
                    items: entry.symbologyStack.stack
                }),
            [LegendBlock.TYPES.GROUP]: entry =>
                ({
                    name: entry.name,
                    items: extractLegendTree(entry)
                }),
            [LegendBlock.TYPES.SET]: () => null,
            [LegendBlock.TYPES.INFO]: entry => {
                if (entry.infoType === 'image') {
                    const svgCode = _createSVGCode(entry.content);
                    return {
                        name: '',
                        items: [{ name: '', svgcode: svgCode }],
                        blockType: LegendBlock.TYPES.INFO
                    }
                } else {
                    const content = entry.layerName || entry.content;

                    // ie can't handle fancy markdown image rendering so we strip markdown entirely
                    if (RV.isIE) {
                        return {
                            name: removeMd(content),
                            items: entry.symbologyStack.stack || [],
                            blockType: LegendBlock.TYPES.INFO
                        }
                    }

                    const contentToHtml = marked(content);

                    // if no markdown was parsed, return as text
                    if (content === contentToHtml) {
                        return {
                            name: entry.layerName || entry.content,
                            items: entry.symbologyStack.stack || [],
                            blockType: LegendBlock.TYPES.INFO
                        }
                    }

                    const canvas = service.canvas || (service.canvas = document.createElement('canvas'));
                    const ctx = canvas.getContext('2d');

                    // compute the actual width of content HTML if it were a single line
                    let actualWidth = ctx.measureText(contentToHtml).width;
                    // reduce width to 300 if actual width exceeds this - this avoids one long line being scaled down to ant man sized text
                    let correctedWidth = Math.min(300, actualWidth);
                    // estimate the rendered height
                    let approxHeight = Math.ceil(actualWidth / correctedWidth) * 25 + 25;

                    // draw an image to the canvas using this XML SVG wrapper
                    const data = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="${correctedWidth}" height="${approxHeight}">
                            <foreignObject width="100%" height="100%">
                                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Roboto, 'Helvetica Neue', sans-serif;font-size: 14px;font-weight: 400;letter-spacing: 0.010em;line-height: 20px;">${contentToHtml}</div>
                            </foreignObject>
                        </svg>
                    `;

                    const DOMURL = window.URL || window.webkitURL || window;
                    const img = new Image();
                    const svg = new Blob([data], {type: 'image/svg+xml'});
                    const url = DOMURL.createObjectURL(svg);

                    img.onload = function() {
                      ctx.drawImage(this, 0, 0);
                      DOMURL.revokeObjectURL(url);
                    }

                    img.src = url;

                    // we now have a local image and URL that we can wrap in a legend generator supported svg element
                    return {
                        name: '',
                        items: [{ name: '', svgcode: `<svg xmlns:xlink="http://www.w3.org/1999/xlink" height="${approxHeight}" width="${correctedWidth}"><image height="${approxHeight}" width="${correctedWidth}" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${url}"></image></svg>` }].concat(entry.symbologyStack.stack || []),
                        blockType: LegendBlock.TYPES.INFO
                    }
                }
            }
        }

        // TODO: decide if symbology from the duplicated layer should be included in the export image
        const legendTreeData = legendBlock
            .walk(entry => _showBlock(entry) ?
                    TYPE_TO_SYMBOLOGY[entry.blockType](entry) : null,
                entry => entry.blockType === LegendBlock.TYPES.GROUP ? false : true)      // don't walk entry's children if it's a group
            .filter(a =>
                a !== null);
        return legendTreeData.filter(entry => entry.blockType === LegendBlock.TYPES.INFO || entry.items.length > 0);
    }

    /**
     * Identifies if legend block should be shown in export legend
     *
     * @function _showBlock
     * @private
     * @param {LegendBlock} entry the legend block to be checked whether it should be shown
     * @return {Boolean} true if block should be shown in export legend
     */
    function _showBlock(entry) {
        const exportLegend = configService.getSync.services.export.legend;

        if (entry.blockType === LegendBlock.TYPES.INFO) {
            return exportLegend.showInfoSymbology;
        } else if (entry.controlled) {
            return exportLegend.showControlledSymbology && entry.isVisibleOnExport;
        }

        return entry.isVisibleOnExport;
    }

    /**
     * Helper function to get HTML fragment of SVG element provided a URL
     *
     * @function _createSVGCode
     * @private
     * @param {String} link the link of an image
     * @return {String} the HTML fragment of the SVG element created
     */
    function _createSVGCode(link) {
        const img = $rootElement.find(`[src="${link}"]`)[0];

        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        svg.setAttribute('height', img.naturalHeight);
        svg.setAttribute('width', img.naturalWidth);

        let svgimg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        svgimg.setAttribute('height', img.naturalHeight);
        svgimg.setAttribute('width', img.naturalWidth);
        svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', link);

        svg.appendChild(svgimg);

        return svg.outerHTML;
    }
}
