import RColor from 'rcolor';

/**
 * @module LayerBlueprintUserOptions
 * @memberof app.geo
 * @requires dependencies
 * @description
 *
 * The `LayerBlueprintUserOptions` service returns a collection of file option classes. These specify user selectable options when importing layer.
 *
 */
angular
    .module('app.geo')
    .factory('LayerBlueprintUserOptions', LayerBlueprintUserOptionsFactory);

function LayerBlueprintUserOptionsFactory(Geo) {
    // jscs doesn't like enhanced object notation
    // jscs:disable requireSpacesInAnonymousFunctionExpression
    class BlueprintUserOptions {
        constructor(smartDefaults) {
            this._layerName = '';
            this._layerId = '';

            this._primaryField = smartDefaults.primary;
        }

        get layerName() {
            return this._layerName;
        }

        set layerName(value) {
            this._layerName = value;
        }

        get primaryField() {
            return this._primaryField;
        }

        set primaryField(value) {
            this._primaryField = value;
        }

        get layerId() {
            return this._layerId;
        }
        set layerId(value) {
            this._layerId = value;
        }
    }

    class FileBlueprintUserOptions extends BlueprintUserOptions {
        constructor(epsgLookup, targetWkid, smartDefaults) {
            super(smartDefaults);

            this._epsgLookup = epsgLookup;
            this._targetWkid = targetWkid;
            this._colour = (new RColor()).get(true, 0.4, 0.8); // generate a nice random colour to use with imported file-based layers
        }

        get epsgLookup() {
            return this._epsgLookup;
        }

        get targetWkid() {
            return this._targetWkid;
        }

        get colour() {
            return this._colour;
        }

        set colour(hex) {
            this._colour = hex;
        }
    }

    class FileCsvBlueprintUserOptions extends FileBlueprintUserOptions {
        constructor(epsgLookup, targetWkid, smartDefaults) {
            super(epsgLookup, targetWkid, smartDefaults);

            this._latfield = smartDefaults.lat;
            this._lonfield = smartDefaults.long;
        }

        get latfield() {
            return this._latfield;
        }

        set latfield(value) {
            this._latfield = value;
        }

        get lonfield() {
            return this._lonfield;
        }

        set lonfield(value) {
            this._lonfield = value;
        }
    }

    class FileGeoJsonBlueprintUserOptions extends FileBlueprintUserOptions {
        constructor(epsgLookup, targetWkid, smartDefaults) {
            super(epsgLookup, targetWkid, smartDefaults);
        }
    }

    class FileShapefileBlueprintUserOptions extends FileBlueprintUserOptions {
        constructor(epsgLookup, targetWkid, smartDefaults) {
            super(epsgLookup, targetWkid, smartDefaults);
        }
    }

    // looks like user options class will be subsumed by the config classes
    // not much here ...
    class ServiceBlueprintUserOptions extends BlueprintUserOptions {
        constructor() {
            super();
        }
    }
    // jscs:enable requireSpacesInAnonymousFunctionExpression

    const service = {
        File: {
            [Geo.Service.Types.CSV]: FileCsvBlueprintUserOptions,
            [Geo.Service.Types.GeoJSON]: FileGeoJsonBlueprintUserOptions,
            [Geo.Service.Types.Shapefile]: FileShapefileBlueprintUserOptions
        },
        Service: {
            [Geo.Service.Types.FeatureLayer]: ServiceBlueprintUserOptions,
            [Geo.Service.Types.DynamicService]: ServiceBlueprintUserOptions,
            [Geo.Service.Types.WMS]: ServiceBlueprintUserOptions
        }
    };

    return service;
}
