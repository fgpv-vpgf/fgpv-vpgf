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

            this._geometryType = undefined;
            this._fcount = undefined;
        }
    }

    makeLayerConfig () {
        const cfg = super.makeLayerConfig();
        cfg.mode = this.config.state.snapshot ? this._layerClass.MODE_SNAPSHOT
                                                        : this._layerClass.MODE_ONDEMAND;

        // TODO confirm this logic. old code mapped .options.snapshot.value to the button -- meaning if we were in snapshot mode,
        //      we would want the button disabled. in the refactor, the button may get it's enabled/disabled from a different source.
        // this.config.state.snapshot = !this.config.state.snapshot;
        this._snapshot = this.config.state.snapshot;

        return cfg;
    }

    getGeomType () {
        // standard case, layer has no geometry. This gets overridden in feature-based Record classes.
        return this._geometryType;
    }

    // returns the proxy interface object for the root of the layer (i.e. main entry in legend, not nested child things)
    // TODO docs
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
            attribPackage = this._apiRef.attribs.loadServerAttribs(splitUrl.rootUrl, featIdx, this.config.outfields);
        }

        // feature has only one layer
        const aFC = new attribFC.AttribFC(this, featIdx, attribPackage, this.config);
        this._defaultFC = featIdx;
        this._featClasses[featIdx] = aFC;

        const pLS = aFC.loadSymbology();

        // update asynch data
        const pLD = aFC.getLayerData().then(ld => {
            this._geometryType = ld.geometryType;
            aFC.nameField = this.config.nameField || ld.nameField || '';
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

    getFeatureCount () {
        // just use the layer url (or lack of in case of file layer)
        return super.getFeatureCount(this._layer.url);
    }

    isFileLayer () {
        // TODO revisit.  is it robust enough?
        return this._layer && this._layer.url === '';
    }

    // TODO determine who is setting this. if we have an internal
    //      snapshot process, it might become a read-only property
    get isSnapshot () { return this._snapshot; }
    set isSnapshot (value) { this._snapshot = value; }

    get layerType () { return shared.clientLayerType.ESRI_FEATURE; }

    get featureCount () { return this._fcount; }

    onMouseOver (e) {
        if (this._hoverListeners.length > 0) {
            // TODO add in quick lookup for layers that dont have attributes loaded yet

            const showBundle = {
                type: 'mouseOver',
                point: e.screenPoint,
                target: e.target
            };

            // tell anyone listening we moused into something
            this._fireEvent(this._hoverListeners, showBundle);

            // pull metadata for this layer.
            this.getLayerData().then(lInfo => {
                // TODO this will change a bit after we add in quick lookup. for now, get all attribs
                return Promise.all([Promise.resolve(lInfo), this.getAttribs()]);
            }).then(([lInfo, aInfo]) => {
                // graphic attributes will only have the OID if layer is server based
                const oid = e.graphic.attributes[lInfo.oidField];

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

    onMouseOut (e) {
        // tell anyone listening we moused out
        const outBundle = {
            type: 'mouseOut',
            target: e.target
        };
        this._fireEvent(this._hoverListeners, outBundle);
    }

    /**
    * Run a query on a feature layer, return the result as a promise.  Fills the panelData array on resolution. // TODO update
    * @function identify
    * @param {Object} opts additional argumets like map object, clickEvent, etc.
    * @returns {Object} an object with identify results array and identify promise resolving when identify is complete; if an empty object is returned, it will be skipped
    */
    identify (opts) {
        // TODO add full documentation for options parameter

        // early kickout check. not loaded/error; not visible; not queryable; off scale
        if (this.state === shared.states.ERROR ||
            this.state === shared.states.LOADING ||
            this.state === shared.states.NEW ||
            !this.visibility ||
            !this.isQueryable() ||
            this.isOffScale(opts.map.getScale()).offScale) {
            /*
            console.log('early identify - state', this.state);
            console.log('early identify - visible', this.visibility);
            console.log('early identify - query', this.isQueryable());
            console.log('early identify - offscale', this.isOffScale(opts.map.getScale()).offScale);
            */

            // TODO verifiy this is correct result format if layer should be excluded from the identify process
            return { identifyResults: [], identifyPromise: Promise.resolve() };
        }

        const identifyResult = new shared.IdentifyResult(this.getProxy());

        // run a spatial query
        const qry = new this._apiRef.layer.Query();
        qry.outFields = ['*']; // this will result in just objectid fields, as that is all we have in feature layers

        // more accurate results without making the buffer if we're dealing with extents
        // polygons from added file need buffer
        // TODO further investigate why esri is requiring buffer for file-based polygons. logic says it shouldnt
        if (this._layer.geometryType === 'esriGeometryPolygon' && !this.isFileLayer()) {
            qry.geometry = opts.geometry;
        } else {
            qry.geometry = this.makeClickBuffer(opts.clickEvent.mapPoint, opts.map, this.clickTolerance);
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

}

module.exports = () => ({
    FeatureRecord
});
