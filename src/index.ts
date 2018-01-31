import * as types from 'data/types.json';
const searchTypes = (<any>types);

export class GeoSearch {
    types: searchType;
    url: string;
    language: string;

    constructor(config?: config) {
        this.language = config && config.language ? config.language : 'en';
        this.types = config ? config.types : (<searchType>searchTypes);
        this.url = config && config.geogratisUrl ? config.geogratisUrl : `http://geogratis.gc.ca/services/geolocation/${this.language}/locate?q=`;
    }

    query(query: string) {
        return new Promise(resolve => {
            const xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
            xobj.open('GET', this.url + encodeURI(query), true);
            xobj.onreadystatechange = () => {
                if (xobj.readyState === 4 && xobj.status === 200) {
                    resolve(this.processResults(JSON.parse(xobj.responseText)));
                }
            }
            xobj.send(null);
        });
    }

    filterQuery(result: geogratisResultType) {
        // the title contains additional comma separated values we need for filtering. 
        // Example result title: Toronto, York, Ontario (City)
        const titleSplit = result.title.split(',');
        // we filter on a result type, which is the last part of the comma separated result title.
        // Example: Ontario (City)
        const identifier = titleSplit.pop();
        // we'll store the actual type once extracted from the above string via regex (we want "City")
        let type = '';
        let typeRegex = /.*\((\w+)\)/.exec(identifier || '');

        // return a valid type result or reject if type is not defined.
        return typeRegex ? this.validateType(typeRegex[0]) : null;
    }

    processResults(results: Array<geogratisResultType>) {
        return results.map(r => {
            const filteredResult = this.filterQuery(r);

            if (filteredResult && filteredResult.isValid) {
                return {
                    name: r.title.split(',').shift(),
                    type: {
                        name: filteredResult.type,
                        description: filteredResult.description
                    },
                    bbox: r.bbox,
                    geometry: r.geometry
                }
            }
        }).filter(r => r);
    }

    /**
     * Determines if the provided type is valid based on the default or user provided type list and includes additional type data (description)
     * 
     * @param type location type such as City, Province, Town, ...
     */
    validateType(type: string): {isValid: boolean, type: string, description: string} {
        const result = {
            isValid: false,
            type: '',
            description: ''
        };

        const foundKey = Object.keys(this.types).find(t => this.types[t][this.language].term === type);

        if (foundKey) {
            result.isValid = true;
            result.type = type;
            result.description = this.types[foundKey][this.language].description;
        }
        
        return result;
    }
}

interface returnType {
    name: string,
    type: {
        name: string,
        description: string
    },
    bbox: Array<number>,
    geometry: {
        type: string,
        coordinates: Array<number>
    }
}

interface config {
    types: searchType,
    geogratisUrl?: string,
    language?: "en" | "fr";
}

interface searchType {
    [key: string]: {
        [key: string]: {
            "term": string,
            "description": string
        }
    }
}

interface geogratisResultType {
    "title": string,
    "bbox": Array<number>,
    "geometry": {
        "type": string,
        "coordinates": Array<number>
    }
}

