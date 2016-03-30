(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name mapService
     * @module app.geo
     * @requires $q
     * @description
     *
     * The `mapService` factory holds references to the map dom node and the currently active map object.
     *
     */
    angular
        .module('app.geo')
        .factory('mapService', mapServiceFactory);

    function mapServiceFactory($q, $timeout, gapiService) {
        return mapService;

        function mapService(geoState, config) {

            if (angular.isUndefined(geoState.fullExtent)) {
                geoState.fullExtent = null;
            }
            if (angular.isUndefined(geoState.mapExtent)) {
                geoState.mapExtent = null;
            }
            if (angular.isUndefined(geoState.selectedBaseMapId)) {
                geoState.selectedBaseMapId = null;
            }
            if (angular.isUndefined(geoState.selectedBaseMapExtentSetId)) {
                geoState.selectedBaseMapExtentSetId = null;
            }

            // this `service` object will be exposed through `geoService`
            const service = {
                mapObject: null,
                mapManager: null, // Object

                baseMapHasSameSP,
                setZoom,
                shiftZoom,
                selectBasemap,
                setFullExtent,
                setSelectedBaseMap,
                zoomToGraphic,
            };

            return buildMapObject();

            /***/

            /**
             * Builds an actual esri map object
             * @return {Object} returns `service` object
             */
            function buildMapObject() {

                let mapObject;

                // reset before rebuilding the map if `geoState` already has an instance of mapService
                if (typeof geoState.mapService !== 'undefined') {
                    // NOTE: Possible to have dom listeners stick around after the node is destroyed
                    const mapService = geoState.mapService;
                    mapService.mapObject.destroy();
                    mapService.mapManager.ScalebarControl.destroy();
                    mapService.mapManager.OverviewMapControl.destroy();
                    mapService.mapObject = null;
                }

                // set selected base map id
                if (!geoState.selectedBaseMapId) {
                    setSelectedBaseMap(config.baseMaps[0].id, config);
                }

                // FIXME remove the hardcoded settings when we have code which does this properly
                mapObject = gapiService.gapi.mapManager.Map(geoState.mapNode, {

                    // basemap: 'gray',
                    extent: geoState.mapExtent,
                    zoom: 6,
                    center: [-100, 50]
                });

                // store map object in service
                service.mapObject = mapObject;

                if (config.services && config.services.proxyUrl) {
                    gapiService.gapi.mapManager.setProxy(config.services.proxyUrl);
                }

                // setup map using configs
                // FIXME: I should be migrated to the new config schema when geoApi is updated
                const mapSettings = {
                    basemaps: [],
                    scalebar: {},
                    overviewMap: {}
                };

                if (config.baseMaps) {
                    mapSettings.basemaps = config.baseMaps;
                }

                if (config.map.components.scaleBar) {
                    mapSettings.scalebar = {
                        attachTo: 'bottom-left',
                        scalebarUnit: 'dual'
                    };
                }

                if (config.map.components.overviewMap && config.map.components.overviewMap.enabled) {

                    // FIXME: overviewMap has more settings
                    mapSettings.overviewMap = config.map.components.overviewMap;
                }

                if (config.map.extentSets) {
                    initMapFullExtent();
                }

                service.mapManager = gapiService.gapi.mapManager.setupMap(mapObject, mapSettings);
                service.mapManager.BasemapControl.setBasemap(geoState.selectedBaseMapId);

                // FIXME temp link for debugging
                window.FGPV = {
                    layers: service.layers
                };

                // store service in geoState
                geoState.mapService = service;

                return service;
            }

            /*
             * Retrieve full extent from extentSets
             * @private
             */
            function getFullExtFromExtentSets(extentSets) {

                // FIXME: default basemap should be indicated in the config as well
                // const currentBasemapExtentSetId = '123456789';

                // In configSchema, at least one extent for a basemap
                const extentSetForId = extentSets.find(extentSet => {
                    if (extentSet.id === geoState.selectedBaseMapExtentSetId) {
                        return true;
                    }
                });

                // no matching id in the extentset
                if (angular.isUndefined(extentSetForId)) {
                    throw new Error('could not find an extent set with matching id.');
                }

                // find the full extent type from extentSetForId
                const lFullExtent = (extentSetForId.full) ? extentSetForId.full :
                    (extentSetForId.default) ? extentSetForId.default :
                    (extentSetForId.maximum) ? extentSetForId.maximum : null;

                return lFullExtent;
            }

            /**
             * Switch basemap based on the uid provided.
             * @param {string} id identifier for a specific basemap layerbower
             */
            function selectBasemap(id) {
                const mapManager = service.mapManager;

                // const map = service.mapObject;

                if (typeof mapManager === 'undefined' || !mapManager.BasemapControl) {
                    console.error('Error: Map manager or basemap control is not setup,' +
                        ' please setup map manager by calling setupMap().');
                } else {

                    // mapManager.BasemapControl.setBasemap(id);
                    const newBaseMap = getBaseMapConfig(id, config);
                    const oldBaseMap = getBaseMapConfig(geoState.selectedBaseMapId, config);

                    if (newBaseMap.wkid === oldBaseMap.wkid) {

                        console.log('base map has same wkid, new: ' + newBaseMap.wkid);
                        mapManager.BasemapControl.setBasemap(id);

                    } else {

                        // extent is different, build the map again
                        console.log('base map has different wkid: ' + newBaseMap.wkid);
                        setSelectedBaseMap(id, config);
                    }

                }
            }

            /*
            * check to see if given basemap id has same wkid value
            * @param {id} base map id
            * @retur {bool} true if current basemap has the same wkid as the previous one
            */
            function baseMapHasSameSP(id) {

                const newBaseMap = getBaseMapConfig(id, config);
                const oldBaseMap = getBaseMapConfig(geoState.selectedBaseMapId, config);

                return (newBaseMap.wkid === oldBaseMap.wkid);

            }

            /**
             * Sets zoom level of the map to the specified level
             * @param {number} value a zoom level number
             */
            function setZoom(value) {
                service.mapObject.setZoom(value);
            }

            /**
             * Changes the zoom level by the specified value relative to the current level; can be negative
             * @param  {number} byValue a number of zoom levels to shift by
             */
            function shiftZoom(byValue) {
                const map = service.mapObject;
                let newValue = map.getZoom() + byValue;
                map.setZoom(newValue);
            }

            /**
             * Set the map to full extent
             */
            function setFullExtent() {
                const map = service.mapObject;
                if (geoState.fullExtent) {
                    map.setExtent(geoState.fullExtent);
                } else {
                    console.warn('GeoService: fullExtent value is not set.');
                }
            }

            // only handles feature layers right now. zoom to dynamic/wms layers obj won't work
            /**
             * Fetches a point in a layer given the layerUrl and objId of the object and then zooms to it
             * @param  {layerUrl} layerUrl is the URL that the point to be zoomed to belongs to
             * @param  {layer} layer is the layer object of graphic to zoom
             * @param  {objId} objId is ID of object that was clicked on datatable to be zoomed to
             */
            function zoomToGraphic(layerUrl, layer, objId) {
                const map = service.mapObject;

                // FIXME: support file based layers with no url
                const geo = gapiService.gapi.layer.getFeatureInfo(layerUrl, objId);
                console.log('enhance ', layer, objId);
                geo.then(geoInfo => {
                    if (geoInfo) {
                        // make new graphic with proper spatialReference
                        geoInfo.feature.geometry.spatialReference = layer.spatialReference;
                        const newg = gapiService.gapi.proj.Graphic({
                            geometry: geoInfo.feature.geometry,
                            attributes: geoInfo.feature.attributes
                        });

                        // reproject graphic to spatialReference of the map
                        const gextent = gapiService.gapi.proj.localProjectExtent(
                            gapiService.gapi.proj.graphicsUtils.graphicsExtent([newg]),
                            map.spatialReference);

                        // need to make new esri extent to use getCenter function
                        const newExt = gapiService.gapi.mapManager.Extent(gextent.x1, gextent.y1,
                            gextent.x0, gextent.y0, gextent.sr);

                        // zoom to the new point from spatialreference
                        // FIXME: change config/schema to support zoom level
                        const newpt = newExt.getCenter();
                        map.centerAndZoom(newpt, 0.5);
                    }
                });
            }

            /*
            * Sets the current selected map id and extent set id, creates the fullExtent
            * @param {id} base map id
            */
            function setSelectedBaseMap(id) {

                console.log('setSelectdBaseMap, basemapId:' + id);

                geoState.selectedBaseMapId = id;

                const selectedBaseMap = config.baseMaps.find(baseMap => {
                    return (baseMap.id === geoState.selectedBaseMapId);
                });

                geoState.selectedBaseMapExtentSetId = selectedBaseMap.extentId;

                const fullExtentJson = getFullExtFromExtentSets(config.map.extentSets);
                geoState.mapExtent = gapiService.gapi.mapManager.Extent(fullExtentJson);

                console.log('finish setSelectdBaseMap');

            }

            /*
            * Initialize map full extent
            * @private
            */
            function initMapFullExtent() {
                const lFullExtent = getFullExtFromExtentSets(config.map.extentSets);
                const map = service.mapObject;

                setMapLoadingFlag(true);

                // map extent is not available until map is loaded
                if (lFullExtent) {
                    gapiService.gapi.events.wrapEvents(map, {
                        load: () => {

                            // compare map extent and setting.extent spatial-references
                            // make sure the full extent has the same spatial reference as the map
                            if (gapiService.gapi.proj.isSpatialRefEqual(map.extent
                                    .spatialReference,
                                    lFullExtent.spatialReference)) {

                                // same spatial reference, no reprojection required
                                geoState.fullExtent = gapiService.gapi.mapManager.getExtentFromJson(
                                    lFullExtent);
                            } else {

                                // need to re-project
                                geoState.fullExtent = gapiService.gapi.proj.projectEsriExtent(
                                    gapiService.gapi.mapManager.getExtentFromJson(
                                        lFullExtent),
                                    map.extent.spatialReference);
                            }

                            setMapLoadingFlag(false);
                        },
                        'update-start': () => {
                            console.log('   Map update START!');

                            setMapLoadingFlag(true, 300);
                        },
                        'update-end': () => {
                            console.log('   Map update END!');

                            setMapLoadingFlag(false, 100);
                        }
                    });
                }
            }

            /*
             * Get basemap config from basemap id
             * @private
             * @param id base Map id
             * @param config config object
             * @return {object} base map json object
             */
            function getBaseMapConfig(id) {
                return config.baseMaps.find(basemapConfig => (basemapConfig.id === id));
            }

            /**
             * Sets `isMapLoading` flag indicating map layers are updating.
             * @param {Boolean} isLoading defaults to true; flag indicating if one or more layers begins updating their content
             * @param {Number}  delay     defaults to 0; delay before setting `isMapLoading` state; useful to avoid setting indicator for a small amounts of time
             * @private
             */
            function setMapLoadingFlag(isLoading = true, delay = 0) {
                // need to wrap this in a timeout since these are esri events, Angular wouldn't pick up on any changes unless a new digest cycle is triggered
                $timeout.cancel(service.loadingTimeout);
                service.loadingTimeout = $timeout(() => service.mapObject.isMapLoading = isLoading, delay);
            }
        }
    }
})();
