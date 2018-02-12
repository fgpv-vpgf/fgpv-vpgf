import * as types from '../data/types.json';
import * as provinces from '../data/provinces.json';
import * as i from './interfaces';
import { Query } from './query';

const searchTypes = (<any>types);
const provinceTypes = (<any>provinces);

export class GeoSearch {
    types: i.dataType;
    provinces: i.dataType;
    rIterator: Function;
    docFrag: DocumentFragment;
    rContainer: HTMLElement;
    maxResults: number = 100;
    geoLocateUrl: string;
    geoNameUrl: string;

    constructor(config?: i.config) {
        const language = config && config.language ? config.language : 'en';
        this.types = (<i.dataFile>searchTypes)[language];
        this.provinces = (<i.dataFile>provinceTypes)[language];


        this.geoLocateUrl = this.geoLocateUrl ? this.geoLocateUrl : `https://geogratis.gc.ca/services/geolocation/${language}/locate`;
        this.geoNameUrl = this.geoNameUrl ? this.geoNameUrl : `https://geogratis.gc.ca/services/geoname/${language}/geonames.json`;
        
        if (config) {
            this.maxResults = config.maxResults ? config.maxResults : this.maxResults;
            if (config.includeTypes) {
                this.findReplaceTypes((typeof config.includeTypes === 'string' ? [config.includeTypes] : config.includeTypes));
            } else if (config.excludeTypes) {
                this.findReplaceTypes((typeof config.excludeTypes === 'string' ? [config.excludeTypes] : config.excludeTypes), true);
            }   
        }        
    }

    findReplaceTypes(keys: Array<string>, exclude?: boolean) {
        const typeSet = new Set(Object.keys(this.types));
        const keySet = new Set(keys);
        const invalidKeys = new Set([...typeSet].filter(x => !!exclude === keySet.has(x)));
        for (let key of invalidKeys) {
            delete this.types[key];
        }
    }

    ui(input?: HTMLInputElement, resultContainer?: HTMLElement, rIterator?: Function) {
        this.docFrag = document.createDocumentFragment();

        if (!input) {
            input = document.createElement('input');
            this.docFrag.appendChild(input);
        }

        input.onkeyup = this.inputChanged.bind(this);

        if (!resultContainer) {
            this.rContainer = document.createElement('ul');
            this.docFrag.appendChild(this.rContainer);
        } else {
            this.rContainer = resultContainer;
        }

        this.rContainer.classList.add('geosearch-ui');

        this.rIterator = rIterator ? rIterator.bind(this) : this.resultIterator;

        return this;
    }

    resultIterator(result: i.returnType): HTMLElement {
        const li = document.createElement('li');
        li.innerHTML = result.name;
        return li;
    }

    inputChanged(evt: KeyboardEvent) {
        const qValue = (<HTMLInputElement>evt.target).value;
        this.rContainer.innerHTML = '';
        this.query(qValue).then(results => {
            results.forEach(r => {
                this.rContainer.appendChild(this.rIterator(r));
            });
        }).catch(error => {}); // don't care for error
    }

    get htmlElem(): DocumentFragment  {
        return this.docFrag;
    }

    query(query: string): Promise<Array<i.returnType>> {
        
        const Q = new Query({
            query: query,
            urls: {name: this.geoNameUrl, locate: this.geoLocateUrl},
            maxResults: this.maxResults,
            types: this.types
        });

        return Q.search().then(geoName => {
            return geoName.map(gn => (
                {
                    name: gn.name,
                    location: gn.location,
                    province: this.provinces[gn.province.code],
                    type: this.types[gn.concise.code],
                    pointCoords: gn.position.coordinates,
                    bbox: gn.bbox
                }
            )).filter(r => Object.keys(this.types).find(t => this.types[t] === r.type));
        });
    }
}


if ((<any>window)) {
    (<any>window).GeoSearch = GeoSearch;
}