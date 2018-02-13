import * as i from './interfaces';

export class Query {
    query: string;
    types: i.dataType;
    maxResults: number;
    geoNamesUrl: string;
    geoLocateUrl: string;

    constructor(config: i.queryConfig) {
        this.query = config.query;
        this.types = config.types;
        this.maxResults = config.maxResults;
        this.geoNamesUrl = config.urls.name;
        this.geoLocateUrl = config.urls.locate;
    }

    search(): Promise<Array<i.geoNamesType>> {
        return new Promise((resolve, reject) => {
            if (this.isFSA() || this.isNTS()) {
                this.httpLocateRequest(this.query).then(gl => {
                    this.httpLatLonRequest(gl).then(x => i.isReturnedGeoNamesType(x) ? resolve(x.items) : reject(x));
                });
            } else {
                this.httpRequest(this.geoNamesUrl + '?q=' + this.query + '&category=O&concise=' + Object.keys(this.types).join(',')).then(r => {
                    i.isReturnedGeoNamesType(r) ? resolve(r.items) : reject(r);
                }); 
            }
        });
    }

    isFSA() {
        const normalizeQuery = this.query.substring(0,3).toUpperCase();
        if (/^\w\d\w/.test(normalizeQuery)) {
            this.query = normalizeQuery;
            return true;
        }
        return false;
    }

    isNTS() {
        const normalizeQuery = this.query.substring(0,6).toUpperCase();
        if (/^\d{3}\w\d{2}/.test(normalizeQuery)) {
            this.query = normalizeQuery;
            return true;
        }
        return false;
    }

    
    httpLatLonRequest(x: i.geoLocateType): Promise<i.returnedGeoNamesType> {
        return new Promise((resolve, reject) => {
            this.httpRequest(`${this.geoNamesUrl}?lat=${x.geometry.coordinates[1]}&lon=${x.geometry.coordinates[0]}&num=${this.maxResults}`)
            .then(r => i.isReturnedGeoNamesType(r) ? resolve(r) : reject('Results are not in geoname format.'))
            .catch(reject);
        });
    }

    httpLocateRequest(ntsOrFsa: string): Promise<i.geoLocateType> {
        return new Promise((resolve, reject) => {
            this.httpRequest(this.geoLocateUrl + '?q=' + ntsOrFsa)
            .then(r => i.isReturnedGeoLocationType(r) ? resolve(r[0]) : reject('No valid locate results could be determined.'))
            .catch(reject);
        });
    }

    httpRequest(url: string): Promise< Array<i.geoLocateType> |  i.returnedGeoNamesType > {
        return new Promise((resolve, reject) => {
            const xobj = new XMLHttpRequest();
            xobj.open('GET', url, true);
            xobj.responseType = 'json';
            xobj.onload = function() {
                if (xobj.status === 200) {
                    resolve(typeof xobj.response === 'string' ? JSON.parse(xobj.response) : xobj.response);
                } else {
                    reject('Could not load results from remote service.');
                }
            };
            xobj.send();
        });
    }
}