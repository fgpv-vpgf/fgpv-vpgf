/**
 * @namespace geoSearch
 * @description A feature that provides geo location search
 */

import 'rz-geosearch';

const CODE_TO_ABBR = {
    10: "NL",
    11: "PE",
    12: "NS",
    13: "NB",
    24: "QC",
    35: "ON",
    46: "MB",
    47: "SK",
    48: "AB",
    59: "BC",
    60: "YU",
    61: "NT",
    62: "NU",
    72: "UF",
    73: "IW"
};

/**
 * A class/interface that wraps around a GeoSearch object and provides extra servinces.
 * It can also consume an optional config object upon creation.
 *
 * The following are the valid config object properties:
 * {
 *      excludeTypes: string | Array<string>,
 *      language: string,
 *      settings: Object,
 *      geoLocateUrl: string,
 *      geoNameUrl: string
 * }
 */
class GeoSearchUI {
    constructor(config = {}) {
        (<any>this)._geoSearhObj = new (<any>window).GeoSearch(config);
        (<any>this)._lang = (<any>config).language || 'en';
        (<any>this)._provinceList = [];
        (<any>this)._typeList = [];
        (<any>this)._excludedTypes = (<any>config).excludeTypes || [];
        (<any>this)._settings = (<any>config).settings || {};
    }

    get lang() { return (<any>this)._lang; }
    get provinceList() { return (<any>this)._provinceList; }
    get typeList() { return (<any>this)._typeList; }
    get settings() { return (<any>this)._settings; }

    set provinceList(val) { (<any>this)._provinceList = val; }
    set typeList(val) { (<any>this)._typeList = val; }

    /**
     * Find and return the province object in the province list
     *
     * @param {string} province the target province
     * @return {Object} the object of the found province object
     */
    findProvinceObj(province: string) {
        return this.fetchProvinces().find((p: any) => {
            return p.name === province;
        });
    }

    /**
     * Given some string query, returns a promise that resolves as a formated location objects
     *
     * @param {string} q the search string this query is based on
     * @return {Promise} the promise that resolves as a formated location objects
     */
    query(q: string) {
        return (<any>this)._geoSearhObj.query(q.toUpperCase()).onComplete.then((q: any) => {
            let featureResult: any[] = [];

            // need to ensure that any disabled types are not included in our results output (add constants later if required)
            if (q.featureResults) { // it is a feature query
                if (q.featureResults.fsa && !(<any>this)._excludedTypes.includes("FSA")) { // FSA query
                    const bboxRange = 0.02;
                    featureResult = [{
                        name: q.featureResults.fsa,
                        bbox: [
                            q.featureResults.LatLon.lon + bboxRange,
                            q.featureResults.LatLon.lat - bboxRange,
                            q.featureResults.LatLon.lon - bboxRange,
                            q.featureResults.LatLon.lat + bboxRange
                        ],
                        type: {
                            name: q.featureResults.desc
                        },
                        position: [q.featureResults.LatLon.lon, q.featureResults.LatLon.lat],
                        location: {
                            latitude: q.featureResults.LatLon.lat,
                            longitude: q.featureResults.LatLon.lon,
                            province: this.findProvinceObj(q.featureResults.province)
                        }
                    }];
                } else if (q.featureResults.nts && !(<any>this)._excludedTypes.includes("NTS")) {  // NTS query
                    featureResult = [{
                        name: q.featureResults.nts,
                        bbox: q.featureResults.bbox,
                        type: {
                            name: q.featureResults.desc
                        },
                        position: [q.featureResults.LatLon.lon, q.featureResults.LatLon.lat],
                        location: {
                            city: q.featureResults.location,
                            latitude: q.featureResults.LatLon.lat,
                            longitude: q.featureResults.LatLon.lon
                        }
                    }];
                }
            } else if (q.latLongResult !== undefined && !(<any>this)._excludedTypes.includes("COORD")) {
                featureResult = [q.latLongResult]
            } else if (q.scale !== undefined && !(<any>this)._excludedTypes.includes("SCALE")) {
                featureResult = q.scale;
            }
            let queryResult = q.results.map((item: any) => ({
                name: item.name,
                bbox: item.bbox,
                type: {
                    name: item.type
                },
                position: [item.LatLon.lon, item.LatLon.lat],
                location: {
                    city: item.location,
                    latitude: item.LatLon.lat,
                    longitude: item.LatLon.lon,
                    province: this.findProvinceObj(item.province)
                }
            }));
            return featureResult.concat(queryResult);
        });
    }

    /**
     * Return a list of formated province objects
     *
     * @return {Array} a list of formated province objects
     */
    fetchProvinces() {
        if (this.provinceList.length > 0) return this.provinceList; // in cache
        let provinceList = [];

        const reset = {
            code: -1,
            abbr: '...',
            name: '...'
        };
        provinceList.push(reset);

        let rawProvinces = (<any>this)._geoSearhObj.config.provinces.list;
        for (let code in rawProvinces) {
            provinceList.push({
                code: code,
                abbr: (<any>CODE_TO_ABBR)[code],
                name: rawProvinces[code]
            });
        }
        this.provinceList = provinceList;
        return this.provinceList;
    }

    /**
     * Return a list of formated type objects
     *
     * @return {Array} a list of a formated type objects
     */
    fetchTypes() {
        if (this.typeList.length > 0) return this.typeList; // in cache
        let typeList = [];

        const reset = {
            code: -1,
            name: '...'
        };
        typeList.push(reset);

        let rawTypes = (<any>this)._geoSearhObj.config.types.allTypes;
        for (let type in rawTypes) {
            if (!(<any>this)._excludedTypes.includes(type)) {
                typeList.push({
                    code: type,
                    name: rawTypes[type]
                });
            }
        }
        this.typeList = typeList;
        return this.typeList;
    }
}

export default {
    feature: 'geoSearch',
    GeoSearchUI
}
