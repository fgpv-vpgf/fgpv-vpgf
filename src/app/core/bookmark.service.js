/* global RV */
(() => {

    /**
     * @ngdoc service
     * @name bookmarkService
     * @module app.core
     *
     * @description bookmarkService handles creation and parsing of bookmarks.
     *
     */
    angular
        .module('app.core')
        .factory('bookmarkService', bookmarkService);

    function bookmarkService($rootElement, $q, geoService, LayerBlueprint,
            LayerRecordFactory, configService, gapiService, bookmarkVersions, Geo) {

        const blankPrefix = 'blank_basemap_';

        const service = {
            getBookmark,
            parseBookmark
        };

        return service;

        /************************/

        /**
         * Creates a bookmark containing the current state of the viewer
         *
         * @function getBookmark
         * @returns {String}    The bookmark containing basemap, extent, layers and their options
         */
        function getBookmark() {
            // TODO: possibly race condition to clean up or need basemapService to expose original projection

            // we tack a flag at the end to indicate if we were in blank mode or not
            const bmkey = geoService.Map.BasemapControl.basemapGallery.getSelected().id +
                (geoService.state.blankBaseMapId ? '1' : '0');
            const basemap = encode64(bmkey);

            const mapExtent = geoService.mapObject.extent.getCenter();

            // get zoom scale
            // get center coords
            const extent = {
                x: encode64(mapExtent.x),
                y: encode64(mapExtent.y),
                scale: encode64(geoService.mapObject.getScale())
            };

            // loop through layers in legend, remove user added layers and "removed" layer which are in the "undo" time frame
            const legend = geoService.legend.items.filter(legendEntry =>
                !legendEntry.flags.user.visible && !legendEntry.removed);
            const layerBookmarks = legend.map(legendEntry =>
                encode64(makeLayerBookmark(legendEntry)));

            // bookmarkVersions.? is the version. update this accordingly whenever the structure of the bookmark changes
            const bookmark = `${bookmarkVersions.B},${basemap},${extent.x},${extent.y},${extent.scale}` +
                (layerBookmarks.length > 0 ? `,${layerBookmarks.toString()}` : '');
            RV.logger.log('bookmarkService', 'bookmark object', bookmark);
            return bookmark;

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
            return hexes.map(h => {
                return encodeInteger(parseInt(h, 16), 4); // 4-digit padded binary
            }).join('');
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
         * Encode an object property (possibly nested), or handle the case that the property does not exist.
         * Target property should be a boolean. All values will be converted to boolean result (encoded).
         *
         * @function encodeProperty
         * @private
         * @param {Object} obj          Object to inspect for the property
         * @param {Array} propChain     Property names in an array. E.g. testing for obj.prop1.prop2 would use ['prop1', 'prop2']
         * @returns {String}            One digit string representation the property (or default if missing), in binary. 1 or 0
         */
        function encodeProperty(obj, propChain) {
            let pointer = obj;

            // since we want to break the loop, use for instead of .forEach
            for (let i = 0; i < propChain.length; i++) {
                const p = propChain[i];
                if (pointer.hasOwnProperty(p)) {
                    pointer = pointer[p];
                } else {
                    // property doesn't exist.  default to false
                    pointer = false;
                    break;
                }
            }

            // if we've made it here, our property exists and has a value.  encode it
            return encodeBoolean(pointer);
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
        function encodeLegendChild(legendChild, root) {

            // TODO do we need this extra check?
            //      will the getOpacity function handle the value of something without opacity?
            const opacity = legendChild.options.opacity ? encodeOpacity(legendChild.getOpacity()) : encodeOpacity(1);
            const viz = encodeBoolean(legendChild.getVisibility());
            const query = encodeProperty(legendChild, ['options', 'query', 'value']);
            const idx = encodeInteger(legendChild.featureIdx, 12);

            // extra 00 is padding to make our child have a length that is a factor of 4 (so it is encoded in 6 hex character)
            return opacity + viz + query + encodeBoolean(root) + idx + '00';

        }

        /**
         * Create bookmark sub-string for a layer.  Consists of <Layer Code><Layer Settings><Children Info><Layer Id>
         *
         * @function makeLayerBookmark
         * @private
         * @param {Object} legendEntry  Legend entry of the layer
         * @returns {String}            Layer information encoded in bookmark format.
         */
        function makeLayerBookmark(legendEntry) {
            // FIXME: remove use of accessing info via _layerRecord
            // returning <Layer Code><Layer Settings><Children Info><Layer Id>

            // Layer Code
            const types = Geo.Layer.Types;
            const typeToCode = {
                [types.ESRI_FEATURE]: '0',
                [types.OGC_WMS]: '1',
                [types.ESRI_TILE]: '2',
                [types.ESRI_DYNAMIC]: '3',
                [types.ESRI_IMAGE]: '4'
            };
            const layerCode = typeToCode[legendEntry._layerRecord.config.layerType];

            // Children Info (calculate first so we have the count when doing layer settings)
            const childItems = [];
            if (layerCode === typeToCode[types.ESRI_DYNAMIC] && legendEntry.items) {

                // grab stuff on children.  we can't use walkItems because it returns a flat list.
                // we need to be aware of hierarchy here (at least on the top level).
                // loop over top-level children of the layer. these are the ones that have
                // entries defined in .layerEntries in the config.
                legendEntry.items.forEach(item => {

                    childItems.push(encodeLegendChild(item, true)); // it is a root

                    // tack on any children, which would have been auto-generated
                    // we can use walkItems here, as we dont care about sub-heirachy
                    if (item.type === 'group') {
                        item.walkItems(subItem => {
                            childItems.push(encodeLegendChild(subItem, false));
                        });
                    }
                });

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

            const opacity = encodeOpacity(legendEntry.getOpacity());
            const viz = encodeBoolean(legendEntry.getVisibility());
            const bb = encodeProperty(legendEntry, ['options', 'boundingBox', 'value']);
            const query = encodeProperty(legendEntry, ['options', 'query', 'value']);
            const snap = encodeProperty(legendEntry, ['options', 'snapshot', 'value']);

            const layerSettingAndChildren = opacity + viz + bb + snap + query +
                encodeInteger(childItems.length, 9) + childItems.join('');

            // <Layer Code><Layer Settings><Children Info><Layer Id>
            return layerCode + binaryToHex(layerSettingAndChildren) + legendEntry._layerRecord.layerId;
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
        function parseBookmark(bookmark, origConfig, opts) {
            // this methods uses a lot of sub-methods because of the following rules
            // RULE #1 single method can't have more than 40 commands
            // RULE #2 obey all rules

            const config = angular.copy(origConfig);

            const dBookmark = decodeURI(bookmark);
            const { newKeyList, newBaseMap, newLang } = opts;

            RV.logger.log('bookmarkService', 'in function *parseBookmark* the decoded URI is', dBookmark);

            const version = dBookmark.match(/^([^,]+)/)[0];
            let blankBaseMap = false;
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
                basemap = chunks[0];
                x = chunks[1];
                y = chunks[2];
                scale = chunks[3];

                // also store any layer info
                layers = info[6];

                if (version !== bookmarkVersions.A) {
                    blankBaseMap = basemap.substr(basemap.length - 1, 1) === '1';
                    basemap = basemap.substring(0, basemap.length - 1);
                }
            }

            decodeMainBookmark();

            // mark initial basemap
            config.map.initialBasemapId = newBaseMap || basemap;

            const origBasemapConfig = config.baseMaps.find(bm => bm.id === basemap);
            if (blankBaseMap && !newBaseMap) {
                // we are not doing a schema change, and the basemap on the bookmark has the blank
                // flag set. Override the initial setting to be the blank key for the correct
                // projection.
                // TODO if possible, set geoService.state.blankBaseMapId = basemap;
                config.map.initialBasemapId = blankPrefix + origBasemapConfig.wkid;
            }

            // apply extent
            const bookmarkSR = {
                wkid: origBasemapConfig.wkid
            };
            const mapSR = {
                wkid: origBasemapConfig.wkid
            };

            // determine the zoom level. use bookmark basemap unless we are doing a projection switch
            let lodId = origBasemapConfig.lodId;
            let extentId = origBasemapConfig.extentId;

            /**
             * Does special logic to handle the case where we are using a bookmark
             * to change basemap schema.
             *
             * @function processSchemaChangeBookmark
             * @private
             */
            function processSchemaChangeBookmark() {
                let newBasemapConfig;
                if (newBaseMap.indexOf(blankPrefix) === 0) {
                    // we are changing schemas, but are initializing with the blank basemap.
                    // need to find the first valid basemap in the new collection
                    // and steal it's settings for extents and lods.
                    // blank basemap codes start with the prefix and end with the WKID
                    const newWkid = parseInt(newBaseMap.substr(blankPrefix.length));
                    newBasemapConfig = config.baseMaps.find(bm => bm.wkid === newWkid);
                } else {
                    // just grab the config for the given basemap id
                    newBasemapConfig = config.baseMaps.find(bm => bm.id === newBaseMap);
                }

                lodId = newBasemapConfig.lodId;
                extentId = newBasemapConfig.extentId;
                mapSR.wkid = newBasemapConfig.wkid;
            }

            if (newBaseMap) {
                processSchemaChangeBookmark();
            }

            /**
             * Derives an initial extent using information from the bookmark
             * and the config file
             *
             * @function deriveBookmarkExtent
             * @private
             * @returns {Object}            An extent where the map should initialize
             */
            function deriveBookmarkExtent() {
                // find the LOD set for the basemap in the config file,
                // then find the LOD closest to the scale provided by the bookmark.
                const configLodSet = config.map.lods.find(lodset => lodset.id === lodId);
                const zoomLod = gapiService.gapi.Map.findClosestLOD(configLodSet.lods, scale);

                // Note: we used to use a centerAndZoom() call to position the map to the basemap co-ords.
                //       it was causing a race condition during a projection change, so we now calculate
                //       the new initial extent and set it prior to map creation.

                // project bookmark point to the map's spatial reference
                const coords = gapiService.gapi.proj.localProjectPoint(bookmarkSR, mapSR, { x: x, y: y });
                const zoomPoint = gapiService.gapi.proj.Point(coords.x, coords.y, mapSR);

                // using resolution of our target level of detail, and the size of the map in pixels,
                // calculate a rough extent of where our map should initialize.
                const domNode = $rootElement.find('rv-shell')[0];
                const xOffset = domNode.offsetWidth * zoomLod.resolution / 2;
                const yOffset = domNode.offsetHeight * zoomLod.resolution / 2;
                return {
                    xmin: zoomPoint.x - xOffset,
                    xmax: zoomPoint.x + xOffset,
                    ymin: zoomPoint.y - yOffset,
                    ymax: zoomPoint.y + yOffset,
                    spatialReference: zoomPoint.spatialReference
                };
            }

            const zoomExtent = deriveBookmarkExtent();

            // update the config file default extent.  if we don't have a full extent defined,
            // copy the original default to the full.  otherwise our zoom-to-canada button
            // will start zooming to our new initial extent.
            const configExtSet = config.map.extentSets.find(extset => extset.id === extentId);
            if (!configExtSet.full) {
                configExtSet.full = configExtSet.default;
            }
            configExtSet.default = zoomExtent;

            let bookmarkLayers = {};

            // Make sure there are layers before trying to loop through them
            if (layers) {
                const layerData = layers.split(',');

                // create partial layer configs from layer bookmarks
                bookmarkLayers = parseLayers(layerData, version);

                // modify main config using layer configs
                filterConfigLayers(bookmarkLayers, config);
            }

            if (newKeyList) {
                modifyRcsKeyList(bookmarkLayers, newKeyList);
            }

            if (newLang) {
                (() => {
                    const translatedLayers = {};
                    Object.entries(bookmarkLayers).forEach(([id, layer]) => {
                        if (id.startsWith('rcs.')) {
                            const key = extractRcsKey(id);
                            layer.id = `rcs.${key}.${newLang.substring(0, 2)}`;
                        }
                        translatedLayers[layer.id] = layer;
                    });
                    bookmarkLayers = translatedLayers;
                })();
            }

            // set the new current config, RCS layers will be loaded on first getCurrent() call
            // FIXME oldConfig.setCurrent(addRcsConfigs(bookmarkLayers, config));
        }

        /**
         * Injects a list of options into a target object. Follows the config-file format
         * of defining options.
         *
         * @function optionInjector
         * @private
         * @param {Object} target      Object to have options injected into. Param is modified.
         * @param {Array} propList     List of property names (strings) to add as options
         * @param {Object} settings    Object containing the option values. Property names must match option names
         */
        function optionInjector(target, propList, settings) {
            propList.forEach(prop => {
                target[prop] = { value: settings[prop] };
            });
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
         * Generates a layer config snippet with options initialized
         * based on the layer type and contents of the bookmark settings
         *
         * @function makeLayerConfig
         * @private
         * @param {String} layerCode      Code specifying the type of the layer
         * @param {Object} layerSettings  Decoded layer settings in an object
         * @returns {Object}              Config snippet for layer, with options defined
         */
        function makeLayerConfig(layerCode, layerSettings) {

            const codeToProps = {
                0: ['opacity', 'visibility', 'boundingBox', 'snapshot', 'query'], // feature
                1: ['opacity', 'visibility', 'boundingBox', 'query'], // wms
                2: ['opacity', 'visibility', 'boundingBox'], // tile
                3: ['opacity', 'visibility', 'boundingBox', 'query'], // dynamic
                4: ['opacity', 'visibility', 'boundingBox'] // image
            };

            const layerProps = codeToProps[layerCode];
            const result = { options: {} };
            optionInjector(result.options, layerProps, layerSettings);

            return result;
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
            const layerObjs = {};

            // due to the large divergance between version A and B,
            // and plans to secretly drop support for version A at some point,
            // will just have two separate code blocks.
            // fancier integration / code sharing can be considered after the
            // state snapshot refactor, which will likely change the whole situation.

            if (version === bookmarkVersions.A) {
                const layerPatterns = [
                    /^(.+?)(\d{7})$/, // feature
                    /^(.+?)(\d{6})$/, // wms
                    /^(.+?)(\d{5})$/, // tile
                    /^(.+?)(\d{6})$/, // dynamic
                    /^(.+?)(\d{5})$/ // image
                ];

                // Loop through bookmark layers and create config snippets
                layerDataStrings.forEach(layer => {
                    layer = decode64(layer);
                    const layerType = parseInt(layer.substring(0, 2));
                    const [, layerId, layerData] = layer.substring(2).match(layerPatterns[layerType]);

                    layerObjs[layerId] = LayerRecordFactory.parseLayerData(layerData, layerType);
                });

            } else {
                // assume version B, get fancier after refactors

                layerDataStrings.forEach(layer => {
                    layer = decode64(layer);

                    // take first 6 characters, which are layer code (1) & layer settings (5)
                    // /^(.)(.{5})/
                    const [, layerCode, layerSettingsHex] = layer.match(/^(.)(.{5})/);

                    // decode layer settings
                    const layerSettings = extractLayerSettings(layerSettingsHex);

                    // get layer id from remaining data
                    const layerId = layer.substring(6 + (layerSettings.childCount * 6));

                    const snippet = makeLayerConfig(layerCode, layerSettings);

                    if (layerSettings.childCount > 0) {
                        // TODO currently we only have dynamic layers allowed to have childs
                        //      so this code adds dynamic-specific properties to the config snippet.
                        //      If we ever support WMS children, it may have different properties
                        //      and this part of the code will need to be adjusted.

                        snippet.layerEntries = [];
                        snippet.childOptions = [];

                        // get entire swath of child data
                        const childrenInfo = layer.substr(6, layerSettings.childCount * 6);

                        // split into individual childs (6 chars) and process
                        const childItems = childrenInfo.match(/.{6}/g);
                        childItems.forEach(child => {
                            // decode from hex into settings
                            const childSettings = extractChildSettings(child);

                            // build a config snippet for the child
                            const childSnippet = {
                                index: childSettings.index
                            };
                            optionInjector(childSnippet, ['opacity', 'visibility', 'query'], childSettings);

                            // add child snippet to appropriate array in layer snippet
                            if (childSettings.root) {
                                snippet.layerEntries.push(childSnippet);
                            } else {
                                snippet.childOptions.push(childSnippet);
                            }
                        });
                    }

                    layerObjs[layerId] = snippet;
                });

            }

            return layerObjs;
        }

        /**
         * Updates layers in the config, merging the layerObj if they are in the bookmark & deleting the ones not present. *Modifies both params*
         *
         * @function filterConfigLayers
         * @param {Object} layerObjs    Object containing partial layer configs
         * @param {Object} config       The config object to modify
         */
        function filterConfigLayers(layerObjs, config) {
            let configLayers = config.layers;

            // Loop through config layers and apply bookmark info
            configLayers.slice().forEach(layer => {
                const id = layer.id;
                const bookmarkLayer = layerObjs[id];
                if (bookmarkLayer) {
                    // apply bookmark layer info to config
                    angular.merge(config.layers[config.layers.indexOf(layer)], bookmarkLayer);

                    delete layerObjs[id];
                } else {
                    // layer was removed in bookmarked state, remove it from config object
                    delete config.layers[config.layers.indexOf(layer)];
                }
            });
        }

        /**
         * Updates layers in 'layerObjs' so that it matches 'keys'. *Modifies both params*
         *
         * @function modifyRcsKeyList
         * @param {Object} layerObjs    Object containing partial layer configs
         * @param {Array} keys          List containing all wanted rcs keys
         */
        function modifyRcsKeyList(layerObjs, keys) {
            // Loop through keys in layerObjs
            Object.keys(layerObjs).forEach(id => {
                // strip rcs. and .en/.fr from the layer id
                const plainID = extractRcsKey(id);
                if (keys.indexOf(plainID) > -1) {
                    // id is in both layerObjs and keys, safe to remove from keyList
                    delete keys[keys.indexOf(plainID)];
                } else {
                    // id isn't in keys, remove from layerObjs (assumed to be removed from cart)
                    delete layerObjs[id];
                }
            });

            // for each of the remaining keys in the new list
            // add them to layerObjs to be loaded
            keys.forEach(id => {
                layerObjs[id] = {};
            });
        }

        /**
         * Adds RCS layers to a config, used to modify a bookmark config before first use
         *
         * @function addRcsConfigs
         * @private
         * @param {Object} rcsBookmarks     Config snippets for rcs layers created from a bookmark
         * @param {Object} config           The config to add the final rcs layers to
         * @returns {Promise}               A promise that resolves with the modified config
         */
        function addRcsConfigs(rcsBookmarks, config) {
            if (Object.keys(rcsBookmarks).length > 0) {
                // create a lookup object against rcs key. the layer ids will be language specific.
                // until we update the bookmark format to encode langauge, we cannot be guaranteed
                // the page is loading in the same language the bookmark was created in.
                const noLangRcsBM = {};
                Object.keys(rcsBookmarks).forEach(id => {
                    noLangRcsBM[extractRcsKey(id)] = rcsBookmarks[id];
                });

                // download rcs fragments, then merge in any bookmark information
                return configService
                    .rcsAddKeys(Object.keys(noLangRcsBM), false)
                    .then(rcsConfigs => {
                        const configSnippets = rcsConfigs.map(cfg => {
                            const rcsBM = noLangRcsBM[extractRcsKey(cfg.id)];
                            const merge = angular.merge(cfg, rcsBM, { origin: 'rcs' });

                            // check if it is a dynamic service and layers entries are different.
                            // if so, replace layerEntries by bookmark snippet because user made modification like remove a layer
                            // https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1611
                            // for nested group, even if we remove a child from a subgroup, when it reloads the child we be there again
                            // there is no childOptions value on cfg (rcsConfigs) so they are alwas merge by rcsBookmarks
                            // TODO: refactor to solve this
                            if (merge.layerType === Geo.Layer.Types.ESRI_DYNAMIC &&
                               !angular.equals(cfg.layerEntries, rcsBM.layerEntries) &&
                               rcsBM.layerEntries && rcsBM.layerEntries.length > 0) {
                                merge.layerEntries = rcsBM.layerEntries;
                            }

                            return merge;
                        });

                        config.layers = config.layers.concat(configSnippets);

                        return config;
                    })
                    .catch(() => config);
            }

            return $q.resolve(config);
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
            return btoa(string).replace(/=/g, '').replace(/\//g, '_').replace(/\+/g, '-');
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
})();
