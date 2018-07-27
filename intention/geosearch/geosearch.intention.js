/**
 * @namespace geoSearch
 * @description An intention that provides geo location search
 */

import 'rz-geosearch';

const CODE_TO_ABBR = ({"10":"NL","11":"PE","12":"NS","13":"NB",
                        "24":"QC","35":"ON","46":"MB","47":"SK",
                        "48":"AB","59":"BC","60":"YU","61":"NT",
                        "62":"NU","72":"UF","73":"IW"});

/**
 * A class/interface that wraps around a GeoSearch object and provides extra servinces.
 * It can also consume an optional config object upon creation.
 *
 * The fellowing are the valid config objec properties:
 * {
 *      includeTypes: string | Array<string>,
 *      excludeTypes: string | Array<string>,
 *      language: string,
 *      maxResults: number,
 *      geoLocateUrl: string,
 *      geoNameUrl: string
 * }
 */
class GeoSearchUI {
    constructor(config={}) {
        this._geoSearhObj = new GeoSearch(config);
        this._lang = config.language || 'en';
        this._provinceList = [];
        this._typeList = [];
    }

    get lang() { return this._lang; }
    get provinceList() { return this._provinceList; }
    get typeList() { return this._typeList; }

    set provinceList(val) { this._provinceList = val; }
    set typeList(val) { this._typeList = val; }

    /**
     * Find and return the province object in the province list
     *
     * @param {string} province the target province
     * @return {Object} the object of the found province object
     */
    findProvinceObj(province) {
        if (this.provinceList.length > 0) { // is in cache
            return this.provinceList.find(p => {
                return p.name === province;
            });
        } else {
            this.fetchProvinces().then(provinceList => {
                return provinceList.find(p => {
                    return p.name === province;
                });
            });
        }
    }

    /**
     * Given some string query, returns a promise that resolves as a formated location objects
     *
     * @param {string} q the search string this query is based on
     * @return {Promise} the promise that resolves as a formated location objects
     */
    query(q) {
        return new Promise((resolve) => {
            this._geoSearhObj.query(q.toUpperCase()).onComplete.then(q => {
                let featureResult = [];
                let results = [];
                if (q.featureResults) { // it is a feature query
                    if (q.featureResults.fsa) { // FSA query
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
                    } else if (q.featureResults.nts) {  // NTS query
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
                }
                let queryResult = q.results.map(item => ({
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
                results = featureResult.concat(queryResult);
                resolve(results);
            });
        });
    }


    /**
     * Retrun a promise that resolves as a list of formated province objects
     *
     * @return {Array} list of formated province objects
     */
    fetchProvinces() {
        if (this.provinceList.length > 0) resolve(this.provinceList); // in cache
        let provinceList = [];
        let rawProvinces = this._geoSearhObj.config.provinces.list;
        for (let code in rawProvinces) {
            provinceList.push({
                code: code,
                abbr: CODE_TO_ABBR[code],
                name: rawProvinces[code]
            });
        }
        this.provinceList = provinceList;
        return this.provinceList;
    }

    /**
     * Retrun a promise that resolves as a list of formated type objects
     *
     * @return {Array} list of a formated type objects
     */
    fetchTypes() {
        if (this.typeList.length > 0) resolve(this.typeList); // in cache
        let typeList = [];
        let rawTypes = this._geoSearhObj.config.types.allTypes;
        for (let type in rawTypes) {
            typeList.push({
                code: type,
                name: rawTypes[type]
            });
        }
        this.typeList = typeList;
        return this.typeList;
    }
}

export default {
    GeoSearchUI
}
