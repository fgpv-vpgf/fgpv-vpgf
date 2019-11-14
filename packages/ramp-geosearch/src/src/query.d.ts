import * as defs from './definitions';
export declare function make(config: defs.MainConfig, query: string): Query;
export declare class Query {
    config: defs.MainConfig;
    query: string | undefined;
    featureResults: defs.queryFeatureResults;
    suggestions: defs.NTSResultList;
    results: defs.NameResultList;
    onComplete: Promise<this>;
    latLongResult: any;
    scale: any;
    constructor(config: defs.MainConfig, query?: string);
    private getUrl;
    normalizeNameItems(items: defs.NameResponse[]): defs.NameResultList;
    search(restrict?: number[]): Promise<defs.NameResultList>;
    nameByLatLon(lat: number, lon: number, restrict?: number[]): any;
    locateByQuery(altQuery?: string): Promise<defs.LocateResponseList>;
    jsonRequest(url: string): Promise<{}>;
    sortResults(response: any): any;
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
export declare class NTSQuery extends Query {
    unitName: string;
    unit: defs.NTSResult;
    mapSheets: defs.NTSResultList;
    constructor(config: defs.MainConfig, query: string);
    locateToResult(lrl: defs.LocateResponseList): defs.NTSResultList;
    equals(otherQ: NTSQuery): boolean;
}
export declare class FSAQuery extends Query {
    constructor(config: defs.MainConfig, query: string);
    formatLocationResult(): Promise<defs.FSAResult | undefined>;
}
export declare class LatLongQuery extends Query {
    constructor(config: defs.MainConfig, query: string, type: string);
}
