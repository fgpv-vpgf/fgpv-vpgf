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
        if (!esriLayer || config.wfsConfig) {
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
     * Indicates the oid field of the layer.
     *
     * @function getOidField
     * @returns {String} the oid field of the layer
     */
    getOidField () {
        return this._featClasses[this._defaultFC].oidField;
    }

    /**
     * Provides the proxy interface object to the layer.
     *
     * @function getProxy
     * @returns {Object} the proxy interface for the layer
     */
    getProxy () {
        if (!this._rootProxy) {
            this._rootProxy = new layerInterface.LayerInterface(this);
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

        // we run into a lot of funny business with functions/constructors modifying parameters.
        // this essentially clones an object to protect original objects against trickery.
        const jsonCloner = inputObject => {
            return JSON.parse(JSON.stringify(inputObject));
        };

        // attempt to set custom renderer here. if fails, we can attempt on client but prefer it here
        // as this doesnt care where the layer came from
        if (this.config.customRenderer.type) {
            // all renderers have a type field. if it's missing, no renderer was provided, or its garbage
            const classMapper = {
                simple: this._apiRef.symbology.SimpleRenderer,
                classBreaks: this._apiRef.symbology.ClassBreaksRenderer,
                uniqueValue: this._apiRef.symbology.UniqueValueRenderer
            }

            // renderer constructors apparently convert their input json from server style to client style.
            // we dont want that. use a clone to protect config's property.
            const cloneRenderer = jsonCloner(this.config.customRenderer);
            const custRend = classMapper[cloneRenderer.type](cloneRenderer);
            this._layer.setRenderer(custRend);
        }

        // get attribute package
        let attribPackage;
        let featIdx;
        if (this.dataSource() !== shared.dataSources.ESRI) {
            featIdx = '0';
            attribPackage = this._apiRef.attribs.loadFileAttribs(this._layer);
        } else {
            const splitUrl = shared.parseUrlIndex(this._layer.url);
            featIdx = splitUrl.index;
            this.rootUrl = splitUrl.rootUrl;

            // methods in the attrib loader will update our copy of the renderer. if we pass in the config reference, it gets
            // updated and some weird stuff happens. Make a copy.
            const cloneRenderer = jsonCloner(this.config.customRenderer);
            attribPackage = this._apiRef.attribs.loadServerAttribs(splitUrl.rootUrl, featIdx, this.config.outfields,
                cloneRenderer);
        }

        // feature has only one layer
        const aFC = new attribFC.AttribFC(this, featIdx, attribPackage, this.config);
        this._defaultFC = featIdx;
        this._featClasses[featIdx] = aFC;

        const pLS = aFC.loadSymbology();

        // update asynch data
        const pLD = aFC.getLayerData().then(ld => {
            aFC.geomType = ld.geometryType;
            aFC.oidField = ld.oidField;
            aFC.nameField = this.config.nameField || ld.nameField || '';
            aFC.tooltipField = this.config.tooltipField || aFC.nameField;

            // check the config for any custom field aliases, and add the alias as a property if it exists
            if (this.config.source.fieldMetadata) {
                ld.fields.forEach(field => {
                    const clientAlias = this.config.source.fieldMetadata.find(f => f.data === field.name);
                    field.clientAlias = clientAlias ? clientAlias.alias : undefined;
                });
            }

            // trickery. file layer can have field names that are bad keys.
            // our file loader will have corrected them, but config.nameField and config.tooltipField will have
            // been supplied from the wizard (it pre-fetches fields to present a choice
            // to the user). If the nameField / tooltipField was adjusted for bad characters, we need to
            // re-synchronize it here.
            if (this.dataSource() !== shared.dataSources.ESRI) {
                if (ld.fields.findIndex(f => f.name === aFC.nameField) === -1) {
                    const validField = ld.fields.find(f => f.alias === aFC.nameField);
                    if (validField) {
                        aFC.nameField = validField.name;
                        if (!this.config.tooltipField) {    // tooltipField wasn't explicitly provided, so it was also using the bad nameField key
                            aFC.tooltipField = validField.name
                        }
                    } else {
                        // give warning. impact is tooltips will have no text, details pane no header
                        console.warn(`Cannot find name field in layer field list: ${aFC.nameField}`);
                    }
                }

                // only check the tooltipField if it was provided from the config, otherwise it would have been corrected above already (if required)
                if (this.config.tooltipField && ld.fields.findIndex(f => f.name === aFC.tooltipField) === -1) {
                    const validField = ld.fields.find(f => f.alias === aFC.tooltipField);
                    if (validField) {
                        aFC.tooltipField = validField.name;
                    } else {
                        // give warning. impact is tooltips will have no text, details pane no header
                        console.warn(`Cannot find name field in layer field list: ${aFC.tooltipField}`);
                    }
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
     * Indicates if the layer is file based, WFS, or esri based.
     *
     * @function dataSource
     * @returns {String} 'file' if file layer, 'wfs' if WFS, else 'esri'
     */
    dataSource () {
        // 'this.layerType' will be 'esriFeature' even for WFS layers, so must use 'this.config.layerType'
        if (this.config.layerType === shared.clientLayerType.OGC_WFS) {
            return shared.dataSources.WFS;
        } else if (this._layer && !this._layer.url) {   // TODO revisit.  is it robust enough?
            return shared.dataSources.FILE;
        } else {
            return shared.dataSources.ESRI;
        }
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

    get filter () { return this._featClasses[this._defaultFC].filter; }

    /**
     * Triggers when the mouse enters a feature of the layer.
     *
     * @function onMouseOver
     * @param {Object} standard mouse event object
     */
    onMouseOver (e) {
        if (this._hoverEvent.listenerCount > 0) {

            const showBundle = {
                type: 'mouseOver',
                point: e.screenPoint,
                target: e.target
            };

            // tell anyone listening we moused into something
            this._hoverEvent.fireEvent(showBundle);

            // pull metadata for this layer.
            let oid;
            this.getLayerData().then(lInfo => {
                // graphic attributes will only have the OID if layer is server based
                oid = e.graphic.attributes[lInfo.oidField];
                const graphicPromise = this.fetchGraphic(oid, { attribs: true });
                return Promise.all([Promise.resolve(lInfo), graphicPromise]);
            }).then(([lInfo, graphicBundle]) => {

                const featAttribs = graphicBundle.graphic.attributes;

                // get icon via renderer and geoApi call
                const svgcode = this._apiRef.symbology.getGraphicIcon(featAttribs, lInfo.renderer);

                // duplicate the position so listener can verify this event is same as mouseOver event above
                const loadBundle = {
                    type: 'tipLoaded',
                    name: this.getTooltipName(oid, featAttribs),
                    attribs: featAttribs,
                    target: e.target,
                    svgcode
                };

                // tell anyone listening we moused into something
                this._hoverEvent.fireEvent(loadBundle);

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
        this._hoverEvent.fireEvent(outBundle);
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
        if (this.getGeomType() === 'esriGeometryPolygon' && this.dataSource() === shared.dataSources.ESRI) {
            qry.geometry = opts.geometry;
        } else {
            // TODO investigate why we are using opts.clickEvent.mapPoint and not opts.geometry
            qry.geometry = this.makeClickBuffer(opts.clickEvent.mapPoint, opts.map, tolerance);
        }

        // a big promise chain. resolves when all the asynch parts of identify are done.
        // has no result parameter, instead updates contents of identifyResult object
        const identifyPromise = Promise.all([
                // first asynch step. do identify on the layer, and ensure layer metadata is downloaded.
                Promise.resolve(this._layer.queryFeatures(qry)),
                this.getLayerData()

            ]).then(([queryResult, layerData]) => {
                // second asynch step. do any additional filtering on local layer results.
                // then fetch full attribute values for all the identify results

                let validResults;
                if (this.dataSource() === shared.dataSources.ESRI) {
                    // because server-sourced layers use definition expression, the results are automatically filtered
                    validResults = queryResult.features;
                } else {
                    // file / wfs
                    // the query will return items that are invisible due to filters. banish them.
                    validResults = queryResult.features.filter(f => {
                        const objId = f.attributes[layerData.oidField];
                        const graphic = this._layer.graphics.find(g => {
                            return g.attributes[layerData.oidField] === objId;
                        });
                        if (graphic) {
                            return graphic.visible;
                        } else {
                            // couldn't find this graphic. should never happen
                            return false;
                        }
                    });
                }

                // get the attributes using fetchGraphic (will pick most efficient route to attributes)
                // bundle all requests in promises
                const vAttribPromises = validResults.map(feat => {
                    // grab the object id of the feature we clicked on.
                    return new Promise(resolve => {
                        const objId = feat.attributes[layerData.oidField];
                        const graphicPromise = this.fetchGraphic(objId, { attribs: true });
                        graphicPromise.then(graphicBundle => {
                            resolve({
                                oid: objId,
                                attributes: graphicBundle.graphic.attributes
                            });
                        });
                    });
                });

                // tack on the layer data, as we need it for next section
                vAttribPromises.push(Promise.resolve(layerData));

                return Promise.all(vAttribPromises);

            }).then(validAttributes => {
                // third async step (this part is all synch, so is final part).
                // transform attributes of identify results into objects containing info
                // the details panel reqires.
                //
                // each feature will have its attributes converted into a table
                // placeholder for now until we figure out how to signal the panel that
                // we want to make a nice table

                const layerData = validAttributes.pop();

                identifyResult.data = validAttributes.map(vAtt => {
                    return {
                        name: this.getFeatureName(vAtt.oid.toString(), vAtt.attributes),
                        data: this.attributesToDetails(vAtt.attributes, layerData.fields),
                        oid: vAtt.oid,
                        symbology: [
                            { svgcode: this._apiRef.symbology.getGraphicIcon(vAtt.attributes, layerData.renderer) }
                        ]
                    };
                });
                identifyResult.isLoading = false;
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
