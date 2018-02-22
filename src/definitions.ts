export interface genericObjectType {
    [key: string]: string
}

// config object is used by all query classes
export interface mainConfig {
    geoNameUrl: string,
    geoLocateUrl: string,
    maxResults: number,
    language: string,
    types: Types,
    provinces: Provinces
}

export interface userConfig {
    includeTypes?: string | Array<string>,
    excludeTypes?: string | Array<string>,
    language?: string,
    maxResults?: number,
    geoLocateUrl?: string,
    geoNameUrl?: string
}

export interface latLon {
    lat: number,
    lon: number
}

export interface locateResponse {
    title: string,
    bbox?: Array<number>,
    geometry: { coordinates: Array<number> }
}

export interface nameResponse {
    name: string,
    location: string,
    province: {code: string},
    concise: { code: string },
    latitude: number,
    longitude: number,
    bbox: Array<number>,
}

export interface Types {
    allTypes: genericObjectType
    validTypes: genericObjectType;
    filterValidTypes(include?: string | Array<string>, exclude?: string | Array<string>): genericObjectType;
}

export interface Provinces {
    fsaToProvinces(fsa: string): genericObjectType;
    list: genericObjectType;
}

// final results from a query, filtered on types and sorted where applicable
export interface finalResults {
    featured: nameResultList | FSAResult | NTSResult,
    results: nameResultList
}

export interface rawNameResult {
    items: Array<nameResponse>
}

// defines results from a geoNames search
export interface nameResult {
    name: string,
    location: string,
    province: string, // "Ontario"
    type: string, // "Lake"
    latLon: latLon,
    bbox: Array<number>
}

export interface FSAResult {
    fsa: string, // "H0H"
    code: string, // "FSA"
    desc: string, // "Forward Sortation Area"
    province: string, // Ontario
    _provinces: genericObjectType, // {ON: "Ontario"} or {ON: "Ontario", MB: "Manitoba"}
    latLon: latLon
}

export interface NTSResult {
    nts: string, // 064D or 064D06
    location: string, // "NUMABIN BAY"
    code: string, // "NTS"
    desc: string, // "National Topographic System"
    latLon: latLon,
    bbox: Array<number>
}

export type locateResponseList = Array<locateResponse>;
export type nameResultList = Array<nameResult>
export type NTSResultList = Array<NTSResult>;
export type queryFeatureResults = FSAResult | NTSResult;

export function isFSAResult(result: queryFeatureResults): result is FSAResult {
    return !!(<FSAResult>result).fsa;
}

export function isNTSResult(result: queryFeatureResults): result is NTSResult {
    return !!(<NTSResult>result).nts;
}

