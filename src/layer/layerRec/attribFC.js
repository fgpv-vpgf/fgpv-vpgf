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
        this._quickCache = {};
    }

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
    * Returns layer-specific data for this FC.
    *
    * @function getLayerData
    * @returns {Promise}         resolves with a layer data object
    */
    getLayerData () {
        return this._layerPackage.layerData;
    }

    // this will actively download / refresh the internal symbology
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

                return {
                    columns,
                    rows: aData.features.map(feature => feature.attributes),
                    fields: lData.fields, // keep fields for reference ...
                    oidField: lData.oidField, // ... keep a reference to id field ...
                    oidIndex: aData.oidIndex, // ... and keep id mapping array
                    renderer: lData.renderer
                };
            })
            .catch(() => {
                delete this._formattedAttributes; // delete cached promise when the geoApi `getAttribs` call fails, so it will be requested again next time `getAttributes` is called;
                throw new Error('Attrib loading failed');
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
        // TEST STATUS none
        // grab attribute info (waiting for it it finish loading)
        return this.getLayerData().then(lData => {
            return AttribFC.aliasedFieldNameDirect(attribName, lData.fields);
        });

    }

    static aliasedFieldNameDirect (attribName, fields) {
        // TEST STATUS none
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
    * Fetches feature information, including geometry, from esri servers for feature layer.
    * @param {Integer} objectId for feature to be retrived from the server
    * @returns {Promise} promise resolves with an esri Graphic (http://resources.arcgis.com/en/help/arcgis-rest-api/#/Feature_Map_Service_Layer/02r3000000r9000000/)
    */
    getServerFeatureInfo (objectId) {
        if (this._quickCache[objectId]) {
            return Promise.resolve(this._quickCache[objectId]);
        }
        return new Promise(
            (resolve, reject) => {
                const parent = this._parent;
                const defData = parent._esriRequest({
                    url: `${parent.rootUrl}/${this._idx}/${objectId}`,
                    content: {
                        f: 'json',
                    },
                    callbackParamName: 'callback',
                    handleAs: 'json'
                });

                defData.then(
                    serverFeature => {
                        // server result omits spatial reference
                        serverFeature.feature.geometry.spatialReference = parent._layer.spatialReference;
                        this._quickCache[objectId] = serverFeature;
                        resolve(serverFeature);
                    }, error => {
                        console.warn(error);
                        reject(error);
                    }
                );
            });
    }

    /**
     * Fetches a graphic from the given layer.
     * Will attempt local copy, will hit the server if not available.
     *
     * @function fetchGraphic
     * @param  {Integer} objId ID of object being searched for
     * @returns {Promise} resolves with a bundle of information. .graphic is the graphic; .source is where it came from - 'layer' or 'server'; also .layerFC for convenience
     */
    fetchGraphic (objId) {

        const layerObj = this._parent._layer;
        const result = {
            graphic: null,
            source: null,
            layerFC: this
        };

        // if feature layer, check if graphic is already loaded on the client. return it if found.
        if (layerObj.graphics) {
            const myG = layerObj.graphics.find(g =>
                g.attributes[layerObj.objectIdField] === objId);
            if (myG) {
                result.graphic = myG;
                result.source = 'layer';
                return Promise.resolve(result);
            }
        }

        // were not able to get a local copy of the graphic. to the server!
        // TODO add some error handling. Cases: failed server call. server call is not a feature
        return this.getServerFeatureInfo(objId)
            .then(featureInfo => {
                result.graphic = featureInfo.feature;
                result.source = 'server';
                return result;
            });
    }

}

module.exports = () => ({
    AttribFC
});
