import { GeoSearch, config, returnType } from './index';

export class GeoSearchUI extends GeoSearch {

    rIterator: Function;
    docFrag: DocumentFragment;
    rContainer: HTMLElement;

    constructor(config?: config, input?: HTMLInputElement, resultContainer?: HTMLElement, rIterator?: Function) {
        super(config);

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
    }

    resultIterator(result: returnType): HTMLElement {
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
}

if ((<any>window)) {
    (<any>window).GeoSearchUI = GeoSearchUI;
}