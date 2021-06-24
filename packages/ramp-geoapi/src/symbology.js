/* jshint maxcomplexity: false */
'use strict';
const svgjs = require('svg.js');
const shared = require('./shared.js')();
const rcolour = require('rcolor');

// Functions for turning ESRI Renderers into images
// Specifically, converting ESRI "Simple" symbols into images,
// and deriving the appropriate image for a feature based on
// a renderer

// layer symbology types
const SIMPLE = 'simple';
const UNIQUE_VALUE = 'uniqueValue';
const CLASS_BREAKS = 'classBreaks';
const NONE = 'none';

const CONTAINER_SIZE = 32; // size of the symbology item container
const CONTENT_SIZE = 24; // size of the symbology graphic
const CONTENT_IMAGE_SIZE = 28; // size of the symbology graphic if it's an image (images tend to already have a white boarder around them)
const CONTAINER_CENTER = CONTAINER_SIZE / 2;
const CONTENT_PADDING = (CONTAINER_SIZE - CONTENT_SIZE) / 2;

/**
 * Will add extra properties to a renderer to support filtering by symbol.
 * New property .definitionClause contains sql where fragment valid for symbol
 * for app on each renderer item.
 *
 * @param {Object} renderer an ESRI renderer object in server JSON form. Param is modified in place
 * @param  {Array} fields Optional. Array of field definitions for the layer the renderer belongs to. If missing, all fields are assumed as String
 */
function filterifyRenderer(renderer, fields) {
    // worker function. determines if a field value should be wrapped in
    // any character and returns the character. E.g. string would return ', numbers return empty string.
    const getFieldDelimiter = (fieldName) => {
        let delim = `'`;

        // no field definition means we assume strings.
        if (!fields || fields.length === 0) {
            return delim;
        }

        // attempt to find our field, and a data type for it.
        const f = fields.find((ff) => ff.name === fieldName);
        if (f && f.type && f.type !== 'esriFieldTypeString') {
            // we found a field, with a type on it, but it's not a string. remove the delimiters
            delim = '';
        }

        return delim;
    };

    // worker function to turn single quotes in a value into two
    // single quotes to avoid conflicts with the text delimiters
    const quoter = (inStr) => {
        return inStr.replace(/'/g, "''");
    };

    switch (renderer.type) {
        case SIMPLE:
            renderer.definitionClause = '1=1';
            break;

        case UNIQUE_VALUE:
            if (renderer.bypassDefinitionClause) {
                // we are working with a renderer that we generated from a server legend.
                // just set dumb basic things.
                renderer.uniqueValueInfos.forEach((uvi) => {
                    uvi.definitionClause = '1=1';
                });
            } else {
                const delim = renderer.fieldDelimiter || ', ';
                const keyFields = ['field1', 'field2', 'field3']
                    .map((fn) => renderer[fn]) // extract field names
                    .filter((fn) => fn); // remove any undefined names

                const fieldDelims = keyFields.map((fn) => getFieldDelimiter(fn));

                renderer.uniqueValueInfos.forEach((uvi) => {
                    // unpack .value into array
                    const keyValues = uvi.value.split(delim);

                    // convert fields/values into sql clause
                    const clause = keyFields
                        .map((kf, i) => `${kf} = ${fieldDelims[i]}${quoter(keyValues[i])}${fieldDelims[i]}`)
                        .join(' AND ');

                    uvi.definitionClause = `(${clause})`;
                });
            }

            break;
        case CLASS_BREAKS:
            const f = renderer.field;
            let lastMinimum = renderer.minValue;

            // figure out ranges of each break.
            // minimum is optional, so we have to keep track of the previous max as fallback
            renderer.classBreakInfos.forEach((cbi) => {
                const minval = isNaN(cbi.classMinValue) ? lastMinimum : cbi.classMinValue;
                if (minval === cbi.classMaxValue) {
                    cbi.definitionClause = `(${f} = ${cbi.classMaxValue})`;
                } else {
                    cbi.definitionClause = `(${f} > ${minval} AND ${f} <= ${cbi.classMaxValue})`;
                }
                lastMinimum = cbi.classMaxValue;
            });

            break;
        default:
            // Renderer we dont support
            console.warn('encountered unsupported renderer type: ' + renderer.type);
    }
}

/**
 * Will add extra properties to a renderer to support images.
 * New properties .svgcode and .defaultsvgcode contains image source
 * for app on each renderer item.
 *
 * @param {Object} renderer an ESRI renderer object in server JSON form. Param is modified in place
 * @param {Object} legend object for the layer that maps legend label to data url of legend image
 * @return {Promise} resolving when the renderer has been enhanced
 */
function enhanceRenderer(renderer, legend) {
    // TODO note somewhere (user docs) that everything fails if someone publishes a legend with two identical labels.
    // UPDATE turns out services like this exist, somewhat. While the legend has unique labels, the renderer
    //        can have multiple items with the same corresponding label.  Things still hang together in that case,
    //        since we still have a 1-to-1 relationship between label and icon (all multiples in renderer have
    //        same label)

    // quick lookup object of legend names to data URLs.
    // our legend object is in ESRI format, but was generated by us and only has info for a single layer.
    // so we just grab item 0, which is the only item.
    const legendLookup = {};

    // store svgcode in the lookup
    const legendItemPromises = legend.layers[0].legend.map((legItem) =>
        legItem.then((data) => (legendLookup[data.label] = data.svgcode))
    );

    // wait until all legend items are resolved and legend lookup is updated
    return Promise.all(legendItemPromises).then(() => {
        switch (renderer.type) {
            case SIMPLE:
                renderer.svgcode = legendLookup[renderer.label];
                break;

            case UNIQUE_VALUE:
                if (renderer.defaultLabel) {
                    renderer.defaultsvgcode = legendLookup[renderer.defaultLabel];
                }

                renderer.uniqueValueInfos.forEach((uvi) => {
                    uvi.svgcode = legendLookup[uvi.label];
                });

                break;
            case CLASS_BREAKS:
                if (renderer.defaultLabel) {
                    renderer.defaultsvgcode = legendLookup[renderer.defaultLabel];
                }

                renderer.classBreakInfos.forEach((cbi) => {
                    cbi.svgcode = legendLookup[cbi.label];
                });

                break;
            default:
                // Renderer we dont support
                console.warn('encountered unsupported renderer type: ' + renderer.type);
        }
    });
}

/**
 * Will inspect the field names in a renderer and adjust any mis-matched casing
 * to align with the layer field definitions
 *
 * @private
 * @param  {Object} renderer a layer renderer in json format
 * @param  {Array} fields   list of field objects for the layer
 * @returns {Object} the renderer with any fields adjusted with proper case
 */
function cleanRenderer(renderer, fields) {
    const enhanceField = (fieldName, fields) => {
        if (!fieldName) {
            // testing an undefined/unused field. return original value.
            return fieldName;
        }
        let myField = fields.find((f) => f.name === fieldName);
        if (myField) {
            // field is valid. donethanks.
            return fieldName;
        } else {
            // do case-insensitive search
            const lowName = fieldName.toLowerCase();
            myField = fields.find((f) => f.name.toLowerCase() === lowName);
            if (myField) {
                // use the field definition casing
                return myField.name;
            } else {
                // decided error here was too destructive. it would tank the layer,
                // while the drawback would mainly only be failed symbols.
                // just return fieldName and hope for luck.
                console.warn(`could not find renderer field ${fieldName}`);
                return fieldName;
            }
        }
    };

    switch (renderer.type) {
        case SIMPLE:
            break;
        case UNIQUE_VALUE:
            ['field1', 'field2', 'field3'].forEach((f) => {
                // call ehnace case for each field
                renderer[f] = enhanceField(renderer[f], fields);
            });
            break;
        case CLASS_BREAKS:
            renderer.field = enhanceField(renderer.field, fields);
            break;
        default:
            // Renderer we dont support
            console.warn('encountered unsupported renderer type: ' + renderer.type);
    }
    return renderer;
}

/**
 * Given feature attributes, find the renderer node that would draw it
 *
 * @method searchRenderer
 * @param {Object} attributes object of feature attribute key value pairs
 * @param {Object} renderer an enhanced renderer (see function enhanceRenderer)
 * @return {Object} an Object with svgcode and symbol properties for the matched renderer item
 */
function searchRenderer(attributes, renderer) {
    let svgcode;
    let symbol = {};

    switch (renderer.type) {
        case SIMPLE:
            svgcode = renderer.svgcode;
            symbol = renderer.symbol;

            break;

        case UNIQUE_VALUE:
            // detect layer with arcade symbology (no field values)
            const containsField = renderer.field1 || renderer.field2 || renderer.field3;
            if (renderer.valueExpression && !containsField) {
                // convert to simple renderer with generated placeholder symbology using '?'
                renderer.type = SIMPLE;
                const color = rcolour({ saturation: 0.4, value: 0.8 });
                const placeholder = generatePlaceholderSymbology('?', color);

                renderer.svgcode = placeholder.svgcode;
                svgcode = placeholder.svgcode;
                renderer.symbol = symbol;
                break;
            }

            // make a key value for the graphic in question, using comma-space delimiter if multiple fields
            // put an empty string when key value is null
            let graphicKey = attributes[renderer.field1] === null ? '' : attributes[renderer.field1];

            // all key values are stored as strings.  if the attribute is in a numeric column, we must convert it to a string to ensure the === operator still works.
            if (typeof graphicKey !== 'string') {
                graphicKey = graphicKey.toString();
            }

            // TODO investigate possibility of problems due to falsey logic.
            //      e.g. if we had a field2 with empty string, would app expect
            //           'value1, ' or 'value1'
            //      need to brew up some samples to see what is possible in ArcMap
            if (renderer.field2) {
                const delim = renderer.fieldDelimiter || ', ';
                graphicKey = graphicKey + delim + attributes[renderer.field2];
                if (renderer.field3) {
                    graphicKey = graphicKey + delim + attributes[renderer.field3];
                }
            }

            // search the value maps for a matching entry.  if no match found, use the default image
            const uvi = renderer.uniqueValueInfos.find((uvi) => uvi.value === graphicKey);
            if (uvi) {
                svgcode = uvi.svgcode;
                symbol = uvi.symbol;
            } else {
                svgcode = renderer.defaultsvgcode;
                symbol = renderer.defaultSymbol;
            }

            break;

        case CLASS_BREAKS:
            const gVal = parseFloat(attributes[renderer.field]);
            const lower = renderer.minValue;

            svgcode = renderer.defaultsvgcode;
            symbol = renderer.defaultSymbol;

            // check for outside range on the low end
            if (gVal < lower) {
                break;
            }

            // array of minimum values of the ranges in the renderer
            let minSplits = renderer.classBreakInfos.map((cbi) => cbi.classMaxValue);
            minSplits.splice(0, 0, lower - 1); // put lower-1 at the start of the array and shift all other entries by 1

            // attempt to find the range our gVal belongs in
            const cbi = renderer.classBreakInfos.find(
                (cbi, index) => gVal > minSplits[index] && gVal <= cbi.classMaxValue
            );
            if (!cbi) {
                // outside of range on the high end
                break;
            }
            svgcode = cbi.svgcode;
            symbol = cbi.symbol;

            break;

        default:
            console.warn(`Unknown renderer type encountered - ${renderer.type}`);
    }

    // make an empty svg graphic in case nothing is found to avoid undefined inside the filters
    if (typeof svgcode === 'undefined') {
        svgcode = svgjs(window.document.createElement('div')).size(CONTAINER_SIZE, CONTAINER_SIZE).svg();
    }

    return { svgcode, symbol };
}

/**
 * Given feature attributes, return the image URL for that feature/graphic object.
 *
 * @method getGraphicIcon
 * @param {Object} attributes object of feature attribute key value pairs
 * @param {Object} renderer an enhanced renderer (see function enhanceRenderer)
 * @return {String} svgcode Url to the features symbology image
 */
function getGraphicIcon(attributes, renderer) {
    const renderInfo = searchRenderer(attributes, renderer);
    return renderInfo.svgcode;
}

/**
 * Given feature attributes, return the symbol for that feature/graphic object.
 *
 * @method getGraphicSymbol
 * @param {Object} attributes object of feature attribute key value pairs
 * @param {Object} renderer an enhanced renderer (see function enhanceRenderer)
 * @return {Object} an ESRI Symbol object in server format
 */
function getGraphicSymbol(attributes, renderer) {
    const renderInfo = searchRenderer(attributes, renderer);
    return renderInfo.symbol;
}

/**
 * Generates svg symbology for WMS layers.
 * @function generateWMSSymbology
 * @param {String} name label for the symbology item (it's not used right now, but is required to be consistent with other symbology generating functions)
 * @param {String} imageUri url or dataUrl of the legend image
 * @return {Promise} a promise resolving with symbology svg code and its label
 */
function generateWMSSymbology(name, imageUri) {
    const draw = svgjs(window.document.createElement('div')).size(CONTAINER_SIZE, CONTAINER_SIZE).viewbox(0, 0, 0, 0);

    const symbologyItem = {
        name,
        svgcode: null,
    };

    if (imageUri) {
        const renderPromise = renderSymbologyImage(imageUri).then((svgcode) => {
            symbologyItem.svgcode = svgcode;

            return symbologyItem;
        });

        return renderPromise;
    } else {
        symbologyItem.svgcode = draw.svg();

        return Promise.resolve(symbologyItem);
    }
}

/**
 * Converts a config-supplied list of symbology to the format used by layer records.
 *
 * @private
 * @function _listToSymbology
 * @param {Function} conversionFunction a conversion function to wrap the supplied image into an image or an icon style symbology container
 * @param {Array} list a list of config-supplied symbology items in the form of [ { text: <String>, image: <String> }, ... ] wher `image` can be dataURL or an actual url
 * @return {Array} an array of converted symbology symbols in the form of [ { name: <String>, image: <String>, svgcode: <String> }, ... ]; items will be populated async as conversions are done
 */
function _listToSymbology(conversionFunction, list) {
    const results = list.map(({ text, image }) => {
        const result = {
            name: text,
            image, // url
            svgcode: null,
        };

        conversionFunction(image).then((svgcode) => {
            result.svgcode = svgcode;
        });

        return result;
    });

    return results;
}

/**
 * Renders a supplied image as an image-style symbology item (preserving the true image dimensions).
 *
 * @function renderSymbologyImage
 * @param {String} imageUri a image dataUrl or a regular url
 * @param {Object} draw [optional=null] an svg container to draw the image on; if not supplied, a new one is created
 */
function renderSymbologyImage(imageUri, draw = null) {
    if (draw === null) {
        draw = svgjs(window.document.createElement('div')).size(CONTAINER_SIZE, CONTAINER_SIZE).viewbox(0, 0, 0, 0);
    }

    const symbologyPromise = shared
        .convertImagetoDataURL(imageUri)
        .then((imageUri) => svgDrawImage(draw, imageUri))
        .then(({ loader }) => {
            draw.viewbox(0, 0, loader.width, loader.height);
            return draw.svg();
        })
        .catch((err) => {
            console.error('Cannot draw symbology image; returning empty', err);
            return draw.svg();
        });

    return symbologyPromise;
}

/**
 * Renders a supplied image as an icon-style symbology item (fitting an image inside an icon container, usually 32x32 pixels).
 *
 * @function renderSymbologyIcon
 * @param {String} imageUri a image dataUrl or a regular url
 * @param {Object} draw [optional=null] an svg container to draw the image on; if not supplied, a new one is created
 */
function renderSymbologyIcon(imageUri, draw = null) {
    if (draw === null) {
        // create a temporary svg element and add it to the page; if not added, the element's bounding box cannot be calculated correctly
        const container = window.document.createElement('div');
        container.setAttribute('style', 'opacity:0;position:fixed;left:100%;top:100%;overflow:hidden');
        window.document.body.appendChild(container);

        draw = svgjs(container).size(CONTAINER_SIZE, CONTAINER_SIZE).viewbox(0, 0, CONTAINER_SIZE, CONTAINER_SIZE);
    }

    // need to draw the image to get its size (technically not needed if we have a url, but this is simpler)
    const picturePromise = shared
        .convertImagetoDataURL(imageUri)
        .then((imageUri) => svgDrawImage(draw, imageUri))
        .then(({ image }) => {
            image.center(CONTAINER_CENTER, CONTAINER_CENTER);

            // scale image to fit into the symbology item container
            fitInto(image, CONTENT_IMAGE_SIZE);

            return draw.svg();
        });

    return picturePromise;
}

/**
 * Generates a placeholder symbology graphic. Returns a promise for consistency
 * @function generatePlaceholderSymbology
 * @private
 * @param  {String} name label symbology label
 * @param  {String} colour colour to use in the graphic
 * @return {Object} symbology svg code and its label
 */
function generatePlaceholderSymbology(name, colour = '#000') {
    const draw = svgjs(window.document.createElement('div'))
        .size(CONTAINER_SIZE, CONTAINER_SIZE)
        .viewbox(0, 0, CONTAINER_SIZE, CONTAINER_SIZE);

    draw.rect(CONTENT_IMAGE_SIZE, CONTENT_IMAGE_SIZE).center(CONTAINER_CENTER, CONTAINER_CENTER).fill(colour);

    draw.text(name[0].toUpperCase()) // take the first letter
        .size(23)
        .fill('#fff')
        .attr({
            'font-weight': 'bold',
            'font-family': 'Roboto',
        })
        .center(CONTAINER_CENTER, CONTAINER_CENTER);

    return {
        name,
        svgcode: draw.svg(),
    };
}

/**
 * Generate a legend item for an ESRI symbol.
 * @private
 * @param  {Object} symbol an ESRI symbol object in server format
 * @param  {String} label label of the legend item
 * @param  {String} definitionClause sql clause to filter on this legend item
 * @param  {Object} window reference to the browser window
 * @return {Object} a legend object populated with the symbol and label
 */
function symbolToLegend(symbol, label, definitionClause, window) {
    // create a temporary svg element and add it to the page; if not added, the element's bounding box cannot be calculated correctly
    const container = window.document.createElement('div');
    container.setAttribute('style', 'opacity:0;position:fixed;left:100%;top:100%;overflow:hidden');
    window.document.body.appendChild(container);

    const draw = svgjs(container).size(CONTAINER_SIZE, CONTAINER_SIZE).viewbox(0, 0, CONTAINER_SIZE, CONTAINER_SIZE);

    // functions to draw esri simple marker symbols
    // jscs doesn't like enhanced object notation
    // jscs:disable requireSpacesInAnonymousFunctionExpression
    const esriSimpleMarkerSimbol = {
        esriSMSPath({ size, path }) {
            return draw.path(path).size(size);
        },
        esriSMSCircle({ size }) {
            return draw.circle(size);
        },
        esriSMSCross({ size }) {
            return draw.path('M 0,10 L 20,10 M 10,0 L 10,20').size(size);
        },
        esriSMSX({ size }) {
            return draw.path('M 0,0 L 20,20 M 20,0 L 0,20').size(size);
        },
        esriSMSTriangle({ size }) {
            return draw.path('M 20,20 L 10,0 0,20 Z').size(size);
        },
        esriSMSDiamond({ size }) {
            return draw.path('M 20,10 L 10,0 0,10 10,20 Z').size(size);
        },
        esriSMSSquare({ size }) {
            return draw.path('M 0,0 20,0 20,20 0,20 Z').size(size);
        },
    };

    // jscs:enable requireSpacesInAnonymousFunctionExpression

    // line dash styles
    const ESRI_DASH_MAPS = {
        esriSLSSolid: 'none',
        esriSLSDash: '5.333,4',
        esriSLSDashDot: '5.333,4,1.333,4',
        esriSLSLongDashDotDot: '10.666,4,1.333,4,1.333,4',
        esriSLSDot: '1.333,4',
        esriSLSLongDash: '10.666,4',
        esriSLSLongDashDot: '10.666,4,1.333,4',
        esriSLSShortDash: '5.333,1.333',
        esriSLSShortDashDot: '5.333,1.333,1.333,1.333',
        esriSLSShortDashDotDot: '5.333,1.333,1.333,1.333,1.333,1.333',
        esriSLSShortDot: '1.333,1.333',
        esriSLSNull: 'none',
    };

    // default stroke style
    const DEFAULT_STROKE = {
        color: '#000',
        opacity: 1,
        width: 1,
        linecap: 'square',
        linejoin: 'miter',
        miterlimit: 4,
    };

    // this is a null outline in case a supplied symbol doesn't have one
    const DEFAULT_OUTLINE = {
        color: [0, 0, 0, 0],
        width: 0,
        style: ESRI_DASH_MAPS.esriSLSNull,
    };

    // 5x5 px patter with coloured diagonal lines
    const esriSFSFills = {
        esriSFSSolid: (symbolColour) => {
            return {
                color: symbolColour.colour,
                opacity: symbolColour.opacity,
            };
        },
        esriSFSNull: () => 'transparent',
        esriSFSHorizontal: (symbolColour, symbolStroke) => {
            const cellSize = 5;

            // patter fill: horizonal line in a 5x5 px square
            return draw
                .pattern(cellSize, cellSize, (add) => add.line(0, cellSize / 2, cellSize, cellSize / 2))
                .stroke(symbolStroke);
        },
        esriSFSVertical: (symbolColour, symbolStroke) => {
            const cellSize = 5;

            // patter fill: vertical line in a 5x5 px square
            return draw
                .pattern(cellSize, cellSize, (add) => add.line(cellSize / 2, 0, cellSize / 2, cellSize))
                .stroke(symbolStroke);
        },
        esriSFSForwardDiagonal: (symbolColour, symbolStroke) => {
            const cellSize = 5;

            // patter fill: forward diagonal line in a 5x5 px square; two more diagonal lines offset to cover the corners when the main line is cut off
            return draw.pattern(cellSize, cellSize, (add) => {
                add.line(0, 0, cellSize, cellSize).stroke(symbolStroke);
                add.line(0, 0, cellSize, cellSize).move(0, cellSize).stroke(symbolStroke);
                add.line(0, 0, cellSize, cellSize).move(cellSize, 0).stroke(symbolStroke);
            });
        },
        esriSFSBackwardDiagonal: (symbolColour, symbolStroke) => {
            const cellSize = 5;

            // patter fill: backward diagonal line in a 5x5 px square; two more diagonal lines offset to cover the corners when the main line is cut off
            return draw.pattern(cellSize, cellSize, (add) => {
                add.line(cellSize, 0, 0, cellSize).stroke(symbolStroke);
                add.line(cellSize, 0, 0, cellSize)
                    .move(cellSize / 2, cellSize / 2)
                    .stroke(symbolStroke);
                add.line(cellSize, 0, 0, cellSize)
                    .move(-cellSize / 2, -cellSize / 2)
                    .stroke(symbolStroke);
            });
        },
        esriSFSCross: (symbolColour, symbolStroke) => {
            const cellSize = 5;

            // patter fill: horizonal and vertical lines in a 5x5 px square
            return draw.pattern(cellSize, cellSize, (add) => {
                add.line(cellSize / 2, 0, cellSize / 2, cellSize).stroke(symbolStroke);
                add.line(0, cellSize / 2, cellSize, cellSize / 2).stroke(symbolStroke);
            });
        },
        esriSFSDiagonalCross: (symbolColour, symbolStroke) => {
            const cellSize = 7;

            // patter fill: crossing diagonal lines in a 7x7 px square
            return draw.pattern(cellSize, cellSize, (add) => {
                add.line(0, 0, cellSize, cellSize).stroke(symbolStroke);
                add.line(cellSize, 0, 0, cellSize).stroke(symbolStroke);
            });
        },
    };

    // jscs doesn't like enhanced object notation
    // jscs:disable requireSpacesInAnonymousFunctionExpression
    const symbolTypes = {
        esriSMS() {
            // ESRI Simple Marker Symbol
            const symbolColour = parseEsriColour(symbol.color);

            symbol.outline = symbol.outline || DEFAULT_OUTLINE;
            const outlineColour = parseEsriColour(symbol.outline.color);
            const outlineStroke = makeStroke({
                color: outlineColour.colour,
                opacity: outlineColour.opacity,
                width: symbol.outline.width,
                dasharray: ESRI_DASH_MAPS[symbol.outline.style],
            });

            // make an ESRI simple symbol and apply fill and outline to it
            const marker = esriSimpleMarkerSimbol[symbol.style](symbol)
                .fill({
                    color: symbolColour.colour,
                    opacity: symbolColour.opacity,
                })
                .stroke(outlineStroke)
                .center(CONTAINER_CENTER, CONTAINER_CENTER)
                .rotate(symbol.angle || 0);

            fitInto(marker, CONTENT_SIZE);
        },
        esriSLS() {
            // ESRI Simple Line Symbol
            const lineColour = parseEsriColour(symbol.color);
            const lineStroke = makeStroke({
                color: lineColour.colour,
                opacity: lineColour.opacity,
                width: symbol.width,
                linecap: 'butt',
                dasharray: ESRI_DASH_MAPS[symbol.style],
            });

            const min = CONTENT_PADDING;
            const max = CONTAINER_SIZE - CONTENT_PADDING;
            draw.line(min, min, max, max).stroke(lineStroke);
        },
        esriCLS() {
            // ESRI Fancy Line Symbol
            this.esriSLS();
        },
        esriSFS() {
            // ESRI Simple Fill Symbol
            const symbolColour = parseEsriColour(symbol.color);
            const symbolStroke = makeStroke({
                color: symbolColour.colour,
                opacity: symbolColour.opacity,
            });
            const symbolFill = esriSFSFills[symbol.style](symbolColour, symbolStroke);

            symbol.outline = symbol.outline || DEFAULT_OUTLINE;
            const outlineColour = parseEsriColour(symbol.outline.color);
            const outlineStroke = makeStroke({
                color: outlineColour.colour,
                opacity: outlineColour.opacity,
                width: symbol.outline.width,
                linecap: 'butt',
                dasharray: ESRI_DASH_MAPS[symbol.outline.style],
            });

            draw.rect(CONTENT_SIZE, CONTENT_SIZE)
                .center(CONTAINER_CENTER, CONTAINER_CENTER)
                .fill(symbolFill)
                .stroke(outlineStroke);
        },

        esriTS() {
            console.error('no support for feature service legend of text symbols');
        },

        esriPFS() {
            // ESRI Picture Fill Symbol
            // imageUri can be just an image url is specified or a dataUri string
            const imageUri = symbol.imageData ? `data:${symbol.contentType};base64,${symbol.imageData}` : symbol.url;

            const imageWidth = symbol.width * symbol.xscale;
            const imageHeight = symbol.height * symbol.yscale;

            symbol.outline = symbol.outline || DEFAULT_OUTLINE;
            const outlineColour = parseEsriColour(symbol.outline.color);
            const outlineStroke = makeStroke({
                color: outlineColour.colour,
                opacity: outlineColour.opacity,
                width: symbol.outline.width,
                dasharray: ESRI_DASH_MAPS[symbol.outline.style],
            });

            const picturePromise = shared.convertImagetoDataURL(imageUri).then((imageUri) => {
                // make a fill from a tiled image
                const symbolFill = draw.pattern(imageWidth, imageHeight, (add) =>
                    add.image(imageUri, imageWidth, imageHeight, true)
                );

                draw.rect(CONTENT_SIZE, CONTENT_SIZE)
                    .center(CONTAINER_CENTER, CONTAINER_CENTER)
                    .fill(symbolFill)
                    .stroke(outlineStroke);
            });

            return picturePromise;
        },

        esriPMS() {
            // ESRI PMS? Picture Marker Symbol
            // imageUri can be just an image url is specified or a dataUri string
            const imageUri = symbol.imageData ? `data:${symbol.contentType};base64,${symbol.imageData}` : symbol.url;

            // need to draw the image to get its size (technically not needed if we have a url, but this is simpler)
            const picturePromise = shared
                .convertImagetoDataURL(imageUri)
                .then((imageUri) => svgDrawImage(draw, imageUri))
                .then(({ image }) => {
                    image.center(CONTAINER_CENTER, CONTAINER_CENTER).rotate(symbol.angle || 0);

                    // scale image to fit into the symbology item container
                    fitInto(image, CONTENT_IMAGE_SIZE);
                });

            return picturePromise;
        },
    };

    // jscs:enable requireSpacesInAnonymousFunctionExpression

    // console.log(symbol.type, label, '--START--');
    // console.log(symbol);

    return Promise.resolve(symbolTypes[symbol.type]())
        .then(() => {
            // console.log(symbol.type, label, '--DONE--');

            // remove element from the page
            window.document.body.removeChild(container);
            return { label, definitionClause, svgcode: draw.svg() };
        })
        .catch((error) => console.log(error));

    /**
     * Creates a stroke style by applying custom rules to the default stroke.
     * @param {Object} overrides any custom rules to apply on top of the defaults
     * @return {Object} a stroke object
     * @private
     */
    function makeStroke(overrides) {
        return Object.assign({}, DEFAULT_STROKE, overrides);
    }

    /**
     * Convert an ESRI colour object to SVG rgb format.
     * @private
     * @param  {Array} c ESRI Colour array
     * @return {Object} colour and opacity in SVG format
     */
    function parseEsriColour(c) {
        if (c) {
            return {
                colour: `rgb(${c[0]},${c[1]},${c[2]})`,
                opacity: c[3] / 255,
            };
        } else {
            return {
                colour: 'rgb(0, 0, 0)',
                opacity: 0,
            };
        }
    }
}

/**
 * Renders a specified image on an svg element. This is a helper function that wraps around async `draw.image` call in the svg library.
 *
 * @function svgDrawImage
 * @private
 * @param {Object} draw svg element to render the image onto
 * @param {String} imageUri image url or dataURL of the image to render
 * @param {Number} width [optional = 0] width of the image
 * @param {Number} height [optional = 0] height of the image
 * @param {Boolean} crossOrigin [optional = true] specifies if the image should be loaded as crossOrigin
 * @return {Promise} promise resolving with the loaded image and its loader object (see svg.js http://documentup.com/wout/svg.js#image for details)
 */
function svgDrawImage(draw, imageUri, width = 0, height = 0, crossOrigin = true) {
    const promise = new Promise((resolve, reject) => {
        const image = draw
            .image(imageUri, width, height, crossOrigin)
            .loaded((loader) => resolve({ image, loader }))
            .error((err) => {
                reject(err);
                console.error(err);
            });
    });

    return promise;
}

/**
 * Fits svg element in the size specified
 * @param {Ojbect} element svg element to fit
 * @param {Number} CONTAINER_SIZE width/height of a container to fit the element into
 */
function fitInto(element, CONTAINER_SIZE) {
    // const elementRbox = element.rbox();
    // const elementRbox = element.screenBBox();

    const elementRbox = element.node.getBoundingClientRect(); // marker.rbox(); //rbox doesn't work properly in Chrome for some reason
    const scale = CONTAINER_SIZE / Math.max(elementRbox.width, elementRbox.height);
    if (scale < 1) {
        element.scale(scale);
    }
}

/**
 * Generate an array of legend items for an ESRI unique value or class breaks renderer.
 * @private
 * @param  {Object} renderer an ESRI unique value or class breaks renderer
 * @param  {Array} childList array of children items of the renderer
 * @param  {Object} window reference to the browser window
 * @return {Array} a legend object populated with the symbol and label
 */
function scrapeListRenderer(renderer, childList, window) {
    // a renderer list can have multiple entries for the same label
    // (e.g. mapping two unique values to the same legend category).
    // here we assume an identical labels equate to a single legend
    // entry.

    const preLegend = childList.map((child) => {
        return { symbol: child.symbol, label: child.label, definitionClause: child.definitionClause };
    });

    if (renderer.defaultSymbol) {
        // calculate fancy sql clause to select "everything else"
        const elseClauseGuts = preLegend.map((pl) => pl.definitionClause).join(' OR ');

        const elseClause = `(NOT (${elseClauseGuts}))`;

        // class breaks dont have default label
        // TODO perhaps put in a default of "Other", would need to be in proper language
        preLegend.push({
            symbol: renderer.defaultSymbol,
            definitionClause: elseClause,
            label: renderer.defaultLabel || '',
        });
    }

    // filter out duplicate lables, then convert remaining things to legend items
    return preLegend
        .filter((item, index, inputArray) => {
            const firstFindIdx = inputArray.findIndex((dupItem) => {
                return item.label === dupItem.label;
            });

            if (index === firstFindIdx) {
                // first time encountering the label. done thanks
                return true;
            } else {
                // not first time encountering the label.
                // drop from legend, but tack definition clause onto first one
                const firstItem = inputArray[firstFindIdx];
                firstItem.isCompound = true;
                firstItem.definitionClause += ` OR ${item.definitionClause}`;
                return false;
            }
        })
        .map((item) => {
            if (item.isCompound) {
                item.definitionClause = `(${item.definitionClause})`; // wrap compound expression in brackets
            }
            return symbolToLegend(item.symbol, item.label, item.definitionClause, window);
        });
}

function buildRendererToLegend(window) {
    /**
     * Generate a legend object based on an ESRI renderer.
     * @private
     * @param  {Object} renderer an ESRI renderer object in server JSON form
     * @param  {Integer} index the layer index of this renderer
     * @param  {Array} fields Optional. Array of field definitions for the layer the renderer belongs to. If missing, all fields are assumed as String
     * @return {Object} an object matching the form of an ESRI REST API legend
     */
    return (renderer, index, fields) => {
        // SVG Legend symbology uses pixels instead of points from ArcGIS Server, thus we need
        // to multply it by a factor to correct the values.  96 DPI from ArcGIS Server is assumed.
        const ptFactor = 1.33333; // points to pixel factor

        // make basic shell object with .layers array
        const legend = {
            layers: [
                {
                    layerId: index,
                    legend: [],
                },
            ],
        };

        // calculate symbology filter logic
        filterifyRenderer(renderer, fields);

        switch (renderer.type) {
            case SIMPLE:
                renderer.symbol.size = Math.round(renderer.symbol.size * ptFactor);
                legend.layers[0].legend.push(
                    symbolToLegend(renderer.symbol, renderer.label, renderer.definitionClause, window)
                );
                break;

            case UNIQUE_VALUE:
                if (renderer.defaultSymbol) {
                    renderer.defaultSymbol.size = Math.round(renderer.defaultSymbol.size * ptFactor);
                }
                renderer.uniqueValueInfos.forEach((val) => {
                    val.symbol.size = Math.round(val.symbol.size * ptFactor);
                });
                legend.layers[0].legend = scrapeListRenderer(renderer, renderer.uniqueValueInfos, window);
                break;

            case CLASS_BREAKS:
                if (renderer.defaultSymbol) {
                    renderer.defaultSymbol.size = Math.round(renderer.defaultSymbol.size * ptFactor);
                }
                renderer.classBreakInfos.forEach((val) => {
                    val.symbol.size = Math.round(val.symbol.size * ptFactor);
                });
                legend.layers[0].legend = scrapeListRenderer(renderer, renderer.classBreakInfos, window);
                break;

            case NONE:
                break;

            default:
                // FIXME make a basic blank entry (error msg as label?) to prevent things from breaking
                // Renderer we dont support
                console.error('encountered unsupported renderer legend type: ' + renderer.type);
        }
        return legend;
    };
}

/**
 * Returns the legend information of an ESRI map service.
 *
 * @function getMapServerLegend
 * @private
 * @param  {String} layerUrl service url (root service, not indexed endpoint)
 * @param  {Object} esriBundle collection of ESRI API objects
 * @returns {Promise} resolves in an array of legend data
 *
 */
function getMapServerLegend(layerUrl, esriBundle) {
    // standard json request with error checking
    const defService = esriBundle.esriRequest({
        url: `${layerUrl}/legend`,
        content: { f: 'json' },
        callbackParamName: 'callback',
        handleAs: 'json',
    });

    // wrap in promise to contain dojo deferred
    return new Promise((resolve, reject) => {
        defService.then(
            (srvResult) => {
                if (srvResult.error) {
                    reject(srvResult.error);
                } else {
                    resolve(srvResult);
                }
            },
            (error) => {
                reject(error);
            }
        );
    });
}

/**
 * Our symbology engine works off of renderers. When dealing with layers with no renderers,
 * we need to take server-side legend and convert it to a fake renderer, which lets us
 * leverage all the existing symbology code.
 *
 * @function mapServerLegendToRenderer
 * @private
 * @param {Object} serverLegend legend json from an esri map server
 * @param {Integer} layerIndex  the index of the layer in the legend we are interested in
 * @returns {Object} a fake unique value renderer based off the legend
 *
 */
function mapServerLegendToRenderer(serverLegend, layerIndex) {
    const layerLegend = serverLegend.layers.find((l) => {
        return l.layerId === layerIndex;
    });

    // when no layer has been found it can be a layer whitout a legend like annotation layer
    // in this case, do not apply a renderer
    let renderer;
    if (typeof layerLegend !== 'undefined') {
        // make the mock renderer
        renderer = {
            type: 'uniqueValue',
            bypassDefinitionClause: true,
            uniqueValueInfos: layerLegend.legend.map((ll) => {
                return {
                    label: ll.label,
                    symbol: {
                        type: 'esriPMS',
                        imageData: ll.imageData,
                        contentType: ll.contentType,
                    },
                };
            }),
        };
    } else {
        renderer = { type: NONE };
    }
    // make the mock renderer
    return renderer;
}

/**
 * Our symbology engine works off of renderers. When dealing with layers with no renderers,
 * we need to take server-side legend and convert it to a fake renderer, which lets us
 * leverage all the existing symbology code.
 *
 * Same as mapServerLegendToRenderer function but combines all layer renderers.
 *
 * @function mapServerLegendToRendererAll
 * @private
 * @param {Object} serverLegend legend json from an esri map server
 * @returns {Object} a fake unique value renderer based off the legend
 */

function mapServerLegendToRendererAll(serverLegend) {
    const layerRenders = serverLegend.layers.map((layer) =>
        layer.legend.map((layerLegend) => ({
            label: layerLegend.label,
            symbol: {
                type: 'esriPMS',
                imageData: layerLegend.imageData,
                contentType: layerLegend.contentType,
            },
        }))
    );

    return {
        type: 'uniqueValue',
        bypassDefinitionClause: true,
        uniqueValueInfos: [].concat(...layerRenders),
    };
}

function buildMapServerToLocalLegend(esriBundle, geoApi) {
    /**
     * Orchestrator function that will:
     * - Fetch a legend from an esri map server
     * - Extract legend for a specific sub layer
     * - Convert server legend to a temporary renderer
     * - Convert temporary renderer to a viewer-formatted legend (return value)
     *
     * @function mapServerToLocalLegend
     * @param {String}    mapServerUrl  service url (root service, not indexed endpoint)
     * @param {Integer}   [layerIndex]  the index of the layer in the legend we are interested in. If not provided, all layers will be collapsed into a single legend
     * @returns {Promise} resolves in a viewer-compatible legend for the given server and layer index
     *
     */
    return (mapServerUrl, layerIndex) => {
        // get esri legend from server

        return getMapServerLegend(mapServerUrl, esriBundle).then((serverLegendData) => {
            // derive renderer for specified layer
            let fakeRenderer;
            let intIndex;
            if (typeof layerIndex === 'undefined') {
                intIndex = 0;
                fakeRenderer = mapServerLegendToRendererAll(serverLegendData);
            } else {
                intIndex = parseInt(layerIndex); // sometimes a stringified value comes in. careful now.
                fakeRenderer = mapServerLegendToRenderer(serverLegendData, intIndex);
            }

            // convert renderer to viewer specific legend
            return geoApi.symbology.rendererToLegend(fakeRenderer, intIndex);
        });
    };
}

module.exports = (esriBundle, geoApi, window) => {
    return {
        getGraphicIcon,
        getGraphicSymbol,
        rendererToLegend: buildRendererToLegend(window),
        generatePlaceholderSymbology,
        generateWMSSymbology,
        listToIconSymbology: (list) => _listToSymbology(renderSymbologyIcon, list),
        listToImageSymbology: (list) => _listToSymbology(renderSymbologyImage, list),
        enhanceRenderer,
        cleanRenderer,
        filterifyRenderer,
        mapServerToLocalLegend: buildMapServerToLocalLegend(esriBundle, geoApi),
        SimpleRenderer: esriBundle.SimpleRenderer,
        ClassBreaksRenderer: esriBundle.ClassBreaksRenderer,
        UniqueValueRenderer: esriBundle.UniqueValueRenderer,
    };
};
