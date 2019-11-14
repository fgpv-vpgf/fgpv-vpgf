import * as Q from './query';
import Provinces from './provinces';
import Types from './types';
import * as defs from './definitions';

const GEO_LOCATE_URL = 'https://geogratis.gc.ca/services/geolocation/@{language}/locate';
const GEO_NAMES_URL = 'https://geogratis.gc.ca/services/geoname/@{language}/geonames.json';

let lastQuery: string;

export class GeoSearch {
    resultHandler: (results: defs.NameResultList) => HTMLElement;
    featureHandler: (results: defs.queryFeatureResults) => HTMLElement;
    docFrag: DocumentFragment;
    config: defs.MainConfig;
    resultContainer: HTMLElement;
    featureContainer: HTMLElement;

    constructor(uConfig?: defs.UserConfig) {
        uConfig = uConfig ? uConfig : {};
        const language = uConfig.language ? uConfig.language : 'en';
        // set default URLS if none provided and search/replace language in string (if exists)
        let geoLocateUrl = uConfig.geoLocateUrl ? uConfig.geoLocateUrl : GEO_LOCATE_URL;
        let geoNameUrl = uConfig.geoNameUrl ? uConfig.geoNameUrl : GEO_NAMES_URL;
        geoLocateUrl = geoLocateUrl.replace('@{language}', language);
        geoNameUrl = geoNameUrl.replace('@{language}', language);

        const categories = uConfig.settings ? uConfig.settings.categories : [];
        const sortOrder = uConfig.settings ? uConfig.settings.sortOrder : [];
        const maxResults = uConfig.settings ? uConfig.settings.maxResults : 100;
        const officialOnly = uConfig.settings ? uConfig.settings.officialOnly : false;

        this.config = {
            language,
            types: Types(language),
            provinces: Provinces(language),
            categories,
            sortOrder,
            maxResults,
            officialOnly,
            geoNameUrl,
            geoLocateUrl
        };

        this.config.types.filterValidTypes(uConfig.excludeTypes);
    }

    ui(resultHandler?: (results: defs.NameResultList) => HTMLElement, featureHandler?: (results: defs.queryFeatureResults) => HTMLElement, input?: HTMLInputElement, resultContainer?: HTMLElement, featureContainer?: HTMLElement) {
        // bind scope of provided iterator to this class, or set to internal resultIterator implementation for default behaviour
        this.resultHandler = resultHandler ? resultHandler.bind(this) : this.defaultResultHandler;
        this.featureHandler = featureHandler ? featureHandler.bind(this) : this.defaultFeatureHandler;
        this.docFrag = document.createDocumentFragment();

        if (!input) {
            input = document.createElement('input');
            this.docFrag.appendChild(input);
        }

        input.onkeyup = this.inputChanged.bind(this);

        if (!featureContainer) {
            this.featureContainer = document.createElement('div');
            this.docFrag.appendChild(this.featureContainer);
        } else {
            this.featureContainer = featureContainer;
        }

        if (!resultContainer) {
            this.resultContainer = document.createElement('div');
            this.docFrag.appendChild(this.resultContainer);
        } else {
            this.resultContainer = resultContainer;
        }

        this.resultContainer.classList.add('geosearch-ui');
        this.featureContainer.classList.add('geosearch-ui');

        return this;
    }

    defaultResultHandler(results: defs.NameResultList): HTMLElement {
        const ul = document.createElement('ul');

        results.reverse().forEach(r => {
            const li = document.createElement('li');
            li.innerHTML = `${r.name} (${r.type})${r.location ? ', ' + r.location : ''}, ${r.province} @ lat: ${r.LatLon.lat}, lon: ${r.LatLon.lon}`;
            ul.appendChild(li);
        });

        return ul;
    }

    defaultFeatureHandler(fR: defs.queryFeatureResults): HTMLElement {
        let output;

        if (defs.isFSAResult(fR)) {
            output = `${fR.fsa} - FSA located in ${fR.province} @ lat: ${fR.LatLon.lat}, lon: ${fR.LatLon.lon}`;
        } else if (defs.isNTSResult(fR)) {
            output = `${fR.nts} - NTS located in ${fR.location} @ lat: ${fR.LatLon.lat}, lon: ${fR.LatLon.lon}`;
        } else {
            output = `lat: ${fR.LatLon.lat}, lon: ${fR.LatLon.lon}`
        }

        const p = document.createElement('p');
        p.innerHTML = <string>output;
        return p;
    }

    inputChanged(evt: KeyboardEvent) {
        const qValue = (<HTMLInputElement>evt.target).value;

        if (qValue.length > 2 && qValue !== lastQuery) {
            lastQuery = qValue;

            while (this.resultContainer.firstChild) {
                this.resultContainer.removeChild(this.resultContainer.firstChild);
            }

            while (this.featureContainer.firstChild) {
                this.featureContainer.removeChild(this.featureContainer.firstChild);
            }

            this.query(qValue).onComplete.then(q => {
                if (q.featureResults) {
                    this.featureContainer.appendChild(this.featureHandler(q.featureResults));
                }

                this.resultContainer.appendChild(this.resultHandler(q.results));
            }).catch(err => {
                const p = document.createElement('p');
                p.innerHTML = err;
                this.resultContainer.appendChild(p);
            });
        }
    }

    get htmlElem(): DocumentFragment  {
        return this.docFrag;
    }

    query(query: string): Q.Query {
        return Q.make(this.config, query);
    }
}

export { Q, Provinces, Types, defs as Defs};


if ((<any>window)) {
    (<any>window).GeoSearch = GeoSearch;
}