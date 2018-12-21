'use strict';

const attribRecord = require('./attribRecord.js')();
const shared = require('./shared.js')();
const placeholderFC = require('./placeholderFC.js')();
const layerInterface = require('./layerInterface.js')();
const dynamicFC = require('./dynamicFC.js')();
const attribFC = require('./attribFC.js')();

/**
 * @class DynamicRecord
 */
class DynamicRecord extends attribRecord.AttribRecord {
    // TODO are we still using passthrough stuff?
    get _layerPassthroughBindings() {
        return ['setOpacity', 'setVisibility', 'setVisibleLayers', 'setLayerDrawingOptions'];
    }
    get _layerPassthroughProperties() {
        return ['visibleAtMapScale', 'visible', 'spatialReference', 'layerInfos', 'supportsDynamicLayers'];
    }

    get layerType() { return shared.clientLayerType.ESRI_DYNAMIC; }
    get isTrueDynamic() { return this._isTrueDynamic; }

    /**
     * Create a layer record with the appropriate geoApi layer type.
     * Regarding configuration -- in the standard case, the incoming config object
     * will be incomplete with regards to child state. It may not even have entries for all possible
     * child sub-layers.  Given our config defaulting for children happens AFTER the layer loads,
     * it means what is passed in at the constructor is generally unreliable except for any child names,
     * and the class will treat that information as unreliable (the UI will set values after config defaulting
     * happens). In the rare case where the config is fully formed and we want to take advantage of that,
     * set the configIsComplete param to true.  Be aware that if the config is not actually complete you may
     * get a layer in an undesired initial state.
     *
     * @param {Object} layerClass         the ESRI api object for dynamic layers
     * @param {Object} esriRequest        the ESRI api object for making web requests with proxy support
     * @param {Object} apiRef             object pointing to the geoApi. allows us to call other geoApi functions
     * @param {Object} config             layer config values
     * @param {Object} esriLayer          an optional pre-constructed layer
     * @param {Function} epsgLookup       an optional lookup function for EPSG codes (see geoService for signature)
     * @param {Boolean} configIsComplete  an optional flag to indicate if the config is fully flushed out (i.e. things defined for all children). Defaults to false.
     */
    constructor(layerClass, esriRequest, apiRef, config, esriLayer, epsgLookup, configIsComplete = false) {
        // TODO might need some nonsense here. if not configIsComplete, and layer is set to visible in config,
        //      we may need to hack the process so that the esri layer object is initialized as invisible,
        //      but the config is still marked as visible so the UI knows to do the proper defaulting.
        //      As is right now, the layer might start to pull an image from the server while our onLoad
        //      event handler is running and shutting off visibilities.
        super(layerClass, esriRequest, apiRef, config, esriLayer, epsgLookup);
        this.ArcGISDynamicMapServiceLayer = layerClass;
        this._configIsComplete = configIsComplete;

        // TODO what is the case where we have dynamic layer already prepared
        //      and passed in? Generally this only applies to file layers (which
        //      are feature layers).

        this._proxies = {};

        // marks if layer supports dynamic capabilities, like child opacity, renderer change, layer reorder
        // TODO ensure false is best default (what is better for UI)
        this._isTrueDynamic = false;

        // manages delayed visibility changes to avoid cascading refreshes
        this._visDelay = {
            lastIdx: -1,
            parentToggle: false,
            parentValue: false
        };

        // trickery. no code here ever uses this, because a dynamic record has no concept of a default feature class
        // (whereas the other Records do). However, since we use the value as a unique key for tracking bounding
        // boxes, and a dynamic record can have a bounding box at the root level, we need to return a value.
        this._defaultFC = 'X';

    }

    /**
     * Creates an options object for the map API object
     *
     * @function makeLayerConfig
     * @returns {Object} an object with api options
     */
    makeLayerConfig() {
        const cfg = super.makeLayerConfig();
        cfg.imageParameters = new this._apiRef.layer.ImageParameters();
        cfg.imageParameters.format = this.config.imageFormat || 'png32';

        return cfg;
    }

    /**
     * Return a proxy interface for a child layer
     *
     * @param {Integer} featureIdx    index of child entry (leaf or group)
     * @return {Object}               proxy interface for given child
     */
    getChildProxy(featureIdx) {
        // TODO verify we have integer coming in and not a string
        // NOTE we no longer have group proxies. Since it is possible for a proxy to
        //      be requested prior to a dynamic layer being loaded (and thus have no
        //      idea of the index is valid or the index is a group), we always give
        //      a proxy and depend on the caller to be smart about it.

        const strIdx = featureIdx.toString();
        if (this._proxies[strIdx]) {
            return this._proxies[strIdx];
        } else {
            // throw new Error(`attempt to get non-existing child proxy. Index ${featureIdx}`);

            // to handle the case of a structured legend needing a proxy for a child prior to the
            // layer loading, we treat an unknown proxy request as that case and return
            // a proxy loaded with a placeholder.
            // TODO how to pass in a name? add an optional second parameter? expose a "set name" on the proxy?
            const pfc = new placeholderFC.PlaceholderFC(this, '');
            const tProxy = new layerInterface.LayerInterface(pfc);
            tProxy.convertToPlaceholder(pfc);
            this._proxies[strIdx] = tProxy;
            return tProxy;

        }
    }

    /**
     * Get feature count of a child layer.
     *
     * @function getFeatureCount
     * @param {String} featureIdx     index of the child
     * @return {Promise}              resolves with an integer indicating the feature count.
     */
    getFeatureCount(featureIdx) {
        // point url to sub-index we want
        // TODO might change how we manage index and url
        return super.getFeatureCount(this._layer.url + '/' + featureIdx);
    }

    /**
     * Will set the layer opacity, and update all child FCs to the same opacity.
     * Used for Dynamic layers that do not support child opacity.
     *
     * @function synchOpacity
     * @param {Numeric} opacity     an opacity value (decimal between 0 and 1)
     */
    synchOpacity(opacity) {
        // in the case where a dynamic layer does not support child opacity, if a user
        // changes the opacity of a child, it actually just adjusts the opacity of the layer.
        // this means that all other children of the layer need to have their opacity set
        // to the same value. but we dont want to trigger a number of opacity change requests,
        // so we do some trickery here.

        Object.keys(this._featClasses).forEach(idx => {
            const fc = this._featClasses[idx];
            if (fc) {
                // important: must use the private ._opacity property here,
                // as we want to avoid the logic on the .opacity setter.
                fc._opacity = opacity;
            }
        });

        // update the layer itself.
        this.opacity = opacity;
    }

    /**
     * Triggers when the layer loads.
     *
     * @function onLoad
     */
    onLoad() {
        const loadPromises = super.onLoad();
        this._isTrueDynamic = this._layer.supportsDynamicLayers;

        // don't worry about structured legend. the legend part is separate from
        // the layers part. we just load what we are told to. the legend module
        // will handle the structured part.

        // see comments on the constructor to learn about _configIsComplete and
        // what type of scenarios you can expect for incoming configs

        // snapshot doesn't apply to child layers
        // we don't include bounding box / extent, as we are inheriting it.
        // a lack of the property means we use the layer definition
        const dummyState = {
            opacity: 1,
            visibility: false,
            query: false
        };

        // subfunction to clone a layerEntries config object.
        // since we are using typed objects with getters and setters,
        // our usual easy ways of cloning an object don't work (e.g. using
        // JSON.parse(JSON.stringify(x))). This is not a great solution (understatement),
        //  but is being done as a quick n dirty workaround. At a later time,
        // the guts of this function can be re-examined for a better,
        // less hardcoded solution.
        const cloneConfig = origConfig => {
            const clone = {};

            // direct copies, no defaulting
            clone.name = origConfig.name;
            clone.index = origConfig.index;
            clone.stateOnly = origConfig.stateOnly;
            clone.nameField = origConfig.nameField;
            clone.highlightFeature = origConfig.highlightFeature || true; // simple default

            // an empty string is a valid property, so be wary of falsy logic
            clone.outfields = origConfig.hasOwnProperty('outfields') ? origConfig.outfields : '*';

            // with state, we are either complete, or pure defaults.
            // in the non-complete case, we treat our state as unreliable and
            // expect the client to assign properties as it does parent-child inheritance
            // defaulting (which occurs after this onLoad function has completed)
            if (this._configIsComplete) {
                clone.state = {
                    visiblity: origConfig.visiblity,
                    opacity: origConfig.opacity,
                    query: origConfig.query
                };
            } else {
                clone.state = Object.assign({}, dummyState);
            }

            // if extent is present, we assume it is fully defined.
            // extents are not using fancy typed objects, so can directly reference
            clone.extent = origConfig.extent;

            return clone;
        };

        // collate any relevant overrides from the config.
        const subConfigs = {};

        this.config.layerEntries.forEach(le => {
            subConfigs[le.index.toString()] = {
                config: cloneConfig(le),
                defaulted: this._configIsComplete
            };
        });

        // subfunction to return a subconfig object.
        // if it does not exist or is not defaulted, will do that first
        // id param is an integer in string format
        const fetchSubConfig = (id, serverName = '') => {

            if (subConfigs[id]) {
                const subC = subConfigs[id];
                if (!subC.defaulted) {
                    // config is incomplete, fill in blanks
                    // we will never hit this code block a complete config was passed in

                    // apply a server name if no name exists
                    if (!subC.config.name) {
                        subC.config.name = serverName;
                    }

                    // mark as defaulted so we don't do this again
                    subC.defaulted = true;
                }
                return subC.config;
            } else {
                // no config at all. we apply defaults, and a name from the server if available
                const configSeed = {
                    name: serverName,
                    index: parseInt(id),
                    stateOnly: true
                };
                const newConfig = cloneConfig(configSeed);
                subConfigs[id] = {
                    config: newConfig,
                    defaulted: true
                };
                return newConfig;
            }
        };

        // shortcut var to track all leafs that need attention
        // in the loading process
        const leafsToInit = [];

        // this subfunction will recursively crawl a dynamic layerInfo structure.
        // it will generate proxy objects for all groups and leafs under the
        // input layerInfo.
        // we also generate a tree structure of layerInfos that is in a format
        // that makes the client happy
        const processLayerInfo = (layerInfo, treeArray) => {
            const sId = layerInfo.id.toString();
            const subC = fetchSubConfig(sId, layerInfo.name);

            if (layerInfo.subLayerIds && layerInfo.subLayerIds.length > 0) {
                // group sublayer. set up our tree for the client, then crawl childs.

                const treeGroup = {
                    entryIndex: layerInfo.id,
                    name: subC.name,
                    childs: []
                };
                treeArray.push(treeGroup);

                // process the kids in the group.
                // store the child leaves in the internal variable
                layerInfo.subLayerIds.forEach(slid => {
                    processLayerInfo(this._layer.layerInfos.find(li => li.id === slid), treeGroup.childs);
                });

            } else {
                // leaf sublayer. make placeholders, add leaf to the tree

                const pfc = new placeholderFC.PlaceholderFC(this, subC.name);
                if (this._proxies[sId]) {
                    // we have a pre-made proxy (structured legend). update it.
                    this._proxies[sId].updateSource(pfc);
                } else {
                    // set up new proxy
                    const leafProxy = new layerInterface.LayerInterface(null);
                    leafProxy.convertToPlaceholder(pfc);
                    this._proxies[sId] = leafProxy;
                }

                treeArray.push({ entryIndex: layerInfo.id });
                leafsToInit.push(layerInfo.id.toString());
            }
        };

        this._childTree = []; // public structure describing the tree

        // process the child layers our config is interested in, and all their children.
        if (this.config.layerEntries) {
            this.config.layerEntries.forEach(le => {
                if (!le.stateOnly) {
                    processLayerInfo(this._layer.layerInfos.find(li => li.id === le.index), this._childTree);
                }
            });
        }

        // converts server layer type string to client layer type string
        const serverLayerTypeToClientLayerType = serverType => {
            switch (serverType) {
                case 'Feature Layer':
                    return shared.clientLayerType.ESRI_FEATURE;
                case 'Raster Layer':
                    return shared.clientLayerType.ESRI_RASTER;
                default:
                    console.warn('Unexpected layer type in serverLayerTypeToClientLayerType', serverType);
                    return shared.clientLayerType.UNKNOWN;
            }
        };

        // process each leaf we walked to in the processLayerInfo loop above
        // idx is a string
        leafsToInit.forEach(idx => {

            const subC = subConfigs[idx].config;
            const attribPackage = this._apiRef.attribs.loadServerAttribs(this._layer.url, idx, subC.outfields);
            const dFC = new dynamicFC.DynamicFC(this, idx, attribPackage, subC);
            dFC.highlightFeature = subC.highlightFeature;
            this._featClasses[idx] = dFC;

            // if we have a proxy watching this leaf, replace its placeholder with the real data
            const leafProxy = this._proxies[idx];
            if (leafProxy) {
                leafProxy.convertToDynamicLeaf(dFC);
            }

            // load real symbols into our source
            loadPromises.push(dFC.loadSymbology());

            // update asynchronous values
            const pLD = dFC.getLayerData()
                .then(ld => {
                    dFC.layerType = serverLayerTypeToClientLayerType(ld.layerType);

                    // if we didn't have an extent defined on the config, use the layer extent
                    if (!dFC.extent) {
                        dFC.extent = ld.extent;
                    }
                    dFC.extent = shared.makeSafeExtent(dFC.extent);

                    dFC._scaleSet.minScale = ld.minScale;
                    dFC._scaleSet.maxScale = ld.maxScale;

                    dFC.nameField = subC.nameField || ld.nameField || '';

                    // skip a number of things if it is a raster layer
                    // either way, return a promise so our loadPromises have a good
                    // value to wait on.
                    if (dFC.layerType === shared.clientLayerType.ESRI_FEATURE) {
                        dFC.geomType = ld.geometryType;
                        dFC.oidField = ld.oidField;

                        return this.getFeatureCount(idx).then(fc => {
                            dFC.featureCount = fc;
                        });
                    } else {
                        return Promise.resolve();
                    }
                })
                .catch(() => {
                    dFC.layerType = shared.clientLayerType.UNRESOLVED;
                });
            loadPromises.push(pLD);

        });

        // TODO careful now, as the dynamicFC.DynamicFC constructor also appears to be setting visibility on the parent.
        if (this._configIsComplete) {
            // if we have a complete config, want to set layer visibility
            // get an array of leaf ids that are visible.
            // use _featClasses as it contains keys that exist on the server and are
            // potentially visible in the client.
            const initVis = Object.keys(this._featClasses)
                .filter(fcId => { return fetchSubConfig(fcId).config.state.visibility; })
                .map(fcId => { return parseInt(fcId); });

            if (initVis.length === 0) {
                initVis.push(-1); // esri code for set all to invisible
            }
            this._layer.setVisibleLayers(initVis);
        } else {
            // default configuration for non-complete config.
            this._layer.setVisibility(false);
            this._layer.setVisibleLayers([-1]);
        }

        // get mapName of the legend entry from the service to use as the name if not provided in config
        if (!this.name) {
            const defService = this._esriRequest({
                url: this._layer.url + '?f=json',
                callbackParamName: 'callback',
                handleAs: 'json',
            });
            const setTitle = defService.then(serviceResult => {
                this.name = serviceResult.mapName;
            });
            loadPromises.push(setTitle);
        }

        Promise.all(loadPromises).then(() => {
            this._stateChange(shared.states.LOADED);
        });
    }

    /**
     * Zoom to a valid scale level for a child layer.
     *
     * @function zoomToScale
     * @param {String}  childIndex           index of the child layer to target
     * @param {Object} map                   the map object
     * @param {Array} lods                   level of details array for basemap
     * @param {Boolean} zoomIn               the zoom to scale direction; true need to zoom in; false need to zoom out
     * @param {Boolean} positionOverLayer    ensures the map is over the layer's extent after zooming. only applied if zoomIn is true. defaults to true
     * @returns {Promise}                    promise that resolves after map finishes moving about
     */
    zoomToScale(childIdx, map, lods, zoomIn, positionOverLayer = true) {
        // get scale set from child, then execute zoom
        const scaleSet = this._featClasses[childIdx].getScaleSet();
        return this._zoomToScaleSet(map, lods, zoomIn, scaleSet, positionOverLayer);
    }

    /**
     * Indicates if the feature class is not visible at the given scale,
     * and if so, if we need to zoom in to see it or zoom out
     *
     * @function isOffScale
     * @param {String}  childIndex    index of the child layer to target
     * @param {Integer}  mapScale the scale to test against
     * @returns {Object} has boolean properties `offScale` and `zoomIn`
     */
    isOffScale(childIdx, mapScale) {
        return this._featClasses[childIdx].isOffScale(mapScale);
    }

    /**
     * Indicates the layer is queryable.
     *
     * @function isQueryable
     * @param {String}  childIndex    index of the child layer to target
     * @returns {Boolean} the queryability of the layer
     */
    isQueryable(childIdx) {
        return this._featClasses[childIdx].queryable;
    }

    /**
     * Does nothing, but we provide it to supress errors from overzealous bindings.
     *
     * @function setQueryable
     * @param {Boolean} value the pointless new queryability setting
     */
    setQueryable(value) {
        return null;
    }

    // TODO if we need this back, may need to implement as getChildGeomType.
    //      appears this ovverrides the LayerRecord.getGeomType function, which returns
    //      undefined, and that is what we want on the DynamicRecord level (as dynamic layer)
    //      has no geometry.
    //      Currently, all child requests for geometry go through the proxy,
    //      so could be this child-targeting version is irrelevant.
    /*
    getGeomType (childIdx) {
        return this._featClasses[childIdx].geomType;
    }
    */

    /**
     * Get a structured representation of the heirarchy of child layers in this Record.
     * We omit parts of the tree that were not specified to load / be used in the config.
     *
     * @function getChildTree
     * @return {Object} structured representation of child layers
     */
    getChildTree() {
        // TODO document somehow the format of the return object
        if (this._childTree) {
            return this._childTree;
        } else {
            throw new Error('Called getChildTree before layer is loaded');
        }
    }

    /**
     * Get the best user-friendly name of a field. Uses alias if alias is defined, else uses the system attribute name.
     *
     * @function aliasedFieldName
     * @param {String} attribName     the attribute name we want a nice name for
     * @param {String}  childIndex    index of the child layer whos attributes we are looking at
     * @return {Promise}              resolves to the best available user friendly attribute name
     */
    aliasedFieldName(attribName, childIndex) {
        return this._featClasses[childIndex].aliasedFieldName(attribName);
    }

    /**
     * Retrieves attributes from a layer for a specified feature index
     *
     * @function getFormattedAttributes
     * @param {String}  childIndex  index of the child layer to get attributes for
     * @return {Promise}            promise resolving with formatted attributes to be consumed by the datagrid and esri feature identify
     */
    getFormattedAttributes(childIndex) {
        return this._featClasses[childIndex].getFormattedAttributes();
    }

    /**
     * Fetches a graphic from the given child layer.
     * Will attempt local copy (unless overridden), will hit the server if not available.
     *
     * @function fetchGraphic
     * @param {String}  childIndex     index of the child layer to target
     * @param {Integer} objId          ID of object being searched for
     * @param {Object} opts            object containing option parametrs
     *                 - map           map wrapper object of current map. only required if requesting geometry
     *                 - geom          boolean. indicates if return value should have geometry included. default to false
     *                 - attribs       boolean. indicates if return value should have attributes included. default to false
     * @returns {Promise} resolves with a bundle of information. .graphic is the graphic; .layerFC for convenience
     */
    fetchGraphic(childIndex, objId, opts) {
        return this._featClasses[childIndex].fetchGraphic(objId, opts);
    }

    /**
     * Will attempt to zoom the map view so the a graphic is prominent.
     *
     * @function zoomToGraphic
     * @param {String}  childIndex      index of the child layer to target
     * @param {Integer} objId           Object ID of grahpic being searched for
     * @param {Object} map              wrapper object for the map we want to zoom
     * @param {Object} offsetFraction   an object with decimal properties `x` and `y` indicating percentage of offsetting on each axis
     * @return {Promise}                resolves after the map is done moving
     */
    zoomToGraphic(childIndex, objId, map, offsetFraction) {
        return this._featClasses[childIndex].zoomToGraphic(objId, map, offsetFraction);
    }

    /**
     * Applies the current filter settings to the physical map layer.
     *
     * @function applyFilterToLayer
     * @param {String}  childIndex      index of the child layer to target
     */
    applyFilterToLayer (childIndex) {
        this._featClasses[childIndex].applyFilterToLayer();
    }

    /**
     * Check to see if the attribute in question is an esriFieldTypeDate type.
     *
     * @function checkDateType
     * @param {String} attribName     the attribute name we want to check if it's a date or not
     * @param {String}  childIndex    index of the child layer whos attributes we are looking at
     * @return {Promise}              resolves to true or false based on the attribName type being esriFieldTypeDate
     */
    checkDateType(attribName, childIndex) {
        return this._featClasses[childIndex].checkDateType(attribName);
    }

    /**
     * Returns attribute data for a child layer.
     *
     * @function getAttribs
     * @param {String} childIndex  the index of the child layer
     * @returns {Promise}          resolves with a layer attribute data object
     */
    getAttribs(childIndex) {
        return this._featClasses[childIndex].getAttribs();
    }

    /**
     * Returns layer-specific data for a child layer
     *
     * @function getLayerData
     * @param {String} childIndex  the index of the child layer
     * @returns {Promise}          resolves with a layer data object
     */
    getLayerData(childIndex) {
        return this._featClasses[childIndex].getLayerData();
    }

    /**
     * Extract the feature name from a feature as best we can.
     *
     * @function getFeatureName
     * @param {String} childIndex  the index of the child layer
     * @param {String} objId      the object id of the attribute
     * @param {Object} attribs    the dictionary of attributes for the feature.
     * @returns {String}          the name of the feature
     */
    getFeatureName(childIndex, objId, attribs) {
        return this._featClasses[childIndex].getFeatureName(objId, attribs);
    }

    /**
     * Return symbology for a child layer.
     *
     * @function getSymbology
     * @param {String} childIndex  the index of the child layer
     * @returns {Object}           the symbology object
     */
    getSymbology(childIndex) {
        return this._featClasses[childIndex].symbology;
    }

    /**
     * Run a query on a dynamic layer, return the result as a promise.
     * Options:
     * - map {Object}             map object. A geoApi wrapper, such as esriMap, not an actual esri api map
     * - geometry {Object}        geometry (in map coordinates) to identify against
     * - mapExtent {Object}       extent object of the current map view
     * - height {Integer}         height of the map view in pixels
     * - width {Integer}          width of the map view in pixels
     * - tolerance {Integer}      an optional click tolerance for the identify. Defaults to 5
     * - returnGeometry {Boolean} if result geometery should be returned with results.  Defaults to false
     *
     * @function identify
     * @param {Object} opts additional arguemets, see above.
     * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
     */
    identify(opts) {
        // bundles results from all leaf layers
        const identifyResults = [];

        if (!shared.layerLoaded(this.state)) {
            opts.layerIds = []; // quick quit
        } else {
            opts.layerIds = this._layer.visibleLayers
                .filter(leafIndex => {
                    if (leafIndex === -1) {
                        // this is marker for nothing is visible. get rid of it
                        return false;
                    } else {
                        const fc = this._featClasses[leafIndex];
                        if (fc) {
                            // keep if it is queryable and on-scale
                            return fc.queryable && !fc.isOffScale(opts.map.getScale()).offScale;
                        } else {
                            // we dont have a feature class for this id.
                            //  it is likely a a group or something visible but not active
                            return false;
                        }
                    }
                });
        }

        // if there are no layerIds to inspect, don't hit the server
        if (opts.layerIds.length === 0) {
            // TODO verifiy this is correct result format if layer should be excluded from the identify process
            return { identifyResults: [], identifyPromise: Promise.resolve() };
        }

        // if there are filter queries on the layer, apply them in the identify task
        opts.layerDefinitions = [];

        opts.layerIds.forEach(leafIndex => {
            let childProxy = this.getChildProxy(leafIndex);
            opts.layerDefinitions[leafIndex] = childProxy.filter.getSqlPlusGrid();
            const identifyResult = new shared.IdentifyResult(childProxy);
            identifyResults[leafIndex] = identifyResult;
        });

        // TODO verify if 0 is valid click tolerance. if so, need to address falsy logic.
        opts.tolerance = opts.tolerance || this.clickTolerance || 5;

        const identifyPromise = this._apiRef.layer.serverLayerIdentify(this._layer, opts)
            .then(clickResults => {
                const hitIndexes = []; // sublayers that we got results for

                // transform attributes of click results into {name,data} objects
                // one object per identified feature
                //
                // each feature will have its attributes converted into a table
                // placeholder for now until we figure out how to signal the panel that
                // we want to make a nice table
                clickResults.forEach(ele => {
                    // NOTE: the identify service returns aliased field names, so no need to look them up here.
                    //       however, this means we need to un-alias the data when doing field lookups.
                    // NOTE: ele.layerId is what we would call featureIdx
                    hitIndexes.push(ele.layerId);

                    // get metadata about this sublayer
                    this.getLayerData(ele.layerId).then(lData => {
                        const identifyResult = identifyResults[ele.layerId];

                        if (lData.supportsFeatures) {
                            const unAliasAtt = attribFC.AttribFC.unAliasAttribs(ele.feature.attributes, lData.fields);
                            const objId = unAliasAtt[lData.oidField];
                            const objIdStr = objId.toString();

                            // TODO: traditionally, we did not pass fields into attributesToDetails as data was
                            //      already aliased from the server. now, since we are extracting field type as
                            //      well, this means things like date formatting might not be applied to
                            //      identify results. examine the impact of providing the fields parameter
                            //      to data that is already aliased.
                            let svg = this._apiRef.symbology.getGraphicIcon(unAliasAtt, lData.renderer);

                            identifyResult.data.push({
                                name: this.getFeatureName(ele.layerId, objIdStr, unAliasAtt),
                                data: this.attributesToDetails(ele.feature.attributes, lData.fields),
                                oid: unAliasAtt[lData.oidField],
                                symbology: [{
                                    svgcode: svg
                                }]
                            });

                        }
                        identifyResult.isLoading = false;
                    });
                });

                // set the rest of the entries to loading false
                identifyResults.forEach(identifyResult => {
                    if (hitIndexes.indexOf(identifyResult.requester.featureIdx) === -1) {
                        identifyResult.isLoading = false;
                    }
                });

            });

        return {
            identifyResults: identifyResults.filter(identifyResult => identifyResult), // collapse sparse array
            identifyPromise
        };
    }

    /**
     * Retrieves a child layer name from the server.
     *
     * @function getChildName
     * @param {String}  childIndex  index of the child layer to get attributes for
     * @return {String}             server name of the child layer
     */
    getChildName(childIndex) {
        // TODO revisit logic. is this the best way to do this? what are the needs of the consuming code?
        // TODO restructure so WMS can use this too?
        // TODO what about config overrides of names?
        // TODO WHO IS EVEN USING THIS?
        // will not use FC classes, as we also need group names

        const intIdx = parseInt(childIndex);
        return this._layer.layerInfos.find(li => li.id === intIdx).name;
    }

    // TODO we may want version of layerRecord.zoomToBoundary that targets a child index.
    //      alternately this might go on the proxy and then we go direct from there.

}

module.exports = () => ({
    DynamicRecord
});
