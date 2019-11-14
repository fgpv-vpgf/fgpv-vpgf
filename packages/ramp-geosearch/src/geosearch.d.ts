declare module GeoSearch
{
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
	export type LocateResponseList = LocateResponse[];
	export type NameResultList = NameResult[];
	export type NTSResultList = NTSResult[];
	export type LatLongResultList = LatLongResult[];
	export type queryFeatureResults = FSAResult | NTSResult | LatLongResult;
	export function isFSAResult(result: queryFeatureResults): result is FSAResult;
	export function isNTSResult(result: queryFeatureResults): result is NTSResult;

	import * as Q from './query';
	import Provinces from './provinces';
	import Types from './types';
	import * as defs from './definitions';
	export class GeoSearch {
	    resultHandler: (results: defs.NameResultList) => HTMLElement;
	    featureHandler: (results: defs.queryFeatureResults) => HTMLElement;
	    docFrag: DocumentFragment;
	    config: defs.MainConfig;
	    resultContainer: HTMLElement;
	    featureContainer: HTMLElement;
	    constructor(uConfig?: defs.UserConfig);
	    ui(resultHandler?: (results: defs.NameResultList) => HTMLElement, featureHandler?: (results: defs.queryFeatureResults) => HTMLElement, input?: HTMLInputElement, resultContainer?: HTMLElement, featureContainer?: HTMLElement): this;
	    defaultResultHandler(results: defs.NameResultList): HTMLElement;
	    defaultFeatureHandler(fR: defs.queryFeatureResults): HTMLElement;
	    inputChanged(evt: KeyboardEvent): void;
	    readonly htmlElem: DocumentFragment;
	    query(query: string): Q.Query;
	}
	export { Q, Provinces, Types, defs as Defs };

	import * as defs from './definitions';
	export default function (language: string): defs.Provinces;

	import * as defs from './definitions';
	export function make(config: defs.MainConfig, query: string): Query;
	export class Query {
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
	export class NTSQuery extends Query {
	    unitName: string;
	    unit: defs.NTSResult;
	    mapSheets: defs.NTSResultList;
	    constructor(config: defs.MainConfig, query: string);
	    locateToResult(lrl: defs.LocateResponseList): defs.NTSResultList;
	    equals(otherQ: NTSQuery): boolean;
	}
	export class FSAQuery extends Query {
	    constructor(config: defs.MainConfig, query: string);
	    formatLocationResult(): Promise<defs.FSAResult | undefined>;
	}
	export class LatLongQuery extends Query {
	    constructor(config: defs.MainConfig, query: string, type: string);
	}

	import * as defs from './definitions';
	export default function (language: string): defs.Types;

	export {};

}