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
const INFO_GUTTER = 24;
const ITEM_GUTTER = 8;
const IMAGE_GUTTER = 8;
const SYMBOL_SIZE = 32;

const INFO_FONT_SIZE = 14;

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
angular.module('app.ui').service('exportLegendService', exportLegendService);

function exportLegendService($q, $rootElement, LegendBlock, configService, gapiService, graphicsService) {
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
    async function generate(availableHeight = 500, availableWidth = 1500, preferredSectionWidth = 500) {
        // I think this todo is done.
        // TODO: break item names when they overflow even if there are no spaces in the name

        const legendData = await extractLegendTree(
            configService.getSync.map.legendBlocks,
            preferredSectionWidth,
            availableWidth
        );

        // resolve with an empty 0 x 0 canvas if there is no layers in the legend
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
            sectionInfo.count = sectionsUsed || sectionInfo.count;
            sectionInfo.width = getSectionWidth();
            legendDataCopy = angular.copy(
                await extractLegendTree(configService.getSync.map.legendBlocks, sectionInfo.width, availableWidth)
            );

            legendSection.clear();

            // create svg legend
            svgLegend = makeLegend(legendSection, legendDataCopy, sectionInfo.width);

            // optimize; get back the number of sections used
            // if only one column available, ignore optimization
            sectionsUsed =
                sectionInfo.count === 1
                    ? 1
                    : gapiService.gapi.legend.makeLegend(legendDataCopy, sectionInfo.count, availableHeight)
                          .sectionsUsed;
        }

        wraplegend(svgLegend, sectionInfo);

        const totalLegendHeight = sectionInfo.height + LEGEND_MARGIN.t + LEGEND_MARGIN.b;

        // set the height of the legend based on the height of its sections
        legend.height(totalLegendHeight).viewbox(0, 0, availableWidth, totalLegendHeight);

        hiddenNode.remove();

        const localCanvas = document.createElement('canvas'); // create canvas element
        const generationPromise = new Promise(resolve => {
            canvg(localCanvas, legend.node.outerHTML, {
                ignoreAnimation: true,
                ignoreMouse: true,
                renderCallback: () => resolve(localCanvas)
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
            return (
                (availableWidth - (LEGEND_MARGIN.l + LEGEND_MARGIN.r + (sectionInfo.count - 1) * SECTION_SPACING)) /
                sectionInfo.count
            );
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
        svgLegend.items.forEach(svg => itemStoreSet.add(svg));

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
                        const up = svgLegend.container
                            .line(lineX, lineY, lineX, Math.min(svgY, sectionInfo.height))
                            .stroke('black');
                        const down = svgLegend.container.line(lineX, svgY, lineX, lineY + lineHeight).stroke('black');

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

        items.forEach(item => makeLegendElement(item));

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
            if (item.blockType && item.blockType === LegendBlock.TYPES.INFO) {
                // IE uses item.name to store its info sections, make a header and add the gutter
                if (item.name !== '') {
                    makeHeader(item, INFO_FONT_SIZE);
                    runningHeight += INFO_GUTTER;
                }
                item.items.forEach(item => {
                    makeInfoItem(item);
                });
            } else if (item.hasOwnProperty('items')) {
                makeLayer(item);
            } else {
                makeSymbolItem(item);
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
                if (item.hasOwnProperty('items')) {
                    makeGroup(item);
                } else {
                    makeSymbolItem(item);
                }
            });

            // take away the last symbol item's gutter, adds unneeded whitespace
            runningHeight -= ITEM_GUTTER;

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
         * @returns {Object} the item being added
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

            const imageItem = legendItem
                .group()
                .svg(svgcode)
                .first();
            const imageItemViewbox = imageItem.viewbox();

            /// Use the narrower width as the bound for the image
            if (imageItemViewbox.width > sectionWidth) {
                const imgLookFactor = 0.9; // So it'd have space on left and right for the visual look
                imageItemViewbox.height *= (sectionWidth / imageItemViewbox.width) * imgLookFactor;
                imageItemViewbox.width = sectionWidth * imgLookFactor;
            }

            if (imageItemViewbox.height > SYMBOL_SIZE || imageItemViewbox.width > SYMBOL_SIZE) {
                flow = legendItem
                    .textflow(name, sectionWidth - runningIndent * indentD)
                    .attr(flowAttributes)
                    .dy(-4);

                imageItem.size(imageItemViewbox.width, imageItemViewbox.height).dy(flow.bbox().height + IMAGE_GUTTER);
            } else {
                flow = legendItem
                    .textflow(name, sectionWidth - SYMBOL_SIZE - IMAGE_GUTTER - runningIndent * indentD)
                    .attr(flowAttributes)
                    .dmove(SYMBOL_SIZE + IMAGE_GUTTER, -4); // (x, y)

                // center line if only one
                if (flow.bbox().height < SYMBOL_SIZE) {
                    flow.cy(SYMBOL_SIZE / 2).dy(-4);
                }
            }

            legendItem.move(runningIndent * indentD, runningHeight);
            runningHeight += Math.max(legendItem.rbox().height, imageItemViewbox.height);

            item.height = legendItem.rbox().height;
            item.y = legendItem.y();

            itemStore.push(legendItem);

            return legendItem;
        }

        /**
         * Calls makeItem with item and adds the proper gutter for info sections
         *
         * @function makeInfoItem
         * @private
         * @param {Object} item item symbology from the legend tree
         */
        function makeInfoItem(item) {
            // info sections have a lot of room at the top, take away the gutter space to make them display better
            runningHeight -= INFO_GUTTER;
            makeItem(item);
            runningHeight += INFO_GUTTER;
        }

        /**
         * Calls makeItem with item and adds the proper gutter for symbology
         *
         * @function makeInfoItem
         * @private
         * @param {Object} item item symbology from the legend tree
         */
        function makeSymbolItem(item) {
            makeItem(item);
            runningHeight += ITEM_GUTTER;
        }

        /**
         * Creates a header and adds it to the graphic.
         * @function makeHeader
         * @private
         * @param {Object} item header item from the legend tree
         * @param {Number} size size of the header
         * @returns {Object} the header being added
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
     * @param {Number} sectionWidth the width of the current section
     * @param {Number} availableWidth the max width of the legend
     * @return {Array} a flat array of layers and their symbology items
     */
    function extractLegendTree(legendBlock, sectionWidth, availableWidth) {
        // `TYPE_TO_SYMBOLOGY` functions return promises
        const TYPE_TO_SYMBOLOGY = {
            [LegendBlock.TYPES.NODE]: entry =>
                Promise.resolve({
                    name: entry.name,
                    items: _censorSymbologyStack(entry.symbologyStack.stack)
                }),
            [LegendBlock.TYPES.GROUP]: async entry => ({
                name: entry.name,
                items: await extractLegendTree(entry)
            }),
            [LegendBlock.TYPES.SET]: () => Promise.resolve(null),
            [LegendBlock.TYPES.INFO]: async entry => {
                if (entry.infoType === 'image') {
                    const svgCode = await _censorImage(entry.content);
                    return {
                        name: '',
                        items: [{ name: '', svgcode: svgCode }],
                        blockType: LegendBlock.TYPES.INFO,
                        infoType: entry.infoType
                    };
                } else {
                    const content = entry.layerName || entry.content;

                    // ie can't handle fancy markdown image rendering so we strip markdown entirely
                    if (RV.isIE) {
                        return Promise.resolve({
                            name: removeMd(content),
                            items: _censorSymbologyStack(entry.symbologyStack.stack) || [],
                            blockType: LegendBlock.TYPES.INFO,
                            infoType: entry.infoType
                        });
                    }

                    const contentToHtml = marked(content);

                    // if no markdown was parsed, return as text
                    if (content === contentToHtml) {
                        return Promise.resolve({
                            name: entry.layerName || entry.content,
                            items: entry.symbologyStack.stack || [],
                            blockType: LegendBlock.TYPES.INFO,
                            infoType: entry.infoType
                        });
                    }

                    // restrict width to full legend size
                    const correctedWidth = Math.min(sectionWidth, availableWidth - LEGEND_MARGIN.l - LEGEND_MARGIN.r);

                    const container = document.createElement('div');
                    container.innerHTML = contentToHtml;
                    // restrict width and make invisible
                    container.style.width = `${correctedWidth}px`;
                    container.style.display = 'none';
                    // put in dom to be able to get height
                    document.body.appendChild(container);
                    const height = $(container).height();
                    // This is ECCC, we don't litter here.
                    container.remove();

                    // draw an image to the canvas using this XML SVG wrapper
                    const data = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="${correctedWidth}" height="${height}">
                            <foreignObject width="100%" height="100%">
                                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Roboto, 'Helvetica Neue', sans-serif;font-size: ${INFO_FONT_SIZE}px;font-weight: 400;letter-spacing: 0.010em;line-height: 20px;">${contentToHtml}</div>
                            </foreignObject>
                        </svg>
                    `;

                    const img = new Image();

                    // https://bugs.chromium.org/p/chromium/issues/detail?id=294129#c26
                    img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(data);

                    // we now have a local image and URL that we can wrap in a legend generator supported svg element
                    return Promise.resolve({
                        name: '',
                        items: [
                            {
                                name: '',
                                svgcode: `<svg xmlns:xlink="http://www.w3.org/1999/xlink" height="${height}" width="${correctedWidth}"><image height="${height}" width="${correctedWidth}" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${
                                    img.src
                                }"></image></svg>`
                            }
                        ].concat(_censorSymbologyStack(entry.symbologyStack.stack) || []),
                        blockType: LegendBlock.TYPES.INFO,
                        infoType: entry.infoType
                    });
                }
            }
        };

        // TODO: decide if symbology from the duplicated layer should be included in the export image
        let legendTreeData = legendBlock.walk(
            entry => (_showBlock(entry) ? TYPE_TO_SYMBOLOGY[entry.blockType](entry) : null),
            entry => (entry.blockType === LegendBlock.TYPES.GROUP ? false : true)
        ); // don't walk entry's children if it's a group

        let titleBefore = false;

        return Promise.all(legendTreeData).then(data =>
            data
                // filter out nulls
                .filter(a => a !== null)
                // filter out non-info blocks with no symbology
                .filter(entry => entry.blockType === LegendBlock.TYPES.INFO || entry.items.length > 0)
                // clear out titles where everything below it (or in between another title) has been removed
                // The two reverses let us filter backwards, making detection of bad titles easier.
                .reverse()
                .filter((entry, index) => {
                    if (entry.infoType && entry.infoType === 'title') {
                        if (index === 0 || titleBefore) {
                            titleBefore = true;
                            return false;
                        }
                        titleBefore = true;
                    } else {
                        titleBefore = false;
                    }
                    return true;
                })
                .reverse()
        );
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

        if (entry.controlled && entry.blockType !== LegendBlock.TYPES.INFO) {
            return exportLegend.showControlledSymbology && entry.isVisibleOnExport;
        }

        return entry.isVisibleOnExport;
    }

    /**
     * Takes in a symbology stack and replaces any of the non-CORS graphics with a placeholder of
     * the same size if the `cleanCanvas` is set to true in the config file.
     *
     * @param {*} stack symbology stack from a legend entry/block
     * @returns a censored symbology stack with tainted images removed
     */
    function _censorSymbologyStack(stack) {
        // if not defined, return empty array
        if (stack === undefined) {
            return [];
        }

        const {
            services: {
                export: { cleanCanvas }
            }
        } = configService.getSync;

        // if `cleanCanvas` is not set, do nothing
        if (!cleanCanvas) {
            return stack;
        }

        const censoredStack = stack.map(symbologyItem => {
            const { name, image, svgcode } = symbologyItem;

            // it's already base 64, hence won't taint the canvas
            // or if the image url is not present into the symbology item's svg code,
            // it means it was successfully converted to base64 (geoApi will always try to load imagery as `anonymous`)
            if (image === undefined || image.startsWith('data:') || svgcode.indexOf(image) === -1) {
                return symbologyItem;
            } else {
                const draw = graphicsService.createSvg(100, 100).svg(svgcode);
                // get the image from the svg and its bounding box
                const bbox = draw
                    .select('image')
                    .get(0)
                    .bbox();

                // create a placeholder box of the same size and fill it with grey
                // TODO: add a note in it that it can't be exported
                const placeholder = graphicsService.createSvg(bbox.w, bbox.h);
                placeholder.rect(bbox.w, bbox.h).fill('#bdc3c7');

                return {
                    name,
                    image,
                    svgcode: placeholder.svg()
                };
            }
        });

        console.log(stack, censoredStack);

        return censoredStack;
    }

    /**
     * Takes in an image url or its dataurl and returns an svg fragment with that image.
     * The tainted, non-CORS image will be replaced with a placehoder of the same size if
     * the `cleanCanvas` option is set to `true` in the config file.
     *
     * @param {*} imgUrl an image url or its dataurl
     * @returns an svg fragment with the supplied image as its url or dataurl
     */
    async function _censorImage(imgUrl) {
        const imgSource = $rootElement.find(`[src="${imgUrl}"]`)[0];
        const svgResult = graphicsService.createSvg(imgSource.width, imgSource.height); // create svg container

        const {
            services: {
                export: { cleanCanvas }
            }
        } = configService.getSync;

        let dataUrl = imgUrl;

        // if `cleanCanvas` is not set, don't remove non-CORS images
        // if set, try to convert image to dataurl; geoApi will try to load the image as CORS
        if (cleanCanvas) {
            dataUrl = await gapiService.gapi.shared.convertImagetoDataURL(imgUrl);
        }

        // `convertImagetoDataURL` returns original url if loading as anonymous fails
        // if the `dataUrl` starts with `data:`, it's in base 64 already
        if (!cleanCanvas || dataUrl.startsWith('data:') || dataUrl !== imgUrl) {
            svgResult.image(dataUrl, imgSource.width, imgSource.height);
        } else {
            svgResult.rect(imgSource.width, imgSource.height).fill('#bdc3c7');
        }

        return svgResult.svg();
    }
}
