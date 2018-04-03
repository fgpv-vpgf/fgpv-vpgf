var epsgExt = (() => {
    return {
        preInit: () => {
            const lookup = (code => {
                const urnRegex = /urn:ogc:def:crs:EPSG::(\d+)/;
                const epsgRegex = /EPSG:(\d+)/;
                let lookup = code;
                if (typeof lookup === 'number') {
                    lookup = String(lookup);
                }
                const urnMatches = lookup.match(urnRegex);
                if (urnMatches) {
                    lookup = urnMatches[1];
                }
                const epsgMatches = lookup.match(epsgRegex);
                if (epsgMatches) {
                    lookup = epsgMatches[1];
                }

                return $http.get(`http://epsg.io/${lookup}.proj4`)
                    .then(response =>
                        response.data)
                    .catch(err => {
                        RV.logger.warn('geoService', 'proj4 style projection lookup failed with error', err);
                        // jscs check doesn't realize return null; returns a promise
                        return null; // jscs:ignore jsDoc
                });
            });
            console.log('Extension: epsgLookup pre-initialized');
            return lookup;
        },
        init: mApi => {
            console.log('Extension: epsgLookup initialized');
        }
    }
})();

var dataTableExt = (() => {
    return {
        preInit: () => {
            console.log('Extension: dataTable pre-initialized');
        },
        init: () => {
            console.log('Extension: dataTable initialized');
        }
    }
})();
