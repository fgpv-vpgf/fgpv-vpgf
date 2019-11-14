/**
 * @namespace epsg
 * @description A feature that provides an epsg look up function
 */


/**
 * @description Lookup a proj4 style projection definition for a given ESPG code.
 * @function lookup
 * @param {string|number} code the EPSG code as a string or number
 * @return {Promise} a Promise resolving to proj4 style definition or null if the definition
 */
export default {
    feature: 'epsg',

    lookup: (code: string | number) => {
        const urnRegex = /urn:ogc:def:crs:EPSG::(\d+)/;
        const epsgRegex = /EPSG:(\d+)/;
        let matcher = String(code).match(urnRegex) || String(code).match(epsgRegex) || [];
    
        if (matcher.length < 2) {
            throw new Error('Invalid code provided.');
        }
    
        return new Promise((resolve, reject) => {
            $.get((location.protocol === 'https:' ? 'https:' : 'http:') + `//epsg.io/${matcher[1]}.proj4`)
                .done(resolve)
                .fail(reject);
        });
    }
}
