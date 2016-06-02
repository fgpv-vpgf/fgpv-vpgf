(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name LayerBlueprintUserOptions
     * @module app.geo
     * @requires dependencies
     * @description
     *
     * The `LayerBlueprintUserOptions` service returns a collection of file option classes. These specify user selectable options when importing layer.
     *
     */
    angular
        .module('app.geo')
        .factory('LayerBlueprintUserOptions', factoryWrapper);

    function factoryWrapper(Geo, geoService) {
        // jscs doesn't like enhanced object notation
        // jscs:disable requireSpacesInAnonymousFunctionExpression
        class BlueprintUserOptions {
            constructor() {
                this._layerName = '';
                this._primaryField = '';
                this._layerId = '';
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
            constructor() {
                super();

                this._epsgLookup = geoService.epsgLookup; // this function will be moved somewhere
                this._targetWkid = geoService.mapObject.spatialReference.wkid;
            }

            get epsgLookup() {
                return this._epsgLookup;
            }

            get targetWkid() {
                return this._targetWkid;
            }
        }

        class FileCsvBlueprintUserOptions extends FileBlueprintUserOptions {
            constructor() {
                super();

                this._latfield = '';
                this._lonfield = '';
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
            constructor() {
                super();
            }
        }

        class FileShapefileBlueprintUserOptions extends FileBlueprintUserOptions {
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

            }
        };

        return service;
    }
})();
