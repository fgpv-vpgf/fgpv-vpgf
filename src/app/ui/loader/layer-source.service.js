/**
 * @module layerSource
 * @memberof app.ui
 * @requires dependencies
 * @description
 *
 * The `layerSource` service returns a collection of file option classes. These specify user selectable options when importing layer.
 *
 */
angular
    .module('app.ui')
    .factory('layerSource', layerSource);

function layerSource($q, gapiService, Geo, LayerSourceInfo, ConfigObject, configService) {
    const ref = {
        idCounter: 0, // layer counter for generating layer ids
        serviceType: Geo.Service.Types
    }

    const service = {
        fetchServiceInfo,
        fetchFileInfo
    };

    const geoServiceTypes = Geo.Service.Types;

    return service;

    /**
     * Get service info from the supplied url. Service info usually include information like service type, name, available fields, etc.
     * TODO: there is a lot of workarounds since wms layers need special handling, and it's not possible to immediately detect if the layer is not a service endpoint .
     *
     * @function fetchServiceInfo
     * @param {String} serviceUrl a service url to load
     * @return {Promise} a promise resolving with an array of at least one LayerSourceInfo objects; will reject if there is an error accessing the service or parsing its response;
     */
    function fetchServiceInfo(serviceUrl) {
        const matrix = {
            [geoServiceTypes.FeatureService]: () =>
                [_parseAsFeature],

            [geoServiceTypes.ImageService]: () =>
                [_parseAsImage],

            [geoServiceTypes.DynamicService](serviceInfo) {
                const defaultSet = [
                    _parseAsDynamic
                ];

                const subMatrix = {
                    get [geoServiceTypes.FeatureLayer]() {
                        // adding as Feature layer is the first option
                        return [_parseAsFeature].concat(defaultSet);
                    },
                    [geoServiceTypes.RasterLayer]: defaultSet,
                    [geoServiceTypes.GroupLayer]: defaultSet
                };

                if (serviceInfo.tileSupport) {
                    defaultSet.push(_parseAsTile);
                }

                if (serviceInfo.index !== -1) {
                    return subMatrix[serviceInfo.indexType];
                } else {
                    return defaultSet;
                }

            }
        };

        // check if it's a WMS first
        const fetchPromise = gapiService.gapi.layer.ogc.parseCapabilities(serviceUrl)
            .then(data => {
                if (data.layers.length > 0) { // if there are layers, it's a wms layer
                    return _parseAsWMS(serviceUrl, data);
                } else {
                    return gapiService.gapi.layer.predictLayerUrl(serviceUrl).then(serviceInfo =>
                        _parseAsSomethingElse(serviceInfo));
                }
            })
            .then(options => ({
                options,
                preselectedIndex: 0
            }))
            .catch(error =>
                $q.reject(error));

        return fetchPromise;

        /**
         * @function _parseAsSomethingElse
         * @private
         * @param {Object} serviceInfo info object from geoApi prediction function
         * @return {Promise} a promsie resolving with an array of at least one LayerSourceInfo objects
         */
        function _parseAsSomethingElse(serviceInfo) {
            if (serviceInfo.serviceType === geoServiceTypes.Error) {
                // this is not a service URL;
                // in some cases, if URL is not a service URL, dojo script used to interogate the address
                // will throw a page-level error which cannot be caught; in such cases, it's not clear to the user what has happened;
                // timeout error will eventually be raised and this block will trigger
                // TODO: as a workaround, block continue button until interogation is complete so users can't click multiple times, causing multiple checks
                return $q.reject(serviceInfo); // reject promise if the provided url cannot be accessed
            }

            const parsingPromise = matrix[serviceInfo.serviceType](serviceInfo).map(layerInfoBuilder =>
                layerInfoBuilder(serviceUrl, serviceInfo));

            return parsingPromise;
        }

        /**
         * Parses the supplied service url as if it's a WMS service.
         *
         * @function _parseAsWMS
         * @private
         * @param {String} url a service url to be used
         * @param {Object} data parsed WMS capabilities data from the geoApi call
         * @return {Promise} a promsie resolving with an array of a singe LayerSourceInfo.WMSServiceInfo object
         */
        function _parseAsWMS(url, data) {
            console.log('layerBlueprint', `the url ${url} is a WMS`);

            // it is mandatory to set featureInfoMimeType attribute to get fct identifyOgcWmsLayer to work.
            // get the first supported format available in the GetFeatureInfo section of the Capabilities XML.
            const formatType = Object.values(data.queryTypes)
                .filter(format =>
                    typeof format === 'string')
                .find(format =>
                    format in Geo.Layer.Ogc.INFO_FORMAT_MAP);

            const wmsLayerList = _flattenWmsLayerList(data.layers)
                // filter out all sublayers with no id/name (they can't be targeted and probably have no legend)
                .filter(layerEntry => layerEntry.id)
                .map((layerEntry, index) => {
                    layerEntry.index = index;
                    return new ConfigObject.layers.WMSLayerEntryNode(layerEntry);
                });

            const layerConfig = new ConfigObject.layers.WMSLayerNode({
                id: `${Geo.Layer.Types.OGC_WMS}#${++ref.idCounter}`,
                url: url,
                layerType: Geo.Layer.Types.OGC_WMS,
                name: data.serviceName || url,
                layerEntries: [],
                featureInfoMimeType: formatType,
                state: {
                    userAdded: true
                }
            });

            const layerInfo = new LayerSourceInfo.WMSServiceInfo(layerConfig, wmsLayerList);

            return [layerInfo];
        }

        /**
         * Parses the supplied service url as if it's a Feature service.
         *
         * @function _parseAsFeature
         * @private
         * @param {String} url a service url to be used
         * @param {Object} data service info data from the geoApi predition call
         * @return {Promise} a promsie resolving with a LayerSourceInfo.FeatureServiceInfo object
         */
        function _parseAsFeature(url, data) {
            const layerConfig = new ConfigObject.layers.FeatureLayerNode({
                id: `${Geo.Layer.Types.ESRI_FEATURE}#${++ref.idCounter}`,
                url: url,
                layerType: Geo.Layer.Types.ESRI_FEATURE,
                name: data.serviceName,
                state: {
                    userAdded: true
                }
            });

            const layerInfo = new LayerSourceInfo.FeatureServiceInfo(layerConfig, data.fields);

            return layerInfo;
        }

        /**
         * Parses the supplied service url as if it's a Dynamic service.
         *
         * @function _parseAsDynamic
         * @private
         * @param {String} url a service url to be used
         * @param {Object} data service info data from the geoApi predition call
         * @return {Promise} a promsie resolving with a LayerSourceInfo.DynamicServiceInfo object
         */
        function _parseAsDynamic(url, data) {
            const dynamicLayerList = _flattenDynamicLayerList(data.layers)
                .map(layerEntry =>
                    (new ConfigObject.layers.DynamicLayerEntryNode(layerEntry)));

            const layerConfig = new ConfigObject.layers.DynamicLayerNode({
                id: `${Geo.Layer.Types.ESRI_DYNAMIC}#${++ref.idCounter}`,
                url: data.index !== -1 ? data.rootUrl : url,
                layerType: Geo.Layer.Types.ESRI_DYNAMIC,
                name: data.serviceName,
                layerEntries: [],
                state: {
                    userAdded: true
                }
            });

            if (data.index !== -1) {
                layerConfig.layerEntries = [dynamicLayerList.find(layerEntry =>
                    layerEntry.index === data.index)];
                layerConfig.singleEntryCollapse = true;
            }

            const layerInfo = new LayerSourceInfo.DynamicServiceInfo(layerConfig, dynamicLayerList);

            return layerInfo;
        }

        /**
         * Parses the supplied service url as if it's a Tile service.
         *
         * @function _parseAsTile
         * @private
         * @param {String} url a service url to be used
         * @param {Object} data service info data from the geoApi predition call
         * @return {Promise} a promsie resolving with a LayerSourceInfo.TileServiceInfo object
         */
        function _parseAsTile(url, data) {
            const layerConfig = new ConfigObject.layers.BasicLayerNode({
                id: `${Geo.Layer.Types.ESRI_TILE}#${++ref.idCounter}`,
                url: data.rootUrl, // tile will display all the sublayers, even if the url was pointing to a child
                layerType: Geo.Layer.Types.ESRI_TILE,
                name: data.serviceName,
                state: {
                    userAdded: true
                }
            });

            const layerInfo = new LayerSourceInfo.TileServiceInfo(layerConfig);

            return layerInfo;
        }

        /**
         * Parses the supplied service url as if it's a Image service.
         *
         * @function _parseAsImage
         * @private
         * @param {String} url a service url to be used
         * @param {Object} data service info data from the geoApi predition call
         * @return {Promise} a promsie resolving with a LayerSourceInfo.ImageServiceInfo object
         */
        function _parseAsImage(url, data) {
            const layerConfig = new ConfigObject.layers.BasicLayerNode({
                id: `${Geo.Layer.Types.ESRI_IMAGE}#${++ref.idCounter}`,
                url: url,
                layerType: Geo.Layer.Types.ESRI_IMAGE,
                name: data.serviceName,
                state: {
                    userAdded: true
                }
            });

            const layerInfo = new LayerSourceInfo.ImageServiceInfo(layerConfig);

            return layerInfo;
        }

        /**
         * This flattens wms array hierarchy into a flat list to be displayed in a drop down selector
         * @param  {Array} layers array of layer objects
         * @param  {Number} level  [optional=0] tells how deep the layer is in the hierarchy
         * @return {Array}        layer list
         */
        function _flattenWmsLayerList(layers, level = 0) {
            return [].concat.apply([], layers.map(layer => {
                layer.level = level;
                layer.indent = Array.from(Array(level)).fill('-').join('');
                layer.id = layer.name

                if (layer.layers.length > 0) {
                    return [].concat(layer, _flattenWmsLayerList(layer.layers, level + 1));
                } else {
                    return layer;
                }
            }));
        }

        /**
         * This calculates relative depth of the dynamic layer hierarchy on the provided flat list of layers
         * @param {Array} layers array of layer objects
         * @return {Array} layer list
         */
        function _flattenDynamicLayerList(layers) {
            return layers.map(layer => {
                const level = calculateLevel(layer, layers);

                layer.level = level;
                layer.indent = Array.from(Array(level)).fill('-').join('');
                layer.index = layer.id;

                return layer;
            });

            function calculateLevel(layer, layers) {
                if (layer.parentLayerId === -1) {
                    return 0;
                } else {
                    return calculateLevel(layers[layer.parentLayerId], layers) + 1;
                }
            }
        }
    }

    /**
     *
     * @function fetchFileInfo
     * @param {String} path a file path, either from the local filesystem or an absolute url
     * @param {ArrayBuffer} arrayBuffer raw file data
     * @return {Promise} a promise resolving with an array of three LayerSourceInfo objects; one for each supported file types: CSV, GeoJSON, ShapeFile; will reject if there is an error accessing the service or parsing its response;
     */
    function fetchFileInfo(path, arrayBuffer) {
        // convert forward slashes to backward slashes and poop the file name
        const fileName = path.replace(/\\/g, '/').split('/').pop();

        const fetchPromise = gapiService.gapi.layer.predictFileUrl(fileName).then(fileInfo => {
            // fileData is returned only if path is a url; if it's just a file name, only serviceType is returned
            // this.fileData = fileInfo.fileData;
            this.layerType = Geo.Layer.Types.ESRI_FEATURE;
            this.fileType = fileInfo.serviceType;

            // error type means the file cannot be accessed
            if (this.fileType === Geo.Service.Types.Error) {
                throw new Error('Cannot retrieve file data');
            }

            const layerConfig = new ConfigObject.layers.FeatureLayerNode({
                id: `${Geo.Layer.Types.ESRI_FEATURE}-file#${++ref.idCounter}`,
                url: path,
                layerType: Geo.Layer.Types.ESRI_FEATURE,
                name: fileName,
                state: {
                    userAdded: true
                }
            });

            const targetWkid = configService.getSync.map.instance.spatialReference.wkid

            // upfront validation is expensive and time consuming - create all file options and let the user decide, then validate
            const fileInfoOptions = [
                new LayerSourceInfo.CSVFileInfo(layerConfig, arrayBuffer, targetWkid),
                new LayerSourceInfo.GeoJSONFileInfo(layerConfig, arrayBuffer, targetWkid),
                new LayerSourceInfo.ShapefileFileInfo(layerConfig, arrayBuffer, targetWkid)
            ];

            const preselectedIndex = fileInfo.serviceType ?
                fileInfoOptions.findIndex(option =>
                    option.type === fileInfo.serviceType) :
                0;

            return {
                options: fileInfoOptions,
                preselectedIndex
            };
        });

        return fetchPromise;
    }
}
