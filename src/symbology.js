/* jshint maxcomplexity: false */
'use strict';

// Functions for turning ESRI Renderers into images
// Specifically, converting ESRI "Simple" symbols into images,
// and deriving the appropriate image for a feature based on
// a renderer

// size of images to output
const maxW = 32;
const maxH = 32;

// use single quotes so they will not be escaped (less space in browser)
const emptySVG = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'></svg>`;

/**
* Determines the type (class) of a renderer object.
*
* @param {Object} renderer ESRI API renderer object from a layer
* @returns {String} name of the class
*/
function getRendererType(renderer) {
    // get renderer class type from prototype object and get rid of unnecessary prefixes with split
    const classArr = Object.getPrototypeOf(renderer).declaredClass.split('\.');
    return classArr[2];
}

/**
* Will generate a symbology config node for a ESRI feature service.
* Uses the information from the feature layers renderer JSON definition
*
* @param {Object} renderer renderer object from feature layer endpoint
* @param {Object} legend object that maps legend label to data url of legend image
* @returns {Object} an JSON config object for feature symbology
*/
function createSymbologyConfig(renderer, legend) {

    const symb = {
        type: renderer.type
    };

    const legendLookup = labelObj(legend);

    switch (symb.type) {
        case 'simple':
            symb.label = renderer.label;
            symb.imageUrl = legendLookup[renderer.label].icon;

            break;

        case 'uniqueValue':
            if (renderer.defaultLabel) {
                symb.defaultImageUrl = legendLookup[renderer.defaultLabel];
            }
            symb.field1 = renderer.field1;
            symb.field2 = renderer.field2;
            symb.field3 = renderer.field3;
            symb.valueMaps = renderer.uniqueValueInfos.map(uvi => {
                return {
                    label: uvi.label,
                    value: uvi.value,
                    imageUrl: legendLookup[uvi.label].icon
                };
            });

            break;
        case 'classBreaks':
            if (renderer.defaultLabel) {
                symb.defaultImageUrl = legendLookup[renderer.defaultLabel];
            }
            symb.field = renderer.field;
            symb.minValue = renderer.minValue;
            symb.rangeMaps = renderer.classBreakInfos.map(cbi => {
                return {
                    label: cbi.label,
                    maxValue: cbi.classMaxValue,
                    imageUrl: legendLookup[cbi.label].icon
                };
            });

            break;
        default:

            // Renderer we dont support
            console.log('encountered unsupported renderer type: ' + symb.type);

        // TODO make a stupid basic renderer to prevent things from breaking?
    }

    return symb;
}

/**
* Given a feature data object return the image URL for that feature/graphic object.
*
* @method getGraphicIcon
* @param {Object} fData feature data object
* @param {Object} layerConfig layer config for feature
* @param {Integer} oid of attribute that needs icon fetching
* @return {String} imageUrl Url to the features symbology image
*/
function getGraphicIcon(fData, layerConfig, oid) {
    const symbolConfig = layerConfig;
    let img = '';
    let graphicKey;

    // find node in layerregistry.attribs
    switch (symbolConfig.type) {
        case 'simple':
            return symbolConfig.imageUrl;

        case 'uniqueValue':
            const oidIdx = fData.oidIndex[oid];

            // make a key value for the graphic in question, using comma-space delimiter if multiple fields
            graphicKey = fData.features[oidIdx].attributes[symbolConfig.field1];

            // all key values are stored as strings.  if the attribute is in a numeric column, we must convert it to a string to ensure the === operator still works.
            if (typeof graphicKey !== 'string') {
                graphicKey = graphicKey.toString();
            }

            if (symbolConfig.field2) {
                graphicKey = graphicKey + ', ' + fData.attributes[symbolConfig.field2];
                if (symbolConfig.field3) {
                    graphicKey = graphicKey + ', ' + fData.attributes[symbolConfig.field3];
                }
            }

            // search the value maps for a matching entry.  if no match found, use the default image
            symbolConfig.valueMaps.every(maps => {
                if (maps.value === graphicKey) {
                    img = maps.imageUrl;
                    return false; // break loop
                }
                return true; // keep looping
            });

            if (img === '') {
                img = symbolConfig.defaultImageUrl;
            }

            return img;

        case 'classBreaks':
            const oidIdx2 = fData.oidIndex[oid];

            let gVal = fData.features[oidIdx2].attributes[symbolConfig.field];

            // find where the value exists in the range
            let lower = symbolConfig.minValue;

            if (gVal < lower) {
                img = symbolConfig.defaultImageUrl;
            } else {

                // a trick to prime the first loop iteration
                // the first low value is inclusive.  every other low value is exclusive.
                // if we have entered this else bracket, we know we are not below the first lower limit.
                // so we reduce lower by 1 to make the first exclusive test inclusive
                let upper = lower - 1;

                symbolConfig.rangeMaps.every(rangeMap => {
                    lower = upper;
                    upper = rangeMap.maxValue;
                    if ((gVal > lower) && (gVal <= upper)) {
                        img = rangeMap.imageUrl;
                        return false; // break loop
                    }
                    return true; // keep looping
                });

                if (img === '') {
                    // no match in defined ranges.
                    img = symbolConfig.defaultImageUrl;
                }
            }

            return img;

        default:
            return symbolConfig.defaultImageUrl;
    }
}

/**
* Takes array and make a JSON object such that labels are the toplevel keys
*
* @param {Array} array that needs to be parsed into JSON obj
* @returns {Object} an JSON config object where labels are toplevel keys
*/
function labelObj(array) {
    const finalObj = {};

    array.forEach(o => {
        finalObj[o.name] = o;
    });

    return finalObj;
}

/**
* Convert an ESRI colour object to SVG rgb format.
* @private
* @param  {Object} c ESRI Colour object
* @return {String} colour in SVG format
*/
function colourToRgb(c) {
    if (c) {
        return `rgb(${c.r},${c.g},${c.b})`;
    } else {
        return 'none';
    }
}

/**
* Convert an ESRI colour object to SVG opacity format.
* @private
* @param  {Object} c ESRI Colour object
* @return {String} colour's opacity in SVG format
*/
function colourToOpacity(c) {
    if (c) {
        return c.a.toString();
    } else {
        return '0';
    }
}

/**
* Generate a utility object to help construct an SVG tag.
* @private
* @param  {String} type optional. the type of svg element (e.g. circle, path).
* @return {String} colour in SVG format
*/
function newSVG(type) {
    if (typeof type === 'undefined') {
        type = '';
    }
    const mySVG = {
        props: [],
        type
    };

    // adds a property to the property collection
    mySVG.addProp = (name, value) => {
        mySVG.props.push({ name, value });
    };

    // output the svg tag as string
    mySVG.belch = () => {

        // construct tag with properties.
        return `<${mySVG.type}` + mySVG.props.reduce((prev, curr) => {
            return prev + ` ${curr.name}="${curr.value}"`;
        }, '') + ' />';

    };
    return mySVG;
}

/**
* Calculate the SVG fill for a symbol.
* @private
* @param  {Object} symbol a Simple ESRI symbol object.
* @param  {Object} svg contains info on our SVG object (see newSVG). object is modified by the function
*/
function applyFill(symbol, svg) {

    // NOTE: we cannot use ESRI simple fill with styles VERTICAL, HORIZONTAL, CROSS, DIAGONAL CROSS, FORWARD DIAGONAL, BACKWARD DIAGONAL
    // ESRI implements these using image sprites containing the pattern, referenced in SVG using xlink tags.
    // xlink is not supported in data URLs, which is what we are using.
    // http://dbushell.com/2015/01/30/use-svg-part-2/

    // possible awful fix: we draw our SVG to a canvas, then export the image as a data url there.

    // second bad option: custom case, we have pre-made filled polygon (6 of them).  We would have to add the border (yuck)

    // ok solution: add a second svg <path> with the hashes in it. just be lines. thin width, black, straight.  can adjust to size

    // ------

    // the none case will only apply to polygons. point symbols can only be empty fill via opacity
    const fill = (symbol.type === 'simplefillsymbol' && symbol.style !== 'solid') ? 'none' : colourToRgb(symbol.color);

    svg.addProp('fill', fill);
    svg.addProp('fill-opacity', colourToOpacity(symbol.color));
    svg.addProp('fill-rule', 'evenodd');
}

/**
* Calculate the SVG line style for a symbol.
* @private
* @param  {Object} lineSymbol a Simple ESRI symbol object.
* @param  {Object} svg contains info on our SVG object (see newSVG). object is modified by the function
*/
function applyLine(lineSymbol, svg) {
    const stroke = lineSymbol.style === 'none' ? 'none' : colourToRgb(lineSymbol.color);

    svg.addProp('stroke', stroke);
    svg.addProp('stroke-opacity', colourToOpacity(lineSymbol.color));
    svg.addProp('stroke-width', lineSymbol.width.toString());
    svg.addProp('stroke-linecap', 'butt'); // huh huh
    svg.addProp('stroke-linejoin', 'miter');
    svg.addProp('stroke-miterlimit', '4');

    const dashMap = {
        solid: 'none',
        dash: '5.333,4',
        dashdot: '5.333,4,1.333,4',
        longdashdotdot: '10.666,4,1.333,4,1.333,4',
        dot: '1.333,4',
        longdash: '10.666,4',
        longdashdot: '10.666,4,1.333,4',
        shortdash: '5.333,1.333',
        shortdashdot: '5.333,1.333,1.333,1.333',
        shortdashdotdot: '5.333,1.333,1.333,1.333,1.333,1.333',
        shortdot: '1.333,1.333',
        none: 'none'
    };

    svg.addProp('stroke-dasharray', dashMap[lineSymbol.style]);

}

/**
* Calculate the SVG rotation for a symbol.
* @private
* @param  {Object} symbol a Simple ESRI symbol object.
* @param  {Object} svg contains info on our SVG object (see newSVG). object is modified by the function
*/
function applyRotation(symbol, svg) {

    // https://sarasoueidan.com/blog/svg-transformations/

    /*
    const toRad = ang => ang * (Math.PI / 180);
    const cos = Math.cos(toRad(angle));
    const sin = Math.sin(toRad(angle));
    // `matrix(${cos},${sin},${-sin},${cos},0,0)`);
    */

    const angle = symbol.angle || 0;
    svg.addProp('transform', `rotate(${angle},${maxW / 2},${maxH / 2})`);

}

/**
* Generate an SVG object for a circle marker symbol.
* @private
* @param  {Object} symbol a SimpleMarker ESRI symbol object, circle style.
* @return {Object} SVG object with circle-specific definitions
*/
function makeCircleSVG(symbol) {
    const circleSVG = newSVG('circle');

    // radius. size is diameter. cap at max image size
    circleSVG.addProp('r', Math.min(symbol.size / 2, (maxW - 4) / 2).toString());

    // center circle
    circleSVG.addProp('cx', (maxW / 2).toString());
    circleSVG.addProp('cy', (maxH / 2).toString());

    return circleSVG;
}

/**
* Calculate boundaries for drawing non-circle markers. Will cap boundaries at max image size.
* Assumes square image
* @private
* @param  {Number} size the size of the marker.
* @return {Object} object containing upper left (.upLeft), lower right (.loRite) and middle (.middle) boundaries
*/
function getGlyphCorners(size) {
    // if marker is too big, make it fit
    const trimSize = Math.min(size, maxW - 4);

    const offset = trimSize / 2;
    const middle = maxW / 2;
    return {
        upLeft: middle - offset,
        loRite: middle + offset,
        middle
    };
}

/**
* Generate an SVG object for a non-circle marker symbol.
* @private
* @param  {Object} symbol a SimpleMarker ESRI symbol object, non-circle style.
* @return {Object} SVG object with marker definitions
*/
function makeGlyphSVG(symbol) {
    const glyphSVG = newSVG('path');
    let path;

    // get the appropriate drawing path for the symbol
    if (symbol.style === 'path') {
        path = symbol.path;
    } else {
        // jscs:disable maximumLineLength
        const c = getGlyphCorners(symbol.size);
        switch (symbol.style) {
            case 'cross':
                path = `M ${c.upLeft},${c.middle} ${c.loRite},${c.middle} M ${c.middle},${c.loRite} ${c.middle},${c.upLeft}`;
                break;
            case 'diamond':
                path = `M ${c.upLeft},${c.middle} ${c.middle},${c.loRite} ${c.loRite},${c.middle} ${c.middle},${c.upLeft} Z`;
                break;
            case 'square':
                path = `M ${c.upLeft},${c.upLeft} ${c.upLeft},${c.loRite} ${c.loRite},${c.loRite} ${c.loRite},${c.upLeft} Z`;
                break;
            case 'x':
                path = `M ${c.upLeft},${c.upLeft} ${c.loRite},${c.loRite} M ${c.upLeft},${c.loRite} ${c.loRite},${c.upLeft}`;
                break;
        }

        // jscs:enable maximumLineLength
    }

    glyphSVG.addProp('d', path);
    return glyphSVG;
}

/**
* Generate an SVG object for a simple marker symbol.
* @private
* @param  {Object} symbol a SimpleMarker ESRI symbol object
* @return {Object} SVG object with marker definitions
*/
function makeMarkerSVG(symbol) {
    let svg;

    if (symbol.style === 'circle') {
        svg = makeCircleSVG(symbol);
    } else {
        svg = makeGlyphSVG(symbol);
    }

    applyLine(symbol.outline, svg);
    applyFill(symbol, svg);
    applyRotation(symbol, svg);

    return svg;

}

/**
* Generate an SVG object for a simple fill symbol.
* @private
* @param  {Object} symbol a SimpleFill ESRI symbol object
* @return {Object} SVG object with fill definitions
*/
function makePolySVG(symbol) {
    const polySVG = newSVG('rect');

    polySVG.addProp('x', '4');
    polySVG.addProp('y', '4');
    polySVG.addProp('width', (maxW - 8).toString());
    polySVG.addProp('height', (maxH - 8).toString());
    applyFill(symbol, polySVG);
    applyLine(symbol.outline, polySVG);

    return polySVG;
}

/**
* Generate an SVG object for a simple line symbol.
* @private
* @param  {Object} symbol a SimpleLine ESRI symbol object
* @return {Object} SVG object with line definitions
*/
function makeLineSVG(symbol) {
    const lineSVG = newSVG('path');

    // diagonal line
    lineSVG.addProp('d', `M 4,4 ${maxW - 4},${maxH - 4}`);

    applyLine(symbol, lineSVG);

    return lineSVG;
}

/**
* Generate an SVG definition for a simple symbol.
* @private
* @param  {Object} symbol a Simple ESRI symbol object
* @return {String} symbol svg as text
*/
function makeSVG(symbol) {

    const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxW}" height="${maxH}">`;
    const foot = '</svg>';

    const typeHandler = {
        simplemarkersymbol: makeMarkerSVG,
        simplelinesymbol: makeLineSVG,
        cartographiclinesymbol: makeLineSVG,
        simplefillsymbol: makePolySVG
    };

    const svg = typeHandler[symbol.type](symbol);

    // use single quotes so they will not be escaped (less space in browser)
    return (head + svg.belch() +  foot).replace(/"/g, `'`);

}

/**
* Generate a legend item for an ESRI symbol.
* @private
* @param  {Object} symbol an ESRI symbol object
* @param  {String} label label of the legend item
* @return {Object} a legend object populated with the symbol and label
*/
function symbolToLegend(symbol, label) {
    let imageData = emptySVG;
    let contentType = 'image/svg+xml';

    try {
        switch (symbol.type) {
            case 'simplemarkersymbol':
            case 'simplelinesymbol':
            case 'simplefillsymbol':
            case 'cartographiclinesymbol':

                imageData = makeSVG(symbol);
                break;

            case 'picturemarkersymbol':
            case 'picturefillsymbol':

                if (symbol.url.substr(0, 4) !== 'data') {
                    // FIXME add a more elegant fail, perhaps a default image and output a WARN
                    //       long-term fix is to add another property to the legend return value, and
                    //       if set, the UI will just use the image instead of building a data url
                    // FIXME additional for picturefill, we would want to account for the border.
                    //       basically the same issue as the non-solid simplefillsymbol, in that
                    //       svg data urls cannot x-link to other images
                    throw new Error('picture marker symbol did not have a data url: ' + symbol.url);
                }

                // normal url content should be in format 'data:image/png;base64,iVBORw0KGgo...'
                imageData = symbol.url.substr(symbol.url.indexOf(',') + 1);
                contentType = symbol.contentType;
                break;

            case 'textsymbol':

                // not supporting at the moment
                // FIXME return a blank or default image (maybe a picture of 'Aa') to stop things from breaking
                throw new Error('no support for feature service legend of text symbols');
        }
    } catch (e) {
        console.error('Issue encountered when converting symbol to legend image', e);
        label = 'Error!';
    }
    return { label, imageData, contentType };
}

/**
* Generate an array of legend items for an ESRI unique value or class breaks renderer.
* @private
* @param  {Object} renderer an ESRI unique value or class breaks renderer
* @return {Array} a legend object populated with the symbol and label
*/
function scrapeListRenderer(renderer) {
    const legend = renderer.infos.map(rendInfo => {
        return symbolToLegend(rendInfo.symbol, rendInfo.label);
    });

    if (renderer.defaultSymbol) {
        // class breaks dont have default label
        // TODO perhaps put in a default of "Other", would need to be in proper language
        legend.push(symbolToLegend(renderer.defaultSymbol, renderer.defaultLabel || ''));
    }

    return legend;
}

/**
* Generate a legend object based on an ESRI renderer.
* @private
* @param  {Object} renderer an ESRI renderer object
* @param  {Integer} index the layer index of this renderer
* @return {Object} an object matching the form of an ESRI REST API legend
*/
function rendererToLegend(renderer, index) {
    // make basic shell object with .layers array
    const legend = {
        layers: [{
            layerId: index,
            legend: []
        }]
    };

    // determine renderer type, call something that makes legend array
    const lType = getRendererType(renderer);

    switch (lType) {
        case 'SimpleRenderer':
            legend.layers[0].legend.push(symbolToLegend(renderer.symbol, renderer.label));
            break;

        case 'UniqueValueRenderer':
        case 'ClassBreaksRenderer':
            legend.layers[0].legend = scrapeListRenderer(renderer);
            break;

        default:

            // FIXME make a basic blank entry (error msg as label?) to prevent things from breaking
            // Renderer we dont support
            console.log('encountered unsupported renderer legend type: ' + lType);
    }
    return legend;
}

/**
* Takes the lod list and finds level as close to and above scale limit
*
* @param {Array} lods array of esri LODs https://developers.arcgis.com/javascript/jsapi/lod-amd.html
* @param {Integer} maxScale object largest zoom level for said layer
* @returns {Number} current LOD
*/
function getZoomLevel(lods, maxScale) {
    // Find level as close to and above scaleLimit
    const scaleLimit = maxScale; // maxScale obj in returned config
    let found = false;
    let currentLod = Math.ceil(lods.length / 2);
    let lowLod = 0;
    let highLod = lods.length - 1;

    if (maxScale === 0) {
        return lods.length - 1;
    }

    // Binary Search
    while (!found) {
        if (lods[currentLod].scale >= scaleLimit) {
            lowLod = currentLod;
        } else {
            highLod = currentLod;
        }
        currentLod = Math.floor((highLod + lowLod) / 2);
        if (highLod === lowLod + 1) {
            found = true;
        }
    }
    return currentLod;
}

module.exports = function () {
    return {
        createSymbologyConfig,
        getGraphicIcon,
        rendererToLegend,
        getZoomLevel
    };
};
