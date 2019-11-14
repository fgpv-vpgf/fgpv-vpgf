export interface GenericObjectType {
    [key: string]: string;
}
export interface MainConfig {
    geoNameUrl: string;
    geoLocateUrl: string;
    categories: string[];
    sortOrder: string[];
    maxResults: number;
    officialOnly: boolean;
    language: string;
    types: Types;
    provinces: Provinces;
}
export interface UserConfig {
    excludeTypes?: string | string[];
    language?: string;
    settings?: Settings;
    geoLocateUrl?: string;
    geoNameUrl?: string;
}
export interface Settings {
    categories: string[];
    sortOrder: string[];
    maxResults: number;
    officialOnly: boolean;
}
export interface LatLon {
    lat: number;
    lon: number;
}
export interface LocateResponse {
    title: string;
    bbox?: number[];
    geometry: {
        coordinates: number[];
    };
}
export interface NameResponse {
    name: string;
    location: string;
    province: {
        code: string;
    };
    concise: {
        code: string;
    };
    latitude: number;
    longitude: number;
    bbox: number[];
}
export interface Types {
    allTypes: GenericObjectType;
    validTypes: GenericObjectType;
    filterValidTypes(exclude?: string | string[]): GenericObjectType;
}
export interface Provinces {
    fsaToProvinces(fsa: string): GenericObjectType;
    list: GenericObjectType;
}
export interface RawNameResult {
    items: NameResponse[];
}
export interface NameResult {
    name: string;
    location: string;
    province: string;
    type: string;
    LatLon: LatLon;
    bbox: number[];
}
export interface FSAResult {
    fsa: string;
    code: string;
    desc: string;
    province: string;
    _provinces: GenericObjectType;
    LatLon: LatLon;
}
export interface NTSResult {
    nts: string;
    location: string;
    code: string;
    desc: string;
    LatLon: LatLon;
    bbox: number[];
}
export interface LatLongResult {
    latlong: string;
    desc: string;
    LatLon: LatLon;
    bbox: number[];
}
export declare type LocateResponseList = LocateResponse[];
export declare type NameResultList = NameResult[];
export declare type NTSResultList = NTSResult[];
export declare type LatLongResultList = LatLongResult[];
export declare type queryFeatureResults = FSAResult | NTSResult | LatLongResult;
export declare function isFSAResult(result: queryFeatureResults): result is FSAResult;
export declare function isNTSResult(result: queryFeatureResults): result is NTSResult;
