export interface latLon {
    lat: number,
    lon: number
}

export interface dataFile {
    en: { [key: string]: string },
    fr: { [key: string]: string },
    [key: string]: { [key: string]: string }
}

export interface dataType {
    [key: string]: string
}

export interface returnType {
    name: string,
    location: string,
    province: string,
    type: string,
    pointCoords: Array<number>
    bbox: Array<number>
}

export interface config {
    includeTypes: string | Array<string>,
    excludeTypes: string | Array<string>,
    language: string,
    maxResults?: number,
    geoLocateUrl?: string,
    geoNameUrl?: string
}

export interface queryConfig {
    query: string,
    urls: {name: string, locate: string},
    maxResults: number
    types: dataType
}

export interface geoLocateType {
    component: {
        name: string,
        location: string,
        province: string,
        concise: string
    },
    bbox: Array<number>,
    geometry: {
        type: string,
        coordinates: Array<number>
    }
}

export interface geoNamesType {
    name: string,
    location: string,
    province: { code: number },
    concise: { code: string },
    bbox: Array<number>,
    position: {
        type: string,
        coordinates: Array<number>
    }
}

export interface returnedGeoNamesType {
    items: Array<geoNamesType>
}

export function isReturnedGeoNamesType(result: Array<geoLocateType> | returnedGeoNamesType): result is returnedGeoNamesType {
    return result.hasOwnProperty('items');
}

export function isReturnedGeoLocationType(result: Array<geoLocateType> | returnedGeoNamesType): result is Array<geoLocateType> {
    return result.hasOwnProperty(0);
}
