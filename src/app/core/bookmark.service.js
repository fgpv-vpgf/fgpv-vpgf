/**
 *
 * @name bookmarkService
 * @module app.core
 *
 * @description bookmarkService handles creation and parsing of bookmarks.
 *
 */
angular
    .module('app.core')
    .factory('bookmarkService', bookmarkService);

function bookmarkService($q, configService, gapiService, bookmarkVersions, Geo, ConfigObject) {

    let _bookmarkObject = null;
    let _orderdBookmarkIds = [];

    const service = {
        getBookmark,
        parseBookmark,
        adjustRcsLanguage,
        extractRcsLayers,
        insertRcsLayers,
        get storedBookmark() { return _bookmarkObject; },
        getOrderdBookmarkIds() { return _orderdBookmarkIds},
        emptyStoredBookmark() { _bookmarkObject = null; },
        emptyOrderdBookmarkIds() { _orderdBookmarkIds = []; }
    };

    return service;

    /************************/

    /**
     * Creates a bookmark containing the current state of the viewer
     *
     * @function getBookmark
     * @param {StartPoint} startPoint [optional] map center point cast into a target basemap projection; used when switching projections
     * @returns {String}    The bookmark containing basemap, extent, layers and their options
     */
    function getBookmark(startPoint = null) {
        // TODO: possibly race condition to clean up or need basemapService to expose original projection
        const mapConfig = configService.getSync.map;

        // we tack a flag at the end to indicate if we were in blank mode or not
        // when switching projections using bookmark, `selectedBasemap` is already set to target projection
        const basemap = encode64(mapConfig.selectedBasemap.id + '0');

        if (startPoint === null) {
            const mapInstance = mapConfig.instance;
            const mapExtent = mapInstance.extent.getCenter();

            // get zoom scale
            // get center coords
            startPoint = {
                x: mapExtent.x,
                y: mapExtent.y,
                scale: mapInstance._map.getScale()
            };
        }

        const layerBookmarks = _getLayerRecords()
            // filter out `userAdded` layers
            .filter(layerRecord => !layerRecord.config.state.userAdded)
            .map(layerRecord => encode64(makeLayerBookmark(layerRecord)));

        // bookmarkVersions.? is the version. update this accordingly whenever the structure of the bookmark changes
        const bookmark = `${bookmarkVersions.B},${basemap},${encode64(startPoint.x)},${encode64(startPoint.y)},${encode64(startPoint.scale)}` +
            (layerBookmarks.length > 0 ? `,${layerBookmarks.toString()}` : '');

        console.log('bookmarkService', 'bookmark object', bookmark);

        return bookmark;

        function _getLayerRecords() {
            if (mapConfig.legend.type === ConfigObject.TYPES.legend.AUTOPOPULATE) {
                // - removed layers in the "undo" time frame will be bookmarked
                // - bookmark layers in the same order they appear in the main panel - needed for autolegend only
                return mapConfig.legendBlocks.entries.map(legendBlock =>
                    mapConfig.layerRecords.find(layerRecord =>
                        layerRecord.config.id === legendBlock.layerRecordId));
            } else {
                return mapConfig.layerRecords;
            }
        }
    }

    /**
     * Converts an integer to a fixed-length character representation in binary.
     * The number will be zero-padded on the left to the specified size. E.g. encodeInteger(1, 3) = '001'
     *
     * @function encodeInteger
     * @private
     * @param {Number} value        Integer value to encode
     * @param {Number} bitSize      Number of characters in resulting binary encoding
     * @returns {String}            Digit string representation of value in binary, padded
     */
    function encodeInteger(value, bitSize) {
        const binary = value.toString(2);
        return '0'.repeat(bitSize - binary.length) + binary;
    }

    /**
     * Converts a boolean to a 1 or 0 character.
     *
     * @function encodeBoolean
     * @private
     * @param {Boolean} value        A boolean value
     * @returns {String}             One digit string representation the boolean, in binary. 1 or 0
     */
    function encodeBoolean(value) {
        return value ? '1' : '0';
    }

    /**
     * Converts 1 or 0 character to a boolean.
     *
     * @function decodeBoolean
     * @private
     * @param {Boolean} value        A boolean value
     * @returns {String}             One digit string representation the boolean, in binary. 1 or 0
     */
    function decodeBoolean(value) {
        // very complex
        return value === '1';
    }

    /**
     * Converts a string in binary to a string in hexadecimal
     * Length of binary input should be a multiple of 4
     *
     * @function binaryToHex
     * @private
     * @param {String} value        A string of binary characters
     * @returns {String}            Input value encoded as a string of hexadecimal characters.
     */
    function binaryToHex(value) {
        // haha nope. parseInt(value, 2) will try to cram an enormous number into a decimal float
        // return parseInt(value, 2).toString(16);

        const fourBits = value.match(/.{1,4}/g);
        return fourBits.map(b4 => parseInt(b4, 2).toString(16)).join('');
    }

    /**
     * Converts a string in hexadecimal to a string in binary
     *
     * @function hexToBinary
     * @private
     * @param {String} value        A string of hexadecimal characters
     * @returns {String}            Input value encoded as a string of hexadecimal characters.
     */
    function hexToBinary(value) {
        const hexes = value.match(/./g); // split into single chars
        return hexes.map(h =>
            encodeInteger(parseInt(h, 16), 4) // 4-digit padded binary
        ).join('');
    }

    /**
     * Converts an opacity number to a fixed-length character representation in binary.
     * Values are multiplied by 100, and mapped from range 0 - 1  to 0000000 - 1100100 (0 - 100 in decimal).
     * We always pad to seven binary digits.
     *
     * @function encodeOpacity
     * @private
     * @param {Number} value        Opacity value of a layer. A Decimal between 0 and 1
     * @returns {String}            Seven digit string representation of value multiplied by 100, in binary
     */
    function encodeOpacity(value) {
        // sometimes we get weird decimal numbers coming in, like 0.5599999999999 instead of 0.56
        // so use the rounding function
        return encodeInteger(Math.round(value * 100), 7);
    }

    /**
     * Converts a binary encoding of opacity to an actual opacity number
     * Values are mapped from range 0000000 - 1100100 (0 - 100 in decimal) to 0 - 1.
     *
     * @function decodeOpacity
     * @private
     * @param {String} value        Opacity value of a layer. A binary string between 0000000 and 1100100
     * @returns {Number}            Converted value in the range of 0 to 1
     */
    function decodeOpacity(value) {
        return parseInt(value, 2) / 100;
    }

    /**
     * Create bookmark sub-string for a layer.  Consists of <Layer Code><Layer Settings><Children Info><Layer Id>
     *
     * @function makeLayerBookmark
     * @private
     * @param {Object} legendEntry  Legend entry of the layer
     * @returns {String}            Layer information encoded in bookmark format.
     */
    function makeLayerBookmark(layerRecord) {
        // returning <Layer Code><Layer Settings><Children Info><Layer Id>

        let legendEntry = null;

        const layerDefinition = layerRecord.config;

        // Layer Code
        const types = Geo.Layer.Types;
        const typeToCode = {
            [types.ESRI_FEATURE]: '0',
            [types.OGC_WMS]: '1',
            [types.ESRI_TILE]: '2',
            [types.ESRI_DYNAMIC]: '3',
            [types.ESRI_IMAGE]: '4'
        };
        const layerCode = typeToCode[layerDefinition.layerType];

        // determines what states we should inspect dynamic children
        // for bookmark. if not loaded & stable, we ignore children
        // and let them go back to default when bookmark loads
        const goodState = state => {
            switch (state) {
            case Geo.Layer.States.ERROR:
            case Geo.Layer.States.LOADING:
            case Geo.Layer.States.NEW:
                return false;
            default:
                return true;
            }
        };

        // Children Info (calculate first so we have the count when doing layer settings)
        let childItems = [];
        if (layerCode === typeToCode[types.ESRI_DYNAMIC] && layerDefinition.layerEntries &&
            goodState(layerRecord.state)) {

            // walk the child tree encoding each child
            // we need to be aware of hierarchy here (at least on the top level).
            // top-level children of the layer get rootFlag set to true
            // NOTE: our decision is that if a child item is deleted, it
            //       is preserved in the bookmark (and will re-appear when
            //       bookmark is restored). Encoding deleted children will
            //       be entertained when we move to super-fancy state storage.
            childItems = simpleWalk(layerRecord.getChildTree(), true);

            // TODO we currently have an open debate about disallowing funny nesting.
            // funny nesting is when you have the same layer endpoint showing
            // twice in the legend.  once as a root, once as an autogenerated child
            // e.g.
            //   - layer 0
            //      - layer 1  <-- autogenerated as it is a child of 0
            //      - layer 2
            //   - layer 1

            // if we ban this, then the above code is ok.
            // if we allow it, we will probably want some kind of checking that will eliminate
            // any duplicates, likely giving priority to a root-level entry.
        }

        // <Layer Settings> = <Opacity><Visibility><Bounding Box><Snapshot><Query><Child Count>

        const layerProxy = layerRecord.getProxy();

        const opacity = encodeOpacity(layerProxy.opacity);
        const viz = encodeBoolean(layerProxy.visibility);
        const bb = encodeBoolean(layerDefinition.state.boundingBox);
        const query = encodeBoolean(layerDefinition.state.query);
        const snap = encodeBoolean(layerDefinition.state.snapshot);

        const layerSettingAndChildren = opacity + viz + bb + snap + query +
            encodeInteger(childItems.length, 9) + childItems.join('');

        // <Layer Code><Layer Settings><Children Info><Layer Id>
        return layerCode + binaryToHex(layerSettingAndChildren) + layerDefinition.id;

        function simpleWalk(treeChildren, root = false) {
            // roll in the results into a flat array
            return [].concat.apply([], treeChildren.map((treeChild, index) => {
                if (treeChild.childs) {
                    return [].concat(simpleWalk(treeChild.childs));
                } else {
                    return encodeLegendChild(treeChild, root);
                }
            }));
        }

        /**
         * Encode bookmark information of a sub-layer of legend (currently Dynamic only, possibly WMS in future)
         *
         * @function encodeLegendChild
         * @private
         * @param {Object} legendChild        Legend entry to encode
         * @param {Boolean} root              True if legendChild is top-level in the legend
         * @returns {String}                  Encoded information in a 24-char binary data string
         */
        function encodeLegendChild(treeChild, root) {

            const childProxy = layerRecord.getChildProxy(treeChild.entryIndex);
            const childConfig = layerRecord.config.layerEntries.find(layerEntry =>
                layerEntry.index === treeChild.entryIndex);

            const opacity = encodeOpacity(childProxy.opacity);
            const viz = encodeBoolean(childProxy.visibility);
            const query = encodeBoolean(childConfig.state.query);
            const idx = encodeInteger(treeChild.entryIndex, 12);

            // extra 00 is padding to make our child have a length that is a factor of 4 (so it is encoded in 6 hex character)
            return opacity + viz + query + encodeBoolean(root) + idx + '00';

        }
    }

    /**
     * Will extract the core rcs key from a system-defined rcs layer id.
     * E.g. 'rcs.MyKey.fr' will result in 'MyKey'
     * An id with invalid format will return itself
     *
     * @function extractRcsKey
     * @param {String} rcsLayerId   An rcs layer id. Ideally in the format rcs.<key>.<lang>
     * @returns {String}            The rcs key embedded in the id
     */
    function extractRcsKey(rcsLayerId) {
        return rcsLayerId.split('.')[1] || rcsLayerId;
    }

    /**
     * Reads and applies the options specified by bookmark to config
     *
     * @function parseBookmark
     * @param {String} bookmark     A bookmark created by getBookmark
     * @param {Object} origConfig   The config object to modify
     * @param {Object} [opts={}]    Optional parameters:
     *                                `newKeyList` an array of RCS keys
     *                                `newBaseMap` basemap ID to switch to
     *                                `newLang` the language code we are switching to
     * @returns {Object}            The config with changes from the bookmark
     */
    // eslint-disable-next-line max-statements
    function parseBookmark(bookmark/*, origConfig, opts*/) {
        // this methods uses a lot of sub-methods because of the following rules
        // RULE #1 single method can't have more than 40 commands
        // RULE #2 obey all rules

        // const config = angular.copy(origConfig);

        const dBookmark = decodeURI(bookmark);
        // const { newKeyList, newBaseMap, newLang } = opts;

        console.log('bookmarkService', 'in function *parseBookmark* the decoded URI is', dBookmark);

        const version = dBookmark.match(/^([^,]+)/)[0];

        const bookmarkObject = {
            basemap: null,
            x: null,
            y: null,
            scale: null,
            layers: null
        };

        //let blankBaseMap = false;
        let basemap;
        let x;
        let y;
        let scale;
        let layers;

        /**
         * Extracts and decodes the top level parts of the bookmark.
         *
         * @function decodeMainBookmark
         * @private
         */
        function decodeMainBookmark() {
            const pattern = /^([^,]+),([^,]+),([^,]+),([^,]+),([^,]+)(?:$|,(.*)$)/i;
            const info = dBookmark.match(pattern);

            // pull out non-layer info
            const chunks = [2, 3, 4, 5].map(i => decode64(info[i]));
            bookmarkObject.basemap = chunks[0];
            bookmarkObject.x = chunks[1];
            bookmarkObject.y = chunks[2];
            bookmarkObject.scale = chunks[3];

            // also store any layer info
            bookmarkObject.layers = info[6];

            if (version !== bookmarkVersions.A) {
                // blankBaseMap = basemap.substr(basemap.length - 1, 1) === '1';
                bookmarkObject.basemap = bookmarkObject.basemap.substring(0, bookmarkObject.basemap.length - 1);
            }
        }

        decodeMainBookmark();

        // Make sure there are layers before trying to loop through them
        if (bookmarkObject.layers) {
            const layerData = bookmarkObject.layers.split(',');

            // create partial layer configs from layer bookmarks
            bookmarkObject.bookmarkLayers = parseLayers(layerData, version);

            // FIXME: restore
            // modify main config using layer configs
            //filterConfigLayers(bookmarkLayers, config);
        } else {
            bookmarkObject.bookmarkLayers = [];
        }
        // record the order of legends from the bookmark
        for (let layer of bookmarkObject.bookmarkLayers) {
            _orderdBookmarkIds.push(layer.id);
        }

        _bookmarkObject = bookmarkObject;
    }

    /**
     * Converts a layer settings block (in hex text encoding) into a nice
     * object with all values decoded
     *
     * @function extractLayerSettings
     * @private
     * @param {String} layerSettingsHex     Layer settings encoded in hex string
     * @returns {Object}                    Layer settings decoded in an object
     */
    function extractLayerSettings(layerSettingsHex) {
        const [, opac, vis, bb, snap, query, childCount] =
                    hexToBinary(layerSettingsHex).match(/^(.{7})(.)(.)(.)(.)(.{9})/);

        // Note that property names here must match how they are spelled in the config options
        return {
            opacity: decodeOpacity(opac),
            visibility: decodeBoolean(vis),
            boundingBox: decodeBoolean(bb),
            snapshot: decodeBoolean(snap),
            query: decodeBoolean(query),
            childCount: parseInt(childCount, 2)
        };
    }

    /**
     * Converts a child layer settings block (in hex text encoding) into a nice
     * object with all values decoded
     *
     * @function extractChildSettings
     * @private
     * @param {String} childSettingsHex     Child layer settings encoded in hex string
     * @returns {Object}                    Child layer settings decoded in an object
     */
    function extractChildSettings(childSettingsHex) {
        const [, opac, vis, query, root, idx] =
                    hexToBinary(childSettingsHex).match(/^(.{7})(.)(.)(.)(.{12})/);

        // Note that property names here must match how they are spelled in the config options
        return {
            opacity: decodeOpacity(opac),
            visibility: decodeBoolean(vis),
            query: decodeBoolean(query),
            index: parseInt(idx, 2),
            root: decodeBoolean(root)
        };
    }

    /**
     * Turns layer bookmarks into partial layer configs
     *
     * @function parseLayers
     * @param {Array} layerDataStrings      Array of layer bookmarks
     * @param {String} version              Version of the bookmark
     * @returns {Object}                    Partial configs created from each layer bookmark
     */
    function parseLayers(layerDataStrings, version) {
        const layerObjs = [];

        // due to the large divergance between version A and B,
        // and plans to secretly drop support for version A at some point,
        // will just have two separate code blocks.
        // fancier integration / code sharing can be considered after the
        // state snapshot refactor, which will likely change the whole situation.

        if (version === bookmarkVersions.A) {
            console.warn('The Bookmark A format is no longer supported;')

            return;
        } else {
            // assume version B, get fancier after refactors

            layerDataStrings.forEach(layer => {
                layer = decode64(layer);

                // take first 6 characters, which are layer code (1) & layer settings (5)
                // /^(.)(.{5})/
                const [, layerCode, layerSettingsHex] = layer.match(/^(.)(.{5})/);

                // decode layer settings
                // this is actually a bookmarked layer state
                const layerSettings = extractLayerSettings(layerSettingsHex);


                // get layer id from remaining data
                const layerId = layer.substring(6 + (layerSettings.childCount * 6));

                const snippet = {
                    id: layerId,
                    state: layerSettings
                };

                if (layerSettings.childCount > 0) {
                    // TODO currently we only have dynamic layers allowed to have childs
                    //      so this code adds dynamic-specific properties to the config snippet.
                    //      If we ever support WMS children, it may have different properties
                    //      and this part of the code will need to be adjusted.

                    snippet.layerEntries = [];

                    // get entire swath of child data
                    const childrenInfo = layer.substr(6, layerSettings.childCount * 6);

                    // split into individual childs (6 chars) and process
                    const childItems = childrenInfo.match(/.{6}/g);
                    childItems.forEach(child => {
                        // decode from hex into settings
                        // is is child layer state
                        const childSettings = extractChildSettings(child);

                        snippet.layerEntries.push({
                            stateOnly: true,
                            state: childSettings,
                            index: childSettings.index
                        });
                    });
                }

                layerObjs.push(snippet);
            });

        }

        return layerObjs;
    }

    /**
     * Updates the rcs keys in the stored bookmark to compensate for a language switch.
     *
     * @function adjustRcsLanguage
     * @param {String} newLang    the language key to adjust the rcs keys to
     */
    function adjustRcsLanguage(newLang) {
        if (_bookmarkObject && _bookmarkObject.bookmarkLayers) {
            const trimLang = newLang.substring(0, 2);
            _bookmarkObject.bookmarkLayers.forEach(bmLayer => {
                const id = bmLayer.id;
                if (id.indexOf('rcs.') === 0) {
                    bmLayer.id = id.substr(0, id.length - 2) + trimLang;
                }
            });
        }
    }

    /**
     * Removes any RCS based layer config objects from the bookmark, and returns them.
     *
     * @function extractRcsLayers
     * @returns {Array} list of any RCS based layer config objects in the bookmark
     */
    function extractRcsLayers() {
        const rcsLayers = [];
        const regLayers = [];
        if (_bookmarkObject && _bookmarkObject.bookmarkLayers) {
            // sort layers into two buckets.
            _bookmarkObject.bookmarkLayers.forEach(bmLayer => {
                const id = bmLayer.id;
                if (id.indexOf('rcs.') === 0) {
                    rcsLayers.push(bmLayer);
                } else {
                    regLayers.push(bmLayer);
                }
            });

            // overwrite the bookmark objection with the non-rcs layer array
            _bookmarkObject.bookmarkLayers = regLayers;
        }
        return rcsLayers;
    }

    /**
     * Inserts RCS based layer config objects into the bookmark
     *
     * @function insertRcsLayers
     * @param {Array} rcsLayerConfigs list of RCS based layer config objects to add to the bookmark
     */
    function insertRcsLayers(rcsLayerConfigs) {
        // TODO handle the case where the if fails?
        if (_bookmarkObject && _bookmarkObject.bookmarkLayers) {
            _bookmarkObject.bookmarkLayers.push(...rcsLayerConfigs);
        }
    }

    /**
     * Encodes the string using base64 and replaces '/' and '+'. This is a URL safe encoding; https://tools.ietf.org/html/rfc4648#page-7
     *
     * @function encode64
     * @private
     * @param {String} string   The string to encode
     * @returns {String}        The encoded string
     */
    function encode64(string) {
        return btoa(string).replace(/\=/g, '').replace(/\//g, '_').replace(/\+/g, '-');
    }

    /**
     * Decodes a string that was encoded using {@link encode64}. URL safe; https://tools.ietf.org/html/rfc4648#page-7
     *
     * @function decode64
     * @private
     * @param {String} string   The string to decode
     * @returns {String}        The decoded string
     */
    function decode64(string) {
        return atob(string.replace(/_/g, '/').replace(/-/g, '+'));
    }
}
