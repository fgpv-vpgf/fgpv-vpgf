'use strict';

const shared = require('./shared.js')();
const basicFC = require('./basicFC.js')();

/**
 * @class AttribFC
 */
class AttribFC extends basicFC.BasicFC {
    // attribute-specific variant for feature class object.
    // deals with stuff specific to a feature class that has attributes

    /**
     * Create an attribute specific feature class object
     * @param {Object} parent        the Record object that this Feature Class belongs to
     * @param {String} idx           the service index of this Feature Class. an integer in string format. use '0' for non-indexed sources.
     * @param {Object} layerPackage  a layer package object from the attribute module for this feature class
     * @param {Object} config        the config object for this sublayer
     */
    constructor (parent, idx, layerPackage, config) {
        super(parent, idx, config);

        this._layerPackage = layerPackage;
        this._geometryType = undefined; // this indicates unknown to the ui.
        this._fcount = undefined;
        this._quickCache = {
            attribs: {},
            geoms: {}
        };
    }

    get geomType () { return this._geometryType; }
    set geomType (value) { this._geometryType = value; }

    get queryUrl () { return `${this._parent.rootUrl}/${this._idx}`; }

    get loadedFeatureCount () { return this._layerPackage ? this._layerPackage.loadedFeatureCount : 0; }

    /**
     * Returns attribute data for this FC.
     *
     * @function getAttribs
     * @returns {Promise}         resolves with a layer attribute data object
     */
    getAttribs () {
        return this._layerPackage.getAttribs();
    }

    /**
     * Indicates if attributes have been downloaded for this FC.
     *
     * @function attribsLoaded
     * @returns {Boolean}         true if attributes are downloaded.
     */
    attribsLoaded () {
        return this._layerPackage.loadIsDone;
    }

    /**
     * Returns layer-specific data for this FC.
     *
     * @function getLayerData
     * @returns {Promise}         resolves with a layer data object
     */
    getLayerData () {
        return this._layerPackage.layerData;
    }

    /**
     * Attempts to abort an attribute load in progress.
     * Harmless to call before or after an attribute load.
     *
     * @function abortAttribLoad
     */
    abortAttribLoad () {
        this._layerPackage.abortAttribLoad();
    }

    /**
     * Download or refresh the internal symbology for the FC.
     *
     * @function loadSymbology
     * @returns {Promise}         resolves when symbology has been downloaded
     */
    loadSymbology () {
        return this.getLayerData().then(lData => {
            if (lData.layerType === 'Feature Layer') {
                // feature always has a single item, so index 0
                this.symbology = shared.makeSymbologyArray(lData.legend.layers[0].legend);
            } else {
                // non-feature source. use legend server
                return super.loadSymbology();
            }
        });
    }

    /**
     * Extract the feature name from a feature as best we can.
     *
     * @function getFeatureName
     * @param {String} objId      the object id of the attribute
     * @param {Object} attribs    the dictionary of attributes for the feature.
     * @returns {String}          the name of the feature
     */
    getFeatureName (objId, attribs) {
        // TODO revisit the objId parameter.  Do we actually need this fallback anymore?
        // NOTE: we used to have fallback logic here that would use layer settings
        //       if this.nameField had no value. Logic has changed to now push
        //       layer settings to this.nameField during the load event of the
        //       Record.

        if (this.nameField && attribs) {
            // extract name
            return attribs[this.nameField];
        } else {
            // FIXME wire in "feature" to translation service
            return 'Feature ' + objId;
        }
    }

    /**
     * Retrieves attributes from a layer for a specified feature index
     * @return {Promise}            promise resolving with formatted attributes to be consumed by the datagrid and esri feature identify
     */
    getFormattedAttributes () {
        if (this._formattedAttributes) {
            return this._formattedAttributes;
        }

        // TODO after refactor, consider changing this to a warning and just return some dummy value
        if (this.layerType === shared.clientLayerType.ESRI_RASTER) {
            throw new Error('Attempting to get attributes on a raster layer.');
        }

        this._formattedAttributes = Promise.all([this.getAttribs(), this.getLayerData()])
            .then(([aData, lData]) => {
                // create columns array consumable by datables
                const columns = lData.fields
                    .filter(field =>

                        // assuming there is at least one attribute - empty attribute budnle promises should be rejected, so it never even gets this far
                        // filter out fields where there is no corresponding attribute data
                        aData.features[0].attributes.hasOwnProperty(field.name))
                    .map(field => ({
                        data: field.name,
                        title: field.alias || field.name
                    }));

                // derive the icon for the row
                const rows = aData.features.map(feature => {
                    const att = feature.attributes;
                    att.rvInteractive = '';
                    att.rvSymbol = this._parent._apiRef.symbology.getGraphicIcon(att, lData.renderer);
                    return att;
                });

                // if a field name resembles a function, the data table will treat it as one.
                // to get around this, we add a function with the same name that returns the value,
                // tricking that silly datagrid.
                columns.forEach(c => {
                    if (c.data.substr(-2) === '()') {
                        // have to use function() to get .this to reference the row.
                        // arrow notation will reference the attribFC class.
                        const secretFunc = function() {
                            return this[c.data];
                        };

                        const stub = c.data.substr(0, c.data.length - 2); // function without brackets
                        rows.forEach(r => {
                            r[stub] = secretFunc;
                        });
                    }
                });

                return {
                    columns,
                    rows,
                    fields: lData.fields, // keep fields for reference ...
                    oidField: lData.oidField, // ... keep a reference to id field ...
                    oidIndex: aData.oidIndex, // ... and keep id mapping array
                    renderer: lData.renderer
                };
            })
            .catch(e => {
                delete this._formattedAttributes; // delete cached promise when the geoApi `getAttribs` call fails, so it will be requested again next time `getAttributes` is called;
                if (e === 'ABORTED') {
                    throw new Error('ABORTED');
                } else {
                    throw new Error('Attrib loading failed');
                }
            });

        return this._formattedAttributes;
    }

    /**
     * Check to see if the attribute in question is an esriFieldTypeDate type.
     *
     * @param {String} attribName     the attribute name we want to check if it's a date or not
     * @return {Promise}              resolves to true or false based on the attribName type being esriFieldTypeDate
     */
    checkDateType (attribName) {
        // TEST STATUS none
        // grab attribute info (waiting for it it finish loading)
        return this.getLayerData().then(lData => {
            // inspect attribute fields
            if (lData.fields) {
                const attribField = lData.fields.find(field => {
                    return field.name === attribName;
                });
                if (attribField && attribField.type) {
                    return attribField.type === 'esriFieldTypeDate';
                }
            }
            return false;
        });
    }

    /**
     * Get the best user-friendly name of a field. Uses alias if alias is defined, else uses the system attribute name.
     *
     * @param {String} attribName     the attribute name we want a nice name for
     * @return {Promise}              resolves to the best available user friendly attribute name
     */
    aliasedFieldName (attribName) {
        // grab attribute info (waiting for it it finish loading)
        return this.getLayerData().then(lData => {
            return AttribFC.aliasedFieldNameDirect(attribName, lData.fields);
        });

    }

    /**
     * Get the best user-friendly name of a field. Uses alias if alias is defined, else uses the system attribute name.
     *
     * @param {String} attribName     the attribute name we want a nice name for
     * @param {Array} fields          list of field definition objects (esri format) for the layer.
     * @return {String}               the best available user friendly attribute name
     */
    static aliasedFieldNameDirect (attribName, fields) {
        let fName = attribName;

        // search for aliases
        if (fields) {
            const attribField = fields.find(field => {
                return field.name === attribName;
            });
            if (attribField && attribField.alias && attribField.alias.length > 0) {
                fName = attribField.alias;
            }
        }
        return fName;
    }

    /**
     * Convert an attribute set so that any keys using aliases are converted to proper fields
     *
     * @param  {Object} attribs      attribute key-value mapping, potentially with aliases as keys
     * @param  {Array} fields       fields definition array for layer
     * @return {Object}              attribute key-value mapping with fields as keys
     */
    static unAliasAttribs (attribs, fields) {
        const newA = {};
        fields.forEach(field => {
            // attempt to extract on name. if not found, attempt to extract on alias
            // dump value into the result
            newA[field.name] = attribs.hasOwnProperty(field.name) ? attribs[field.name] : attribs[field.alias];
        });
        return newA;
    }

    /**
     * Fetches a graphic from the given layer.
     * Will attempt local copy (unless overridden), will hit the server if not available.
     *
     * @function fetchGraphic
     * @param  {Integer} objectId      ID of object being searched for
     * @param {Object} opts            object containing option parametrs
     *                 - map           map wrapper object of current map. only required if requesting geometry
     *                 - geom          boolean. indicates if return value should have geometry included. default to false
     *                 - attribs       boolean. indicates if return value should have attributes included. default to false
     * @returns {Promise} resolves with a bundle of information. .graphic is the graphic; .layerFC for convenience
     */
    fetchGraphic (objectId, opts) {

        // see https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2190 for reasons why
        // things are done the way they are in this function.

        // TODO this is currently a mess of IF statements, and a very dirty hack using a promise.
        //      could certainly use a refactor LATER.
        // this function should win a prize for good structure :trophy:

        const layerObj = this._parent._layer;
        const result = {
            graphic: null,
            layerFC: this
        };
        const resultFeat = {};

        const nonPoint = this.geomType !== 'esriGeometryPoint';
        let needWebAttr = false;
        let needWebGeom = false;
        let lod;
        let gCache;
        let aCache;
        let localGraphic;

        // basically this hack promise handles one odd case where we are getting attributes from
        // an asynch source that is very inconvenient (code would be mint if it was synch source).
        // so in all other cases, the promse just resolves. in the odd case, it waits, then updates
        // the result variable, then resolves.
        // so at both points in the code where the main return value promise resolves, we first
        // wait on this (which usually resolves right away, and the odd case the thing it's waiting
        // on is already resolved, but need to treat it like a promise because of rules!)
        let attribHackPromise = Promise.resolve();

        // subfunction to extract a graphic from a feature layerk
        const huntLocalGraphic = objId => {
            return layerObj.graphics.find(g =>
                g.attributes[layerObj.objectIdField] === objId);
        };

        if (opts.attribs) {
            // attempt to get attributes from fastest source.
            aCache = this._quickCache.attribs;
            if (aCache[objectId]) {
                // value is already cached. use it
                resultFeat.attributes = aCache[objectId];
            } else if (this._layerPackage.loadIsDone) {
                // all attributes have been loaded. use that store.
                // since our store is a promise, need to do some hack trickery here
                attribHackPromise = new Promise(resolve => {
                    this._layerPackage.getAttribs().then(ad => {
                        resultFeat.attributes = ad.features[ad.oidIndex[objectId]].attributes;
                        resolve();
                    });
                });

            } else if (this._parent.isFileLayer() && layerObj.graphics) {
                // it is a feature layer that is file based. we can extract info from it.
                localGraphic = huntLocalGraphic(objectId);
                resultFeat.attributes = localGraphic.attributes;

            } else {
                // we will need to ask the service
                needWebAttr = true;
            }
        }

        if (opts.geom) {
            // first locate the appropriate cache due to simplifications.
            gCache = this._quickCache.geoms;

            if (nonPoint) {
                // lines and polys have a cache for each LOD

                const mapLevel = opts.map.getLevel();
                lod = opts.map.lods.find(l => l.level === mapLevel);

                if (!gCache[lod.scale]) {
                    gCache[lod.scale] = {};
                }
                gCache = gCache[lod.scale];
            }

            // attempt to get geometry from fastest source.
            if (gCache[objectId]) {
                resultFeat.geometry = gCache[objectId];
            } else if (layerObj.graphics) {
                // it is a feature layer. we can attempt to extract info from it.
                // but remember the feature may not exist on the client currently
                if (!localGraphic) {
                    // wasn't fetched during attribute section. do it now
                    localGraphic = huntLocalGraphic(objectId);
                }

                if (localGraphic) {
                    // found one. cache it and use it
                    gCache[objectId] = localGraphic.geometry;
                    resultFeat.geometry = localGraphic.geometry;
                } else {
                    needWebGeom = true;
                }

            } else {
                needWebGeom = true;
            }
        }

        // hit the server if we dont have cached values
        if (needWebAttr || needWebGeom) {
            return new Promise(
                (resolve, reject) => {
                    const parent = this._parent;
                    const reqParam = {
                        url: `${parent.rootUrl}/${this._idx}/query`,
                        content: {
                            f: 'json',
                            objectIds: objectId,
                            outFields: '*',
                            returnGeometry: needWebGeom
                        },
                        callbackParamName: 'callback',
                        handleAs: 'json'
                    };

                    if (needWebGeom) {
                        reqParam.content.outSR = map.spatialReference;
                        if (nonPoint) {
                            reqParam.content.maxAllowableOffset = lod.resolution;
                        }
                    }

                    // TODO investigate adding `geometryPrecision` to the param.
                    //      if we have bloated decimal places, this will drop them.
                    //      need to be careful of the units of the map and the current scale.
                    //      e.g. a basemap in lat long will certainly need decimal places.

                    const defData = parent._esriRequest(reqParam);

                    defData.then(
                        queryResult => {
                            const feat = queryResult.features[0];

                            if (!feat) {
                                throw new Error(`Could not find feature (oid ${objectId})`);
                            }

                            if (needWebGeom) {
                                // server result omits spatial reference
                                feat.geometry.spatialReference = queryResult.spatialReference;
                                gCache[objectId] = feat.geometry;
                                resultFeat.geometry = feat.geometry;
                            }

                            if (needWebAttr) {
                                aCache[objectId] = feat.attributes;
                                resultFeat.attributes = feat.attributes;
                            }

                            result.graphic = resultFeat;
                            attribHackPromise.then(() => {
                                resolve(result);
                            });
                        }, error => {
                            console.warn(error);
                            reject(error);
                        }
                    );
                });
        } else {
            // no need for web requests. everything was available locally
            return attribHackPromise.then(() => {
                result.graphic = resultFeat;
                return result;
            });
        }
    }

    /**
     * Will attempt to zoom the map view so the a graphic is prominent.
     *
     * @function zoomToGraphic
     * @param  {Integer} objId          Object ID of grahpic being searched for
     * @param  {Object} map             wrapper object for the map we want to zoom
     * @param {Object} offsetFraction   an object with decimal properties `x` and `y` indicating percentage of offsetting on each axis
     * @return {Promise}                resolves after the map is done moving
     */
    zoomToGraphic (objId, map, offsetFraction) {

        return this.fetchGraphic(objId, { map, geom: true })
            .then(fetchedGraphic => {
                const gapi = this._parent._apiRef;

                // make new graphic (on the chance it came from server and is just raw json geometry)
                const graphic = gapi.proj.Graphic(fetchedGraphic.graphic);

                // reproject graphic to spatialReference of the map
                let extent = gapi.proj.graphicsUtils.graphicsExtent([graphic]);
                if (!gapi.proj.isSpatialRefEqual(graphic.geometry.spatialReference, map.spatialReference)) {
                    const intermExtent = gapi.proj.localProjectExtent(extent, map.spatialReference);
                    extent = gapi.Map.Extent(intermExtent.x0, intermExtent.y0,
                        intermExtent.x1, intermExtent.y1, intermExtent.sr);
                }

                // move map according to geometry
                let geomZoomPromise;
                if (this.geomType === 'esriGeometryPoint') {
                    // zoom to point at a decent scale for hilighting a point
                    const sweetLod = gapi.Map.findClosestLOD(map.lods, 50000);
                    geomZoomPromise = map.centerAndZoom(extent.getCenter(), Math.max(sweetLod.level, 0));
                } else {
                    // zoom to the extent of the geometery
                    geomZoomPromise = map.setExtent(extent, true);
                }

                // make next step wait for map to zoom, and pass it our projected target extent.
                return geomZoomPromise.then(() => extent);
            }).then(extent => {

                // determine if our optimal zoom is offscale
                const scale = this.isOffScale(map.getScale());

                // adjust the scale if the layer is offscale
                const scaleZoomPromise = scale.offScale ?
                    this.zoomToScale(map, map.lods, scale.zoomIn, false) : Promise.resolve();

                return scaleZoomPromise.then(() => extent);

            }).then(extent => {
                // map is at best position we can manage. do any offsetting for UI elements
                return map.moveToOffsetExtent(extent, offsetFraction);
            });
    }

}

module.exports = () => ({
    AttribFC
});
