'use strict';

const attribFC = require('./attribFC.js')();
const placeholderFC = require('./placeholderFC.js')();
const attribRecord = require('./attribRecord.js')();
const layerInterface = require('./layerInterface.js')();
const shared = require('./shared.js')();

/**
 * @class FeatureRecord
 */
class FeatureRecord extends attribRecord.AttribRecord {

    /**
     * Create a layer record with the appropriate geoApi layer type.  Layer config
     * should be fully merged with all layer options defined (i.e. this constructor
     * will not apply any defaults).
     * @param {Object} layerClass    the ESRI api object for feature layers
     * @param {Object} esriRequest   the ESRI api object for making web requests with proxy support
     * @param {Object} apiRef        object pointing to the geoApi. allows us to call other geoApi functions.
     * @param {Object} config        layer config values
     * @param {Object} esriLayer     an optional pre-constructed layer
     * @param {Function} epsgLookup  an optional lookup function for EPSG codes (see geoService for signature)
     */
    constructor (layerClass, esriRequest, apiRef, config, esriLayer, epsgLookup) {
        super(layerClass, esriRequest, apiRef, config, esriLayer, epsgLookup);

        // handles placeholder symbol, possibly other things
        // if we were passed a pre-loaded layer, we skip this (it will run after the load triggers
        // in the super-constructor, thus overwriting our good results)
        if (!esriLayer) {
            this._defaultFC = '0';
            this._featClasses['0'] = new placeholderFC.PlaceholderFC(this, this.name);
            this._fcount = undefined;
        }
    }

    get queryUrl () { return `${this.rootUrl}/${this._defaultFC}`; }

    /**
     * Creates an options object for the map API object
     *
     * @function makeLayerConfig
     * @returns {Object} an object with api options
     */
    makeLayerConfig () {
        const cfg = super.makeLayerConfig();
        cfg.mode = this.config.state.snapshot ? this._layerClass.MODE_SNAPSHOT
                                                        : this._layerClass.MODE_ONDEMAND;

        // if we have a definition at load, apply it here to avoid cancellation errors on 
        if (this.config.initialFilteredQuery) {
            cfg.definitionExpression = this.config.initialFilteredQuery;
        }

        // TODO confirm this logic. old code mapped .options.snapshot.value to the button -- meaning if we were in snapshot mode,
        //      we would want the button disabled. in the refactor, the button may get it's enabled/disabled from a different source.
        // this.config.state.snapshot = !this.config.state.snapshot;
        this._snapshot = this.config.state.snapshot;

        return cfg;
    }

    /**
     * Indicates the geometry type of the layer.
     *
     * @function getGeomType
     * @returns {String} the geometry type of the layer
     */
    getGeomType () {
        return this._featClasses[this._defaultFC].geomType;
    }

    /**
     * Provides the proxy interface object to the layer.
     *
     * @function getProxy
     * @returns {Object} the proxy interface for the layer
     */
    getProxy () {
        if (!this._rootProxy) {
            this._rootProxy = new layerInterface.LayerInterface(this, this.initialConfig.controls);
            this._rootProxy.convertToFeatureLayer(this);
        }
        return this._rootProxy;
    }

    /**
     * Triggers when the layer loads.
     *
     * @function onLoad
     */
    onLoad () {
        const loadPromises = super.onLoad();

        // get attribute package
        let attribPackage;
        let featIdx;
        if (this.isFileLayer()) {
            featIdx = '0';
            attribPackage = this._apiRef.attribs.loadFileAttribs(this._layer);
        } else {
            const splitUrl = shared.parseUrlIndex(this._layer.url);
            featIdx = splitUrl.index;
            this.rootUrl = splitUrl.rootUrl;
            attribPackage = this._apiRef.attribs.loadServerAttribs(splitUrl.rootUrl, featIdx, this.config.outfields);
        }

        // feature has only one layer
        const aFC = new attribFC.AttribFC(this, featIdx, attribPackage, this.config);
        this._defaultFC = featIdx;
        this._featClasses[featIdx] = aFC;

        const pLS = aFC.loadSymbology();

        // update asynch data
        const pLD = aFC.getLayerData().then(ld => {
            aFC.geomType = ld.geometryType;
            aFC.nameField = this.config.nameField || ld.nameField || '';

            // trickery. file layer can have field names that are bad keys.
            // our file loader will have corrected them, but config.nameField will have
            // been supplied from the wizard (it pre-fetches fields to present a choice
            // to the user). If the nameField was adjusted for bad characters, we need to
            // re-synchronize it here.
            if (this.isFileLayer() && ld.fields.findIndex(f => f.name === aFC.nameField) === -1) {
                const validField = ld.fields.find(f => f.alias === aFC.nameField);
                if (validField) {
                    aFC.nameField = validField.name;
                } else {
                    // give warning. impact is tooltips will have no text, details pane no header
                    console.warn(`Cannot find name field in layer field list: ${aFC.nameField}`);
                }
            }
        });

        const pFC = this.getFeatureCount().then(fc => {
            this._fcount = fc;
        });

        // if file based (or server extent was fried), calculate extent based on geometry
        if (!this.extent || !this.extent.xmin) {
            this.extent = this._apiRef.proj.graphicsUtils.graphicsExtent(this._layer.graphics);
        }

        loadPromises.push(pLD, pFC, pLS);
        Promise.all(loadPromises).then(() => {
            this._stateChange(shared.states.LOADED);
        });
    }

    /**
     * Get feature count of this layer.
     *
     * @function getFeatureCount
     * @return {Promise}       resolves with an integer indicating the feature count.
     */
    getFeatureCount () {
        // just use the layer url (or lack of in case of file layer)
        return super.getFeatureCount(this._layer.url);
    }

    /**
     * Indicates if the layer is file based.
     *
     * @function isFileLayer
     * @returns {Boolean} true if layer is file based
     */
    isFileLayer () {
        // TODO revisit.  is it robust enough?
        return this._layer && !this._layer.url;
    }

    /**
     * Attempts to abort an attribute load in progress.
     * Harmless to call before or after an attribute load.
     *
     * @function abortAttribLoad
     */
    abortAttribLoad () {
        this._featClasses[this._defaultFC].abortAttribLoad();
    }

    // TODO determine who is setting this. if we have an internal
    //      snapshot process, it might become a read-only property
    get isSnapshot () { return this._snapshot; }
    set isSnapshot (value) { this._snapshot = value; }

    get layerType () { return shared.clientLayerType.ESRI_FEATURE; }

    get featureCount () { return this._fcount; }

    get loadedFeatureCount () { return this._featClasses[this._defaultFC].loadedFeatureCount; }

    /**
     * Triggers when the mouse enters a feature of the layer.
     *
     * @function onMouseOver
     * @param {Object} standard mouse event object
     */
    onMouseOver (e) {
        /* discussion on quick-lookup.
        there are two different ways to get attributes from the server for a single feature.
        1. using the feature rest endpoint (FR)
        2. using the feature layer's query rest endpoint (FQ)
        FR returns a smaller response object (it omits a pile of layer metadata). this is good.
        FR is used in the hilight module. so we are already caching that response and have the
        code to make the FR request. this is good.
        FR always includes the geometry. which means if we hover over a feature with massive geometry and
        a small attribute set, we will download way more data than we want. this is bad.
        FQ has a larger response in general (metadata that we dont care about). this is bad.
        FQ can omit the geometry. this is good.
        FQ is not being used elsewhere, so we would have to write a new function and cache. this is bad.
        Conclusion:  for time being, we will use the FR approach. In most cases it will be faster. The
        one potential problem (massive geometry polys) would only have the impact of the maptip not showing
        promptly (or timing out).
        If we find this is a major issue, suggest re-doing fetchGraphic to use FQ for both hover and hilight,
        adding parameters to include or omit the geometry.
        */

        if (this._hoverListeners.length > 0) {

            const showBundle = {
                type: 'mouseOver',
                point: e.screenPoint,
                target: e.target
            };

            // tell anyone listening we moused into something
            this._fireEvent(this._hoverListeners, showBundle);

            // pull metadata for this layer.
            let oid;
            this.getLayerData().then(lInfo => {
                // graphic attributes will only have the OID if layer is server based
                oid = e.graphic.attributes[lInfo.oidField];

                let attribSetPromise;
                if (this._featClasses[this._defaultFC].attribsLoaded()) {
                    // we have already pulled attributes from the server. use them.
                    attribSetPromise = this.getAttribs();
                } else {
                    // we have not pulled attributes from the server.
                    // instead of downloading them all, just get the one
                    // we are interested in.
                    // we skip the client side graphic attributes if we are server based, as it will
                    // only contain the OID.  File based layers will have all the attributes client side.
                    attribSetPromise = this.fetchGraphic(oid, !this.isFileLayer()).then(graphicBundle => {
                        const fakeSet = {
                            features: [
                                graphicBundle.graphic
                            ],
                            oidIndex: {}
                        };
                        fakeSet.oidIndex[oid] = 0; // because only one feature added above
                        return fakeSet;
                    });
                }
                return Promise.all([Promise.resolve(lInfo), attribSetPromise]);
            }).then(([lInfo, aInfo]) => {

                // get name via attribs and name field
                const featAttribs = aInfo.features[aInfo.oidIndex[oid]].attributes;

                // get icon via renderer and geoApi call
                const svgcode = this._apiRef.symbology.getGraphicIcon(featAttribs, lInfo.renderer);

                // duplicate the position so listener can verify this event is same as mouseOver event above
                const loadBundle = {
                    type: 'tipLoaded',
                    name: this.getFeatureName(oid, featAttribs),
                    target: e.target,
                    svgcode
                };

                // tell anyone listening we moused into something
                this._fireEvent(this._hoverListeners, loadBundle);

            });
        }
    }

    /**
     * Triggers when the mouse leaves a feature of the layer.
     *
     * @function onMouseOut
     * @param {Object} standard mouse event object
     */
    onMouseOut (e) {
        // tell anyone listening we moused out
        const outBundle = {
            type: 'mouseOut',
            target: e.target
        };
        this._fireEvent(this._hoverListeners, outBundle);
    }

    /**
     * Run a query on a feature layer, return the result as a promise.
     * Options:
     * - clickEvent {Object} an event object from the mouse click event, where the user wants to identify.
     * - map {Object}        map object. A geoApi wrapper, such as esriMap, not an actual esri api map
     * - geometry {Object}   geometry (in map coordinates) to identify against
     * - tolerance {Integer} an optional click tolerance for the identify
     *
     * @function identify
     * @param {Object} opts    additional arguemets, see above.
     * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
     */
    identify (opts) {
        // TODO add full documentation for options parameter

        // early kickout check. not loaded/error; not visible; not queryable; off scale
        if (!shared.layerLoaded(this.state) ||
            !this.visibility ||
            !this.isQueryable() ||
            this.isOffScale(opts.map.getScale()).offScale) {

            // TODO verifiy this is correct result format if layer should be excluded from the identify process
            return { identifyResults: [], identifyPromise: Promise.resolve() };
        }

        const identifyResult = new shared.IdentifyResult(this.getProxy());
        const tolerance = opts.tolerance || this.clickTolerance;

        // run a spatial query
        const qry = new this._apiRef.layer.Query();
        qry.outFields = ['*']; // this will result in just objectid fields, as that is all we have in feature layers

        // more accurate results without making the buffer if we're dealing with extents
        // polygons from added file need buffer
        // TODO further investigate why esri is requiring buffer for file-based polygons. logic says it shouldnt
        if (this.getGeomType() === 'esriGeometryPolygon' && !this.isFileLayer()) {
            qry.geometry = opts.geometry;
        } else {
            // TODO investigate why we are using opts.clickEvent.mapPoint and not opts.geometry
            qry.geometry = this.makeClickBuffer(opts.clickEvent.mapPoint, opts.map, tolerance);
        }

        const identifyPromise = Promise.all([
                this.getAttribs(),
                Promise.resolve(this._layer.queryFeatures(qry)),
                this.getLayerData()
            ])
            .then(([attributes, queryResult, layerData]) => {
                // transform attributes of query results into {name,data} objects one object per queried feature
                //
                // each feature will have its attributes converted into a table
                // placeholder for now until we figure out how to signal the panel that
                // we want to make a nice table
                identifyResult.isLoading = false;
                identifyResult.data = queryResult.features.map(
                    feat => {
                        // grab the object id of the feature we clicked on.
                        const objId = feat.attributes[layerData.oidField];
                        const objIdStr = objId.toString();

                        // use object id find location of our feature in the feature array, and grab its attributes
                        const featAttribs = attributes.features[attributes.oidIndex[objIdStr]].attributes;
                        return {
                            name: this.getFeatureName(objIdStr, featAttribs),
                            data: this.attributesToDetails(featAttribs, layerData.fields),
                            oid: objId,
                            symbology: [
                                { svgcode: this._apiRef.symbology.getGraphicIcon(featAttribs, layerData.renderer) }
                            ]
                        };
                    });
            });

        return { identifyResults: [identifyResult], identifyPromise };
    }

    /**
     * Applies a definition query to the layer.
     *
     * @function setDefinitionQuery
     * @param {String} query a valid definition query
     */
    setDefinitionQuery (query) {
        // very difficult.
        this._layer.setDefinitionExpression(query);
    }

}

module.exports = () => ({
    FeatureRecord
});
