import RColor from 'rcolor';

/**
 * @module LayerSourceInfo
 * @memberof app.geo
 * @requires dependencies
 * @description
 *
 * The `LayerSourceInfo` service returns a collection of file option classes. These specify user selectable options when importing layer.
 *
 */
angular
    .module('app.geo')
    .factory('LayerSourceInfo', LayerSourceInfoFactory);

function LayerSourceInfoFactory(Geo, gapiService) {

    class Info {
        constructor(config) {
            this._config = config;
            this.snapshot();

            this.reset();
        }

        get config() { return this._config; }

        snapshot (config) {
            this._originalConfig = angular.copy(this._config);
        }

        reset() {
            this._config = angular.copy(this._originalConfig);
        }

        get type () { return Geo.Service.Types.Unknown; }
    }

    class ServiceInfo extends Info { }

    class FeatureServiceInfo extends ServiceInfo {
        constructor(config, fields) {
            super(config);

            this.fields = fields;
        }

        get fields () { return this._fields; }
        set fields (value) {
            // number all the fields, so even fields with equal names can be distinguished by the md selector
            value.forEach((field, index) =>
                (field.index = index));

            this._fields = value;
        }

        get type () { return Geo.Service.Types.FeatureLayer; }
    }

    class DynamicServiceInfo extends ServiceInfo {
        constructor(config, layers) {
            super(config);

            this._layers = layers;
        }

        get layers () { return this._layers; }

        get type () { return Geo.Service.Types.DynamicService; }
    }

    class WMSServiceInfo extends ServiceInfo {
        constructor(config, layers) {
            super(config);

            this._layers = layers;
        }

        get layers () { return this._layers; }

        get type () { return Geo.Service.Types.WMS; }
    }

    /*class RasterServiceInfo extends ServiceInfo {
        get type () { return Geo.Service.Types.RasterLayer; }
        }*/

    class ImageServiceInfo extends ServiceInfo {
        get type () { return Geo.Service.Types.ImageService; }
    }

    class TileServiceInfo extends ServiceInfo {
        get type () { return Geo.Service.Types.TileService; }
    }

    class FileInfo extends FeatureServiceInfo {
        constructor(config, rawData, targetWkid) {
            super(config, []);

            this._rawData = rawData;
            this._targetWkid = targetWkid;
            this._formattedData = null;
            this._colour = RColor({ saturation: 0.4, value: 0.8 }); // generate a nice random colour to use with imported file-based layers
        }

        get targetWkid () { return this._targetWkid; }

        get rawData () { return this._rawData; }
        get formattedData() { return this._formattedData; }

        get layerId () { return this._config.id; }

        get colour () { return this._colour; }
        set colour (hex) { this._colour = hex; }

        get type () { return Geo.Service.Types.TileService; }

        validate() {
            const validationPromise = gapiService.gapi.layer.validateFile(this.type, this.rawData)
                .then(validationResult => {
                    this.fields = validationResult.fields;
                    this._parsedData = validationResult.formattedData;
                    this._formattedData = validationResult.formattedData;
                    // TODO: do we need geometry type at all???

                    this.config.nameField = validationResult.smartDefaults.primary;
                    this.snapshot();

                    return validationResult;
                });

            return validationPromise;
        }
    }

    class CSVFileInfo extends FileInfo {
        get latfield () { return this._latfield; }
        set latfield (value) { this._latfield = value; }
        get lonfield () { return this._lonfield; }
        set lonfield (value) { this._lonfield = value; }

        get type () { return Geo.Service.Types.CSV; }

        validate () {
            const validationPromise = super.validate().then(validationResult => {
                this.latfield = validationResult.smartDefaults.lat;
                this.lonfield = validationResult.smartDefaults.long;
                this.latFields = validationResult.latFields;
                this.longFields = validationResult.longFields;

                return validationResult;
            });

            return validationPromise;
        }
    }

    class GeoJSONFileInfo extends FileInfo {
        get type () { return Geo.Service.Types.GeoJSON; }
    }

    class ShapefileFileInfo extends FileInfo {
        get type () { return Geo.Service.Types.Shapefile; }
        get formattedData() { return this._rawData; }
    }

    const service = {
        FeatureServiceInfo,
        DynamicServiceInfo,
        WMSServiceInfo,
        // RasterServiceInfo,
        ImageServiceInfo,
        TileServiceInfo,

        CSVFileInfo,
        GeoJSONFileInfo,
        ShapefileFileInfo
    };

    return service;
}
