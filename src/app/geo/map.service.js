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

    function mapServiceFactory($q, gapiService,  configService, layerRegistry, identifyService) {
        return mapService;

        function mapService(geoState, config) {
            const ref = {
                fullExtent: null, // Object

                mapExtent: null,
                selectedBaseMapId: null,
                selectedBaseMapExtentSetId: null
            };

            // this `service` object will be exposed through `geoService`
            const service = {
                mapObject: null,
                mapManager: null, // Object

                baseMapHasSameSP,
                setZoom,
                shiftZoom,
                selectBasemap,
                setFullExtent,
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
                if (!ref.selectedBaseMapId) {
                    ref.mapExtent = setSelectedBaseMap(config.baseMaps[0].id, config);
                }

                // FIXME remove the hardcoded settings when we have code which does this properly
                mapObject = gapiService.gapi.mapManager.Map(geoState.mapNode, {

                    // basemap: 'gray',
                    extent: ref.mapExtent,
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
                    initMapFullExtent(config);
                }

                // TODO: move to gapi?
                service.mapManager.BasemapControl.basemapGallery.on('selection-change', () => {
                    service.mapManager.OverviewMapControl.destroy();

                    // setup expandFactor to 1, by default it's 2. and most of the time overview map
                    // show a blank page until we zoom in to certain extent
                    service.mapManager.OverviewMapControl =  gapiService.gapi.mapManager.OverviewMap({
                        map: mapObject,
                        expandFactor: 1,
                        visible: true
                    });

                    service.mapManager.OverviewMapControl.startup();
                });

                service.mapManager = gapiService.gapi.mapManager.setupMap(mapObject, mapSettings);
                service.mapManager.BasemapControl.setBasemap(ref.selectedBaseMapId);

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
             * [private]
             */
            function getFullExtFromExtentSets(extentSets) {

                // FIXME: default basemap should be indicated in the config as well
                // const currentBasemapExtentSetId = '123456789';

                // In configSchema, at least one extent for a basemap
                const extentSetForId = extentSets.find(extentSet => {
                    if (extentSet.id === ref.selectedBaseMapExtentSetId) {
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
                    configService.getCurrent()
                    .then(config => {
                        const newBaseMap = getBaseMapConfig(id, config);
                        const oldBaseMap = getBaseMapConfig(ref.selectedBaseMapId, config);

                        if (newBaseMap.wkid === oldBaseMap.wkid) {

                            console.log('base map has same wkid, new: ' + newBaseMap.wkid);
                            mapManager.BasemapControl.setBasemap(id);

                        } else {

                            // extent is different, build the map again
                            console.log('base map has different wkid: ' + newBaseMap.wkid);
                            ref.mapExtent = setSelectedBaseMap(id, config);

                            reAssembleMap();
                        }
                    });

                }
            }

            /*
            * check to see if given basemap id has same wkid value
            * @param {id} base map id
            * @retur {bool} true if current basemap has the same wkid as the previous one
            */
            function baseMapHasSameSP(id) {

                configService.getCurrent()
                    .then(config => {
                        const newBaseMap = getBaseMapConfig(id, config);
                        const oldBaseMap = getBaseMapConfig(ref.selectedBaseMapId, config);

                        return (newBaseMap.wkid === oldBaseMap.wkid);
                    });

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
                if (ref.fullExtent) {
                    map.setExtent(ref.fullExtent);
                } else {
                    console.warn('GeoService: fullExtent value is not set.');
                }
            }

            // only handles feature layers right now. zoom to dynamic/wms layers obj won't work
            /**
             * Fetches a point in a layer given the layerUrl and objId of the object and then zooms to it
             * @param  {layerUrl} layerUrl is the URL that the point to be zoomed to belongs to
             * @param  {objId} objId is ID of object that was clicked on datatable to be zoomed to
             */
            function zoomToGraphic(layerUrl, objId) {
                const map = service.mapObject;
                const geo = gapiService.gapi.layer.getFeatureInfo(layerUrl, objId);
                geo.then(geoInfo => {
                    if (geoInfo) {
                        map.centerAndZoom(geoInfo.feature.geometry, 10);
                    }
                });
            }

            /*
            * Sets the current selected map id and extent set id, creates the fullExtent
            * [private]
            * @param {id} base map id
            * @param {config} json config settings
            */
            function setSelectedBaseMap(id, config) {

                ref.selectedBaseMapId = id;

                const selectedBaseMap = config.baseMaps.find(baseMap => {
                    return (baseMap.id === ref.selectedBaseMapId);
                });

                ref.selectedBaseMapExtentSetId = selectedBaseMap.extentId;

                const fullExtentJson = getFullExtFromExtentSets(config.map.extentSets);
                const extent = gapiService.gapi.mapManager.Extent(fullExtentJson);

                return extent;
            }

            /*
            * Initialize map full extent
            * [private]
            * @param {config} config object
            */
            function initMapFullExtent(config) {
                let lFullExtent = getFullExtFromExtentSets(config.map.extentSets);
                const map = service.mapObject;

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
                                ref.fullExtent = gapiService.gapi.mapManager.getExtentFromJson(
                                    lFullExtent);
                            } else {

                                // need to re-project
                                ref.fullExtent = gapiService.gapi.proj.projectEsriExtent(
                                    gapiService.gapi.mapManager.getExtentFromJson(
                                        lFullExtent),
                                    map.extent.spatialReference);
                            }
                        }
                    });
                }
            }

            /*
             * Get basemap config from basemap id
             * [private]
             * @param id base Map id
             * @param config config object
             * @return {object} base map json object
             */
            function getBaseMapConfig(id, config) {

                // return configService.getCurrent()
                //     .then(config => {
                //         return config.baseMaps.find(basemapConfig => {
                //             return (basemapConfig.id === id);
                //         });
                //     });
                return config.baseMaps.find(basemapConfig => {
                    return (basemapConfig.id === id);
                });
            }

            /*
            * Re-assemble map object
            * [private]
            */
            function reAssembleMap() {
                // TODO: please review!, cannot call assembleMap in map service
                // where selection of basemap detects different spatial reference

                buildMapObject()
                .then(ms => {
                    // expose mapService on geoService
                    angular.extend(service, ms);
                    return layerRegistry(geoState);
                })
                .then(lr => {
                    // expose layerRegistry service on geoService
                    angular.extend(service, lr);
                    return identifyService(geoState);
                })
                .then(id => {
                    // expose identifyService on geoService
                    angular.extend(service, id);
                    service.state = geoState; // store geo state
                    service.isMapReady = true;

                    return service;
                })
                .catch(error => {
                    console.error('Failed to assemble the map');
                    console.error(error);
                });
            }

        }
    }
})();
