'use strict';
const basemap = require('./basemap.js');
const mapPrint = require('./print.js');

function esriMap(esriBundle, geoApi) {

    const printModule = mapPrint(esriBundle);

    let basemapErrored = false;

    let basemaps = null;
    let corsEverywhere = false;
    let overviewExpand = null;

    class Map {

        static get Extent () { return esriBundle.Extent; }

        // TODO when jshint parses instance fields properly we can change this from a property to a field
        get _passthroughBindings () { return [
            'addLayer', 'centerAndZoom', 'centerAt', 'destroy', 'disableKeyboardNavigation', 'getLevel',
            'getScale', 'on', 'removeLayer', 'reorderLayer', 'reposition', 'resize', 'setExtent',
            'setMapCursor', 'setScale', 'setZoom', 'toMap', 'toScreen'
        ]; }
        get _passthroughProperties () { return [
            'attribution', 'extent', 'graphicsLayerIds', 'height', 'layerIds', 'spatialReference', 'width'
        ]; } // TODO when jshint parses instance fields properly we can change this from a property to a field

        /*
         * Option params
         * - basemaps: array of basemap options.  See config schema baseMapNode
         * - scalebar: object to show scalebar. Has .enabled property, and optional .attachTo and .scalebarUnit properties
         * - overviewMap: object to show overview map. Has .enabled and .expandFactor properties
         * - extent: extent object for initial extent
         * - lods: array of level of details. See config schema lodSetNode.lods
         * - tileSchema: object describing schema of map. See config schema tileSchemaNode
         * - proxyUrl: url to proxy for use by mapping api. optional
         * - corsEverywhere: boolean to be set if every layer on the map is CORS enabled, mutually exclusive with proxyUrl, optional
         *
         * @param {Object} domNode  the DOM node where the map will be created
         * @param {Object} opts     options object for the map (see above)
         */
        constructor (domNode, opts) {

            this._passthroughBindings.forEach(bindingName =>
                this[bindingName] = (...args) => this._map[bindingName](...args));
            this._passthroughProperties.forEach(propName => {
                const descriptor = {
                    enumerable: true,
                    get: () => this._map[propName]
                };
                Object.defineProperty(this, propName, descriptor);
            });

            this._map = new esriBundle.Map(domNode, {
                extent: Map.getExtentFromJson(opts.extent),
                lods: opts.lods,
                fitExtent: true
            });
            if (opts.proxyUrl) {
                this.proxy = opts.proxyUrl;
            }
            if (opts.corsEverywhere) {
                if (this.corsEverywhere === true && this.proxy) {
                    throw new Error('proxyUrl and corsEverywhere are mutually exclusive');
                }
                corsEverywhere = opts.corsEverywhere;
            }

            if (opts.basemaps) {
                basemaps = opts.basemaps;
                basemaps.forEach(bm => {
                    bm._layers.forEach(l => this.checkCorsException(l.url));
                })
            } else {
                throw new Error('The basemaps option is required to and at least one basemap must be defined');
            }

            if (opts.scalebar && opts.scalebar.enabled) {
                this.scalebar = new esriBundle.Scalebar({
                    map: this._map,
                    attachTo: opts.scalebar.attachTo,
                    scalebarUnit: opts.scalebar.scalebarUnit
                });
                this.scalebar.show();
            }

            if (opts.overviewMap && opts.overviewMap.enabled) {
                overviewExpand = opts.overviewMap.expandFactor;

                if (opts.tileSchema.overviewUrl) {
                    // initial implementation.  we only are supporting tile layers.
                    // if we want to enhance to have other layer types, will need to determine
                    // how to go about it. we could just use raw objects in a switch statement here,
                    // or attempt to wire in the layer records.
                    this.checkCorsException(opts.tileSchema.overviewUrl.url);
                    this.defaultOverview = false;
                    const customOverview = new esriBundle.ArcGISTiledMapServiceLayer(opts.tileSchema.overviewUrl.url);
                    customOverview.on('load', () => {
                        this.initOverviewMap(overviewExpand, customOverview);
                    });
                } else {
                    // we use the active basemap, and reset the overview whenever it changes
                    this.defaultOverview = true;
                    this.initOverviewMap(overviewExpand);
                }
            }

            this.zoomPromise = Promise.resolve();
            this.zoomCounter = 0;

        }

        checkCorsException(url) {
            // TODO: remove the check for WMS in here before merging. This is for
            // testing purposes.
            if (corsEverywhere) {
                const hostRegex = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?([^:\/\n]+)/i;
                const match = hostRegex.exec(url);
                if (match !== null) {
                    const hostname = match[1];
                    if (esriBundle.esriConfig.defaults.io.corsEnabledServers.indexOf(hostname) < 0) {
                        console.debug('layer added cors ', hostname);
                        esriBundle.esriConfig.defaults.io.corsEnabledServers.push(hostname);
                    }
                }
            }
        }

        initGallery() {
            this.basemapGallery = basemap.initBasemaps(esriBundle, basemaps, this._map);
            if (overviewExpand !== null) {
                this.basemapGallery.on('selection-change', () => {
                    if (this.defaultOverview) this.resetOverviewMap(overviewExpand)
                });
                this.basemapGallery.on('error', () => {
                    this.overviewMap.destroy();
                    basemapErrored = true;
                });
            }
        }

        printLocal (options) { return printModule.printLocal(this._map, options); }
        printServer (options) { return printModule.printServer(this._map, options); }

        /**
         * Select a basemap which has been loaded in the basemapGallery
         *
         * @param {Object|String} value either an object with an id field or a string
         */
        selectBasemap (value) {
            if (typeof value === 'object') {
                value = value.id;
            }
            this.basemapGallery.select(value);
        }

        /**
         * Remove a basemap from the basemapGallery
         *
         * @param {Object|String} value either an object with an id field or a string
         */
        removeBasemap (value) {
            if (typeof value === 'object') {
                value = value.id;
            }
            this.basemapGallery.remove(value);
        }

        /**
         * Add a basemap to the basemapGallery
         *
         * @param {Object} basemapConfig a basemap JSON snippet
         */
        addBasemap (basemapConfig) {
            const basemapToAdd = basemap.createBasemap(esriBundle, basemapConfig);
            this.basemapGallery.add(basemapToAdd);
        }

        /**
         * Create an ESRI Extent object from extent setting JSON object.
         *
         * @function getExtentFromJson
         * @param {Object} extentJson that follows config spec
         * @return {Object} an ESRI Extent object
         */
        static getExtentFromJson (extentJson) {
            return esriBundle.Extent(extentJson);
        }

        /**
         * Take a JSON object with extent properties and convert it to an ESRI Extent.
         * Reprojects to map projection if required.
         *
         * @param {Object} extent the extent to enhance
         * @returns {Extent} extent cast in Extent prototype, and in map spatial reference
         */
        enhanceConfigExtent (extent) {
            const realExtent = Map.getExtentFromJson(extent);

            if (geoApi.proj.isSpatialRefEqual(this._map.spatialReference, extent.spatialReference)) {
                return realExtent;
            } else {
                return geoApi.proj.projectEsriExtent(realExtent, this._map.spatialReference);
            }
        }

        /**
         * Takes a location object in lat/long, converts to current map spatialReference using
         * reprojection method in geoApi, and zooms to the point.
         *
         * @function zoomToLatLong
         * @param {Object} location is a location object, containing geometries in the form of { longitude: <Number>, latitude: <Number> }
         */
        zoomToPoint ({ longitude, latitude }) {

            // get reprojected point and zoom to it
            const geoPt = geoApi.proj.localProjectPoint(4326, this._map.spatialReference,
                [parseFloat(longitude), parseFloat(latitude)]);
            const zoomPt = geoApi.proj.Point(geoPt[0], geoPt[1], this._map.spatialReference);

            // give preference to the layer closest to a 50k scale ratio which is ideal for zoom
            const sweetLod = Map.findClosestLOD(this.lods, 50000);
            this._map.centerAndZoom(zoomPt, Math.max(sweetLod.level, 0));
        }

        /**
         * Zoom the map to an extent. Extent can be in different projection
         *
         * @function zoomToExtent
         * @param {Object} extent     map object we want to execute the zoom on
         * @private
         * @return {Promise} resolves when map is done zooming
         */
        zoomToExtent (extent) {
            // TODO add some caching? make sure it will get wiped if we end up changing projections
            //      or use wkid as caching key?

            const projRawExtent = geoApi.proj.localProjectExtent(extent, this._map.spatialReference);

            const projFancyExtent = esriBundle.Extent(projRawExtent.x0, projRawExtent.y0,
                projRawExtent.x1, projRawExtent.y1, projRawExtent.sr);

            return this._map.setExtent(projFancyExtent, true);
        }

        /**
         * Finds the level of detail closest to the provided scale.
         *
         * @function findClosestLOD
         * @param  {Array} lods     list of levels of detail objects
         * @param  {Number} scale   scale value to search for in the levels of detail
         * @return {Object}         the level of detail object closest to the scale
         */
        static findClosestLOD (lods, scale) {
            const diffs = lods.map(lod => Math.abs(lod.scale - scale));
            const lodIdx = diffs.indexOf(Math.min(...diffs));
            return lods[lodIdx];
        }

        /**
         * Calculate north arrow bearing. Angle returned is to to rotate north arrow image.
         * http://www.movable-type.co.uk/scripts/latlong.html
         * @function getNorthArrowAngle
         * @param {Object} opts options to apply to north arrow calculation
         * @returns {String} map rotation angle (in degree) in string format
         */
        getNorthArrowAngle (opts) {
            // get center point in longitude and use bottom value for latitude for default point
            const bottomCenter = { x: (this._map.extent.xmin + this._map.extent.xmax) / 2, y: this._map.extent.ymin };
            // get point if specified by caller else get default
            const point = opts ? opts.point || bottomCenter : bottomCenter;
            try {
                const pointB = geoApi.proj.localProjectPoint(this._map.extent.spatialReference, 'EPSG:4326', point);

                // north value (set longitude to be half of Canada extent (141° W, 52° W))
                const pointA = { x: -96, y: 90 };

                // set info on longitude and latitude
                const dLon = (pointB.x - pointA.x) * Math.PI / 180;
                const lat1 = pointA.y * Math.PI / 180;
                const lat2 = pointB.y * Math.PI / 180;

                // calculate bearing
                const y = Math.sin(dLon) * Math.cos(lat2);
                const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
                const bearing = Math.atan2(y, x) * 180 / Math.PI;

                // return angle (180 is pointiong north)
                return ((bearing + 360) % 360).toFixed(1);
            } catch(error) {
                return '180.0';
            }
        }

        /**
         * Calculate distance between min and max extent to know the pixel ratio between
         * screen size and earth distance.
         * http://www.movable-type.co.uk/scripts/latlong.html
         * @function getScaleRatio
         * @param {Number} mapWidth optional the map width to use to calculate ratio
         * @returns {Object} contain information about the scale
         *                               - distance: distance between min and max extentId
         *                               - ratio: measure for 1 pixel in earth distance
         *                               - units: array of units [metric, imperial]
         */
        getScaleRatio (mapWidth = 0) {
            const map = this._map;

            // get left and right maximum value point to calculate distance from
            const pointA = geoApi.proj.localProjectPoint(map.spatialReference, 'EPSG:4326',
                    { x: map.extent.xmin, y: (map.extent.ymin + map.extent.ymax) / 2 });
            const pointB = geoApi.proj.localProjectPoint(map.spatialReference, 'EPSG:4326',
                    { x: map.extent.xmax, y: (map.extent.ymin + map.extent.ymax) / 2 });

            // Haversine formula to calculate distance
            const R = 6371e3; // earth radius in meters
            const rad = Math.PI / 180;
            const phy1 = pointA.y * rad; // radiant
            const phy2 = pointB.y * rad; // radiant
            const deltaPhy = (pointB.y - pointA.y) * rad; // radiant
            const deltaLambda = (pointB.x - pointA.x) * rad; // radiant

            const a = Math.sin(deltaPhy / 2) * Math.sin(deltaPhy / 2) +
                        Math.cos(phy1) * Math.cos(phy2) *
                        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = (R * c);

            // set map / image width (if mapWidth = 0, use map.width)
            const width = mapWidth ? mapWidth : map.width;

            // get unit from distance, set distance and ratio (earth size for 1 pixel)
            const units = [(d > 1000) ? 'km' : 'm', (d > 1600) ? 'mi' : 'ft'];
            const distance = (d > 1000) ? d / 1000 : d;
            const ratio = distance / width;

            return { distance, ratio, units };
        }

        /**
         * Compares to sets of co-ordinates for extents (valid for both x and y). If center of input co-ordinates falls outside
         * map co-ordiantes, function will adjust them so the center is inside the map co-ordinates.
         *
         * @function clipExtentCoords
         * @private
         * @param {Numeric} mid      middle of the the range to test
         * @param {Numeric} max      maximum value of the range to test
         * @param {Numeric} min      minimum value of the range to test
         * @param {Numeric} mapMax   maximum value of the map range
         * @param {Numeric} mapMin   minimum value of the map range
         * @param {Numeric} len      length of the adjusted range, if adjusted
         * @return {Array}           two element array of Numeric, containing result max and min values
         */
        static clipExtentCoords (mid, max, min, mapMax, mapMin, len) {

            if (mid > mapMax) {
                [max, min] = [mapMax, mapMax - len];
            } else if (mid < mapMin) {
                [max, min] = [mapMin + len, mapMin];
            }
            return [max, min];
        }

        /**
         * Checks if the center of the given extent is outside of the maximum extent. If it is,
         * will determine an adjusted extent with a center inside the maximum extent.  Returns both
         * an indicator flag if an adjustment happened, and the adjusted extent.
         *
         * @function enforceBoundary
         * @param {Object} extent      an ESRI extent to test
         * @param {Object} maxExtent   an ESRI extent indicating the boundary of the map
         * @return {Object}            an object with two properties. adjusted - boolean, true if extent was adjusted. newExtent - object, adjusted ESRI extent
         */
        static enforceBoundary (extent, maxExtent) {
            // clone extent
            const newExtent = esriBundle.Extent(extent.toJson());

            // determine dimensions of adjusted extent.
            // same as input, unless input is so large it consumes max.
            // in that case, we shrink to the max. This avoids the "washing machine"
            // bug where we over-correct past the valid range,
            // and achieve infinite oscillating pans
            const height = Math.min(extent.getHeight(), maxExtent.getHeight());
            const width = Math.min(extent.getWidth(), maxExtent.getWidth());
            const center = extent.getCenter();

            [newExtent.xmax, newExtent.xmin] =
                this.clipExtentCoords(center.x, newExtent.xmax, newExtent.xmin, maxExtent.xmax, maxExtent.xmin, width);
            [newExtent.ymax, newExtent.ymin] =
                this.clipExtentCoords(center.y, newExtent.ymax, newExtent.ymin, maxExtent.ymax, maxExtent.ymin, height);

            return {
                newExtent,
                adjusted: !extent.contains(newExtent) // true if we adjusted the extent
            };
        }

        initOverviewMap (expandFactor, baseLayer) {
            if (basemapErrored) {
                basemapErrored = false;
                return;
            }
            basemapErrored = false;

            const opts = {
                map: this._map,
                expandFactor,
                visible: true
            };
            if (baseLayer) {
                opts.baseLayer = baseLayer;
            }

            let hasBaseLayer = false;
            Object.keys(opts.map._layers).forEach(id => {
                const layer = opts.map._layers[id];
                if (layer._basemapGalleryLayerType === 'basemap') {
                    hasBaseLayer = true;
                }
            });

            if (opts.baseLayer || hasBaseLayer) {
                this.overviewMap = new esriBundle.OverviewMap(opts);
                this.overviewMap.startup();
            }
        }
        resetOverviewMap (expandFactor) {
            if (this.overviewMap) {
                this.overviewMap.destroy();
            }
            this.initOverviewMap(expandFactor);
        }

        /**
         * Changes the zoom level by the specified value relative to the current level; can be negative.
         * To avoid multiple chained zoom animations when rapidly pressing the zoom in/out icons, we
         * update the zoom level only when the one before it resolves with the net zoom change.
         *
         * @function shiftZoom
         * @param  {number} byValue a number of zoom levels to shift by
         */
        shiftZoom (byValue) {
            this.zoomCounter += byValue;
            // when using keys for navigation esri throws an internal exception which cannot be caught when `centerAt` is called right after `setZoom`
            // so far, we could not reproduce it by calling these two functions manually in the console, so there must be another factor involved
            // when this internal exception is thrown, zoomPromise get's rejected
            // calling `then` on a rejected promise does not work which prevents further zoom actions triggered throught the keyboard
            // calling `catch` on a rejected promise works, and the promise can be reset
            // calling `finally` on a rejected promise works as well, and this can be used to reset the promise and trigger further zoom actions
            // NOTE: this is not an ideal solution, but unless the third factor causing errors in `centerAt/setZoom` calls can be found, the internal esri exceptions needs to be ignored
            this.zoomPromise.finally(() => {
                if (this.zoomCounter !== 0) {
                    const zoomValue = this._map.getZoom() + this.zoomCounter;
                    const zoomPromise = Promise.resolve(this.setZoom(zoomValue));
                    this.zoomCounter = 0;

                    // undefined signals we've zoomed in/out as far as we can
                    if (typeof zoomPromise !== 'undefined') {
                        this.zoomPromise = zoomPromise;
                    }
                }
            });
        }

        /**
         * Sets or gets map default config values.
         *
         * @function mapDefault
         * @param {String} key  name of the default property
         * @param {Any} [value] optional value to set for the specified default property
         */
        mapDefault (key, value) {
            if (typeof value === 'undefined') {
                return esriBundle.esriConfig.defaults.map[key];
            } else {
                esriBundle.esriConfig.defaults.map[key] = value;
            }
        }

        /**
         * Will position the map so that the target extent is in view. Offsetting is available
         * to allow the view to take into account UI elements that cover the map
         * (e.g. legend and grid are open, so want extent visible in remaining map area)
         *
         * @function moveToOffsetExtent
         * @param {Object} targetExtent     an ESRI extent to position the map to
         * @param {Object} offsetFraction   an object with decimal properties `x` and `y` indicating percentage of offsetting on each axis
         * @return {Promise}                resolves after the map is done moving
         */
        moveToOffsetExtent (targetExtent, offsetFraction) {
            const currentExtent = this.extent;

            let xOffset = currentExtent.getWidth() * -offsetFraction.x;
            let yOffset = currentExtent.getHeight() * offsetFraction.y;

            if (currentExtent.getWidth() < targetExtent.getWidth() ||
                currentExtent.getHeight() < targetExtent.getHeight()) {
                // the target extent doesn't fit in the current extent,
                // offset the target extent using provided fractions

                xOffset = targetExtent.getWidth() * -offsetFraction.x;
                yOffset = targetExtent.getHeight() * offsetFraction.y;
            }

            const point = targetExtent.getCenter();
            const offsetCenter = point.offset(xOffset, yOffset);

            return this.centerAt(offsetCenter);
        }

        /**
         * Set proxy service URL to avoid same origin issues.
         */
        set proxy (proxyUrl) { esriBundle.esriConfig.defaults.io.proxyUrl = proxyUrl; }
        get proxy () { return esriBundle.esriConfig.defaults.io.proxyUrl; }

        set basemapGallery (val) { this._basemapGallery = val; }
        get basemapGallery () { return this._basemapGallery; }

        set scalebar (val) { this._scalebar = val; }
        get scalebar () { return this._scalebar; }

        set overviewMap (val) { this._overviewMap = val; }
        get overviewMap () { return this._overviewMap; }

        // TODO an alternate approach: store opts.lods in the constructor and return that here.
        //      need to consider impact (it could be .__tileInfo adjusts to current basemap, thus
        //      preventing us from zooming to lods that have no tiles)
        get lods () { return this._map.__tileInfo.lods; }

        // use of the following property is unsupported by ramp team.
        // it is provided for plugin developers who want to write advanced geo functions
        // and wish to directly consume the esri api objects AT THEIR OWN RISK !!!  :'O  !!!
        get esriMap () { return this._map; }

    }

    return Map;
}

// provides a wrapper class for a map control.
// this file in particular wraps an esri map
module.exports = (esriBundle, geoApi) => esriMap(esriBundle, geoApi);
