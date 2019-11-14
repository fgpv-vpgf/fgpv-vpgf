import * as defs from './definitions';

export function make(config: defs.MainConfig, query: string): Query {
    const latLngRegDD = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)(\s*[,|;\s]\s*)[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)[*]$/;
    const latLngRegDMS = /^[-+]?([0-8]?\d|90)\s*([0-5]?\d)\s*([0-5]?\d)\s*[,|;\s]\s*[-+]?(\d{2}|1[0-7]\d|180)\s*([0-5]?\d)\s*([0-5]?\d)[*]$/;
    const fsaReg = /^[ABCEGHJKLMNPRSTVXY]\d[A-Z]/;
    const ntsReg = /^\d{2,3}[A-P]/;
    const scaleReg = /^[1][:]\d{1,3}[ ]*\d{1,3}[ ]*\d{1,3}[*]$/; // from 1:100 to 1:100 000 000

    const queryStr = query.slice(0, -1);
    if (fsaReg.test(query)) {
        // FSA test
        return new FSAQuery(config, query);
    } else if (ntsReg.test(query)) {
        // Partial NTS match (Sheet and Map Unit Subdivision)
        query = query.substring(0, 6).toUpperCase();
        return new NTSQuery(config, query);
    } else if (latLngRegDD.test(query)) {
        // Lat/Long Decimal Degrees test
        return new LatLongQuery(config, queryStr, 'dd');
    } else if (latLngRegDMS.test(query)) {
        // Lat/Long Degree Minute Second test
        return new LatLongQuery(config, queryStr, 'dms')
    } else if (/^[A-Za-z]/.test(query)) {
        // name based search
        const q = new Query(config, query);
        q.onComplete = q.search().then(results => {
            q.results = results;
            return q;
        });
        return q;
    } else if (scaleReg.test(query)) {
        // scale search
        const q = new Query(config, query);
        const typeCode = 'SCALE';
        q.onComplete = q.search().then(_ => {

            q.scale = [{ name: queryStr, type: { name: q.config.types.validTypes[typeCode], code: typeCode } }];
            return q;
        });
        return q;
    } else {
        // possible street address search (not supported) or contains special characters
        const q = new Query(config, query);
        q.onComplete = new Promise((resolve, reject) => resolve(q));
        return q;
    }
}

export class Query {
    config: defs.MainConfig;
    query: string | undefined;
    featureResults: defs.queryFeatureResults;
    suggestions: defs.NTSResultList = [];
    results: defs.NameResultList = [];
    onComplete: Promise<this>;
    latLongResult: any;
    scale: any;

    constructor(config: defs.MainConfig, query?: string) {
        this.query = query;
        this.config = config;
    }

    private getUrl(useLocate?: boolean, restrict?: number[], altQuery?: string, lat?: number, lon?: number): string {
        let url = '';
        const query = altQuery ? altQuery : this.query;
        if (useLocate) {
            url = this.config.geoLocateUrl + '?q=' + query;

        } else if (lat && lon) {
            url = `${this.config.geoNameUrl}?lat=${lat}&lon=${lon}&num=${this.config.maxResults}`

        } else {
            url = `${this.config.geoNameUrl}?q=${query}&num=${this.config.maxResults}`
        }

        if (restrict) {
            if (restrict.length === 4) {
                url += `&bbox=${restrict.join(',')}`;
            } else {
                url += `&province=${restrict.join(',')}`;
            }
        }

        // add custom filtering params
        if (this.config.categories.length > 0) {
            url += `&concise=${this.config.categories.join(',')}`;
        }
        if (this.config.officialOnly) {
            url += '&category=O';
        }

        return url;
    }

    normalizeNameItems(items: defs.NameResponse[]): defs.NameResultList {
        return items.filter(i => this.config.types.validTypes[i.concise.code]).map(i => {
            return {
                name: i.name,
                location: i.location,
                province: this.config.provinces.list[i.province.code],
                type: this.config.types.allTypes[i.concise.code],
                LatLon: { lat: i.latitude, lon: i.longitude },
                bbox: i.bbox
            }
        });
    }

    search(restrict?: number[]): Promise<defs.NameResultList> {
        return (<Promise<defs.RawNameResult>>this.jsonRequest(this.getUrl(false, restrict))).then(r => this.normalizeNameItems(r.items));
    }

    nameByLatLon(lat: number, lon: number, restrict?: number[]): any {
        return (<Promise<defs.RawNameResult>>this.jsonRequest(this.getUrl(false, restrict, undefined, lat, lon))).then(r => {
            return this.normalizeNameItems(r.items)
        });
    }

    locateByQuery(altQuery?: string): Promise<defs.LocateResponseList> {
        return (<Promise<defs.LocateResponseList>>this.jsonRequest(this.getUrl(true, undefined, altQuery)));
    }

    jsonRequest(url: string) {
        return new Promise((resolve, reject) => {
            const xobj = new XMLHttpRequest();
            xobj.open('GET', url, true);
            xobj.responseType = 'json';
            xobj.onload = () => {
                if (xobj.status === 200) {
                    const rawResponse = typeof xobj.response === 'string' ? JSON.parse(xobj.response) : xobj.response;

                    // sort the query results (if applicable) before returning
                    const sortedResponse = this.sortResults(rawResponse);

                    resolve(sortedResponse);
                } else {
                    reject('Could not load results from remote service.');
                }
            };
            xobj.send();
        });
    }

    sortResults(response: any): any {
        if (this.config.sortOrder.length === 0 || !response.items || response.items.length === 0) {
            return response
        }

        const diff = this.config.categories.filter(x => !this.config.sortOrder.includes(x));
        const sortOrder = this.config.sortOrder.concat(diff);

        // add a custom property to indicate the sort index location
        // if `categories` were not provided, then there may be results in the list that do not appear in `sortOrder`; must sort them to the end of the results list
        response.items.forEach((res: any) => res._customIdx = (sortOrder.indexOf(res.concise.code) >= 0 ? sortOrder.indexOf(res.concise.code) : sortOrder.length));

        // sort now based on the custom property added above
        response.items.sort((a: any, b: any) => (a._customIdx >= b._customIdx) ? 1 : -1)
        return response;
    }
}

/**
 * National Topographic System (NTS)
 *
 * The following definitions have the form "name (value constraints) - description"
 *
 * Sheet (two or three digits)      - aka "Map Numbers" are blocks of approximately 4,915,200 hectares.
 * Map Units Subdivision ([A-P])    - each sheet is subdivided further into 16 blocks, approximately 307,200 hectares
 * Map Sheet Unit ([1-16])          - each map unit is subdivided further into 16 blocks, approximately 19,200 hectares
 * Blocks ([A-L])                   - each map sheet unit is subdivided further into 12 blocks, approximately 1600 hectares
 * Units ([1-100]*)                 - each block is finally divided into 100 units, approximately 64 hectares
 *
 * Two subsets of the complete NTS format is supported:
 *     - Sheet and Map Unit Subdivision
 *     - Sheet, Map Unit Subdivision, and Map Sheet Unit
 *
 * Note that "Blocks" and "Units" are currently not supported on geogratis and are ignored on the query.
 */
export class NTSQuery extends Query {
    unitName: string;
    unit: defs.NTSResult;
    mapSheets: defs.NTSResultList;

    constructor(config: defs.MainConfig, query: string) {
        // front pad 0 if NTS starts with two digits
        query = isNaN(parseInt(query[2])) ? '0' + query : query;
        super(config, query);
        this.unitName = query;
        this.onComplete = new Promise((resolve, reject) => {
            this.locateByQuery().then(lr => {
                // query check added since it can be null but will never be in this case (make TS happy)
                if (lr.length > 0 && this.query) {
                    const allSheets = this.locateToResult(lr);
                    this.unit = allSheets[0];
                    this.mapSheets = allSheets;

                    this.featureResults = this.unit;

                    this.nameByLatLon(this.unit.LatLon.lat, this.unit.LatLon.lon).then((r: any) => {
                        this.results = r;
                        resolve(this);
                    });
                } else {
                    reject('Not found');
                }
            });
        });
    }

    locateToResult(lrl: defs.LocateResponseList): defs.NTSResultList {
        const results = lrl.map(ls => {
            const title = ls.title.split(' ');
            return {
                nts: title.shift() || '', // 064D or 064D06
                location: title.join(' '), // "NUMABIN BAY"
                code: 'NTS', // "NTS"
                desc: this.config.types.allTypes.NTS, // "National Topographic System"
                LatLon: { lat: ls.geometry.coordinates[1], lon: ls.geometry.coordinates[0] },
                bbox: (<number[]>ls.bbox)
            };
        });

        return results;
    }

    equals(otherQ: NTSQuery): boolean {
        return this.unitName === otherQ.unitName;
    }
}

export class FSAQuery extends Query {
    constructor(config: defs.MainConfig, query: string) {

        query = query.substring(0, 3).toUpperCase();
        super(config, query);

        this.onComplete = new Promise((resolve, reject) => {
            this.formatLocationResult().then(fLR => {
                if (fLR) {
                    this.featureResults = fLR;
                    this.nameByLatLon(fLR.LatLon.lat, fLR.LatLon.lon, Object.keys(fLR._provinces).map(x => parseInt(x))).then((r: any) => {
                        this.results = r;
                        resolve(this);
                    });
                } else {
                    reject('FSA code given cannot be found.');
                }
            });
        });
    }

    formatLocationResult(): Promise<defs.FSAResult | undefined> {
        return this.locateByQuery().then(locateResponseList => {
            // query check added since it can be null but will never be in this case (make TS happy)
            if (locateResponseList.length === 1 && this.query) {
                const provList = this.config.provinces.fsaToProvinces(this.query);
                return {
                    fsa: this.query,
                    code: 'FSA',
                    desc: this.config.types.allTypes.FSA,
                    province: Object.keys(provList).map(i => provList[i]).join(','),
                    _provinces: provList,
                    LatLon: { lat: locateResponseList[0].geometry.coordinates[1], lon: locateResponseList[0].geometry.coordinates[0] }
                }
            }
        });
    }
}

export class LatLongQuery extends Query {
    constructor(config: defs.MainConfig, query: string, type: string) {
        super(config, query);
        let coords: number[];

        // remove extra spaces and delimiters (the filter). convert string numbers to floaty numbers
        const filteredQuery = query.split(/[\s|,|;|]/).filter(n => !isNaN(n as any) && n !== '').map(n => parseFloat(n));

        if (type === 'dms') {
            // if degree, minute, second, convert to decimal degree
            let latdd = Math.abs(filteredQuery[0]) + filteredQuery[1] / 60 + filteredQuery[2] / 3600; // unsigned
            let longdd = Math.abs(filteredQuery[3]) + filteredQuery[4] / 60 + filteredQuery[5] / 3600; // unsigned

            // check if we need to reset sign
            latdd = (filteredQuery[0] > 0) ? latdd : latdd * -1;
            longdd = (filteredQuery[3] > 0) ? longdd : longdd * -1;

            coords = [latdd, longdd];
        } else {
            coords = filteredQuery;
        }

        // apply buffer to create bbox from point coordinates
        const buff = 0.015; //degrees
        const boundingBox = [coords[1] - buff, coords[0] - buff, coords[1] + buff, coords[0] + buff];

        // prep the lat/long result that needs to be generated along with name based results
        this.latLongResult = {
            name: `${coords[0]},${coords[1]}`,
            location: {
                latitude: coords[0],
                longitude: coords[1]
            },
            type: { name: 'Latitude/Longitude', code: 'COORD' },
            position: [coords[0], coords[1]],
            bbox: boundingBox
        }

        this.onComplete = new Promise((resolve, reject) => {
            //this.getLatLonResults(query, coords[0], coords[1]).then((r: any) => {
            this.nameByLatLon(coords[0], coords[1]).then((r: any) => {
                this.results = r;
                resolve(this);
            });
        });
    }
}
