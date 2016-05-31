(() => {
    'use strict';

    // jscs:disable requireSpacesInAnonymousFunctionExpression
    class BlueprintUserOptions {
        constructor() {
            this._layerName = '';
            this._primaryField = '';
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
    }

    class FileCsvBlueprintUserOptions extends BlueprintUserOptions {
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

        get longfield() {
            return this._lonfield;
        }

        set longfield(value) {
            this._lonfield = value;
        }
    }

    class FileGeoJsonBlueprintUserOptions extends BlueprintUserOptions {
        constructor() {
            super();
        }
    }

    class FileShapefileBlueprintUserOptions extends BlueprintUserOptions {
        constructor() {
            super();
        }
    }
    // jscs:disable requireSpacesInAnonymousFunctionExpression

    /**
     * @ngdoc service
     * @name LayerBlueprintUserOptions
     * @module app.geo
     * @requires dependencies
     * @description
     *
     * The `service` service description.
     *
     */
    angular
        .module('app.geo')
        .factory('LayerBlueprintUserOptions', factoryWrapper);

    function factoryWrapper(Geo) {
        return {
            File: {
                [Geo.Service.Types.CSV]: FileCsvBlueprintUserOptions,
                [Geo.Service.Types.GeoJSON]: FileGeoJsonBlueprintUserOptions,
                [Geo.Service.Types.Shapefile]: FileShapefileBlueprintUserOptions
            },
            Service: {

            }
        };
    }
})();
