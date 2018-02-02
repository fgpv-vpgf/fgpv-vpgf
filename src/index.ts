import * as types from '../data/types.json';
const searchTypes = (<any>types);

export class GeoSearch {
    types: searchType;
    url: string;
    language: string;
    userQuery: string;

    constructor(config?: config) {
        this.language = config && config.language ? config.language : 'en';
        if (config && config.types) {
            this.types = config.types;
        } else {
            this.types = (<searchType>searchTypes);
            delete this.types.default; // added by TS, remove since it breaks things
        }
        this.url = config && config.geogratisUrl ? config.geogratisUrl : `https://geogratis.gc.ca/services/geolocation/${this.language}/locate?q=`;
    }

    query(query: string) {
        this.userQuery = query;
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

        switch (result.type) {
            case 'ca.gc.nrcan.geoloc.data.model.PostalCode':
                return this.filterPostal(result);

            case 'ca.gc.nrcan.geoloc.data.model.NTS':
                return this.filterNTS(result);

            /**
             * ca.gc.nrcan.geoloc.data.model.Geoname geoGratis types have comma separated string titles which contain some key information
             * we require. For example, searching for "quebec" contains a result object with a title property value of"Quebec, , Quebec (Province)".
             * Since these result objects don't contain location types (province, city, etc. ) in their parameters, we need to deduce it from the
             * title strings. 
             */
            default:
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
                return typeRegex ? this.validateType(typeRegex[1]) : null;
        }
    }

    /**
     * geoGratis NTS results contain the NTS code at the start of the result title. This is not needed, so it is removed.
     */
    filterNTS(result: geogratisResultType) {
        result.title = result.title.replace(/\d{1,3}\w\d{1,3}/, '');
        return this.types.NTS && this.types.NTS[this.language] ? this.validateType(this.types.NTS[this.language].term) : false;
    }

    filterPostal(result: geogratisResultType) {
        return this.types.POSTALCODE && this.types.POSTALCODE[this.language] ? this.validateType(this.types.POSTALCODE[this.language].term) : false;
    }

    /**
     * geoGratis returns duplicate results at times, in particular it provides the english and french versions of locations. 
     * 
     * For example, using default english geoGratis service, searching for "Quebec" returns results that contain both "Quebec" and "Québec"
     * 
     * So duplicate results are those who share the same type (i.e. province) and have identical geometry coordinates.
     */
    removeDuplicateResults(results: Array<returnType>) {
        for (let i = 0; i < results.length; i++) {
            let currentResult = results[i];

            for (let j = i + 1; j < results.length; j++) {
                let nextResult = results[j];    
                if (currentResult.type.name === nextResult.type.name && currentResult.geometry.coordinates.join(',') == nextResult.geometry.coordinates.join(',')) {
                    results.splice(j, 1);
                }
            }
        }

        return results;
    }

    /**
     * Given the geoGratis JSON result object, it calls applies the filter and duplicate reducer functions, and returns the results in a useful structure.
     */
    processResults(results: Array<geogratisResultType>) {
        const filterResults = results.map(r => {
            const filteredResult = this.filterQuery(r);

            if (filteredResult && filteredResult.isValid) {
                return {
                    name: (<string>r.title.split(',').shift()).trim(),
                    type: {
                        name: filteredResult.type,
                        description: filteredResult.description
                    },
                    bbox: r.bbox,
                    geometry: r.geometry
                }
            }
        }).filter(r => r);

        return this.removeDuplicateResults((<Array<returnType>>filterResults));
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

        const foundKey = Object.keys(this.types).find(t => {
            return this.types[t][this.language].term === type
        });

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
    bbox?: Array<number>,
    geometry: {
        type: string,
        coordinates: Array<number>
    }
}

interface config {
    types: searchType,
    language: string,
    geogratisUrl?: string
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
    "type": string,
    "bbox": Array<number>,
    "geometry": {
        "type": string,
        "coordinates": Array<number>
    }
}


if ((<any>window)) {
    (<any>window).GeoSearch = GeoSearch;
}