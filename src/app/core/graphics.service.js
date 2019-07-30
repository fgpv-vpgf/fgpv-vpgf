import 'svg.textflow.js';

/**
 * @name graphicsService
 * @constant
 * @memberof app.common
 * @description
 *
 * Contains helper functions for working with svg and canvas objects.
 */
angular.module('app.core').factory('graphicsService', graphicsService);

function graphicsService($q) {
    window.RAMP.utils = {
        svgToCanvas,
        createCanvas,
        mergeCanvases,
        isTainted
    };

    const service = {
        svgToCanvas,
        createSvg,
        createCanvas,
        mergeCanvases,
        getTextWidth,
        setSvgHref,
        imageLoader,
        isTainted
    };

    return service;

    /**
     * Renders a supplies svg onto a provided canvas object.
     *
     * @function svgToCanvas
     * @param {Object} svg an svg node to be converted to the canvas
     * @param {Object} canvas a target canvas to render the specified svg onto
     * @param {Object} optionOverrides [optional = {}] optional settings to use with `canvg` converter
     * @return {Promise} a promise resolving with a canvas
     */
    function svgToCanvas(svg, canvas, optionOverrides = {}) {
        const defaultOptions = {
            ignoreAnimation: true,
            ignoreMouse: true
        };

        const svgPromise = $q(resolve => {
            const options = angular.extend(
                defaultOptions,
                optionOverrides,
                { useCORS: false },
                { renderCallback: () => resolve(canvas) }
            );

            canvg(canvas, svg.node.outerHTML, options);
        });

        return svgPromise;
    }

    /**
     * Creates a canvas DOM node;
     * @function createCanvas
     * @param {Number} width target width with of the canvas
     * @param {Number} height target height with of the canvas
     * @param {String} backgroundColor [optional = null] if specified, the canvas is coloured with it
     * @return {Object} canvas DOM node
     */
    function createCanvas(width, height, backgroundColor = null) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        if (backgroundColor !== null) {
            const context = canvas.getContext('2d');

            // paint it white
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, width, height);
        }

        return canvas;
    }

    /**
     * Creates an instance of SVG.JS object.
     *
     * @function createSvg
     * @param {Number} width width of the svg container
     * @param {Number} height height of the svg container
     * @return {Object} svg object
     */
    function createSvg(width = null, height = null) {
        const svg = SVG(document.createElement('div'));

        if (width && height) {
            svg.size(width, height);
        }

        return svg;
    }

    /**
     * Merges canvases together and returns the result.
     *
     * @function mergeCanvases
     * @param {Array} canvases an array of canvases to mergeCanvases; the first item acts as a base on which all other canvases are rendered in order
     * @param {Array} offsets [optional = []] must be of n-1 length where n is the number of canvases; provides x and y offsets when merging canvases on the base canvas
     * @return {Object} merged canvas object
     */
    function mergeCanvases(canvases, offsets = []) {
        const baseCanvas = canvases.shift();
        const baseContext = baseCanvas.getContext('2d');

        canvases.forEach((canvas, index) => {
            const offset = offsets[index] || [0, 0];
            baseContext.drawImage(canvas, ...offset);
        });

        return baseCanvas;
    }

    /**
     * Returns width of the supplied text string.
     * @function getTextWidth
     * @param  {Object} canvas cached canvas node
     * @param  {String} text   string of text to measure
     * @param  {String} font   text font and size https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
     * @return {Number}        width of the text
     */
    function getTextWidth(canvas, text, font) {
        const context = canvas.getContext('2d');
        context.font = font;

        // measure text width on the canvas: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText
        const metrics = context.measureText(text);
        return metrics.width;
    }

    /**
     * Returns svg with proper href value. for Safari, xlink:href element is named ns1:href. Rename the element xlink:href to show symbology.
     * it seems to be a bug from svg.js library.
     * @function setSvgHref
     * @param  {String} link link to reset the href for
     * @return {String}        reset href
     */
    function setSvgHref(link) {
        // TODO: send issue to svg library
        return link.replace(/ns1:href/gi, 'xlink:href');
    }

    /**
     * Returns a promise that resolves with the image, rejects if it surpases the timeout (10 seconds by default)
     * @function imageLoader
     * @param {String} src the source for the image
     * @param {number} [timeout=10000] an optional timeout after which the image loading should fails assuming the service is not responding
     * @return {Promise<image>} A promise resolving with the loaded image
     */
    function imageLoader(src, timeout = 10000) {
        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);

            // ios safari 10.3 taints canvas with data urls unless crossOrigin is set to anonymous
            // always try to load as CORS; if fails, the orignal image will be used (it will taint the canvas though)
            img.crossOrigin = 'anonymous';

            img.onerror = reject;
            img.src = src;
            if (img.complete === true) {
                // Inline XML images may fail to parse, throwing an Error later on
                setTimeout(() => resolve(img), 500);
            }

            window.setTimeout(() => reject('timeout'), timeout);
        });
        return loadPromise;
    }

    /**
     * Returns true if canvas is tained (not readable), false otherwise
     * @function isTainted
     * @param {Image | Canvas} item the image or canvas to test
     * @returns {boolean} true iff image/canvas is not readable
     */
    function isTainted(item) {
        let ctx;

        // if image, first draw it on a piece of canvas
        if (item.nodeName === 'IMG') {
            const testCanvas = createCanvas(item.width, item.height);
            ctx = testCanvas.getContext('2d');
            ctx.drawImage(item, 0, 0);
        } else {
            ctx = item.getContext('2d');
        }

        try {
            ctx.getImageData(0, 0, 1, 1);
            return false;
        } catch (err) {
            return true;
        }
    }
}
