import * as defs from './definitions';

export function make(config: defs.MainConfig, query: string): Query {
    // FSA test
    if (/^[ABCEGHJKLMNPRSTVXY]\d[A-Z]/.test(query)) {
        return new FSAQuery(config, query);
    // Partial NTS match (Sheet and Map Unit Subdivision)
    } else if (/^\d{2,3}[A-P]/.test(query)) {
        query = query.substring(0, 6).toUpperCase();
        return new NTSQuery(config, query);
    // name based search
    } else if (/^[A-Za-z]/.test(query)) {
        const q = new Query(config, query);
        q.onComplete = q.search().then(results => {
            q.results = results;
            return q;
        });
        return q;
    // possible street address search (not supported) or contains special characters
    } else {
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

        return url;
    }

    normalizeNameItems(items: defs.NameResponse[]): defs.NameResultList {
        return items.filter(i => this.config.types.validTypes[i.concise.code]).map(i => {
            return {
                name: i.name,
                location: i.location,
                province: this.config.provinces.list[i.province.code],
                type: this.config.types.allTypes[i.concise.code],
                LatLon: { lat: i.latitude, lon: i.longitude},
                bbox: i.bbox
            }
        });
    }

    search(restrict?: number[]): Promise<defs.NameResultList> {
       return (<Promise<defs.RawNameResult>>this.jsonRequest(this.getUrl(false, restrict))).then(r => this.normalizeNameItems(r.items));
    }

    nameByLatLon(lat: number, lon: number, restrict?: number[]): Promise<defs.NameResultList> {
        return (<Promise<defs.RawNameResult>>this.jsonRequest(this.getUrl(false, restrict, undefined, lat, lon))).then(r => this.normalizeNameItems(r.items));
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
                    resolve(typeof xobj.response === 'string' ? JSON.parse(xobj.response) : xobj.response);
                } else {
                    reject('Could not load results from remote service.');
                }
            };
            xobj.send();
        });
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
        query = !parseInt(query[2]) ? '0' + query : query;
        super(config, query);
        this.unitName = query;
        this.onComplete = new Promise((resolve, reject) => {
            this.locateByQuery().then(lr => {
                // query check added since it can be null but will never be in this case (make TS happy)
                if (lr.length > 0 && this.query) {
                    const allSheets = this.locateToResult(lr);
                    this.unit = allSheets.splice(allSheets.findIndex(x => x.nts === this.query), 1)[0];
                    this.mapSheets = allSheets;

                    this.featureResults = this.unit;
                    this.nameByLatLon(this.unit.LatLon.lat, this.unit.LatLon.lon).then(r => {
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
                LatLon: { lat: ls.geometry.coordinates[1], lon: ls.geometry.coordinates[0]},
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
                    this.nameByLatLon(fLR.LatLon.lat, fLR.LatLon.lon, Object.keys(fLR._provinces).map(x => parseInt(x))).then(r => {
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
                    LatLon: { lat: locateResponseList[0].geometry.coordinates[1], lon: locateResponseList[0].geometry.coordinates[0]}
                }
            }
        });
    }
}