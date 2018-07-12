/**
 * @namespace geoSearch
 * @description An intention that provides geo location search
 */

import 'rz-geosearch';

const host = `http://geogratis.gc.ca/services/geoname/`


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
            this._geoSearhObj.query(q).onComplete.then(q => {
                let results = q.results.map(item => ({
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
                resolve(results);
            });
        });
    }


    /**
     * Retrun a promise that resolves as a list of formated province objects
     *
     * @return {Promise} the promise that resolves as a formated province objects
     */
    fetchProvinces() {
        return new Promise((resolve) => {
            let request = new XMLHttpRequest();
            request.open('GET', host + this.lang + '/codes/province.json', false);
            request.send();
            let rawProvinces = JSON.parse(request.response).definitions;
            let provinceList = rawProvinces.map(prov => ({
                code: prov.code,
                abbr: prov.term,
                name: prov.description
            }));
            this.provinceList = provinceList;
            resolve(provinceList);
        });
    }

    /**
     * Retrun a promise that resolves as a list of formated type objects
     *
     * @return {Promise} the promise that resolves as a formated type objects
     */
    fetchTypes() {
        return new Promise((resolve) => {
            let request = new XMLHttpRequest();
            request.open('GET', host + this.lang + '/codes/concise.json', false);
            request.send();
            let rawTypes = JSON.parse(request.response).definitions;
            let typeList = rawTypes.map(type => ({
                code: type.code,
                name: type.term
            }));
            this.typeList = typeList;
            resolve(typeList);
        });
    }
}

export default {
    GeoSearchUI
}
