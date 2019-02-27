import { Observable, Subject } from 'rxjs';
import Button from './button';
import Element from './element';
import Map from 'api/map';

export { default as Button } from './button';
export { default as Element } from './element';
export { default as BasePanel } from './base.panel';

export class Panel {
    _api: Map;

    set api(map: Map) {
        this._api = map;
    }

    get api() {
        return this._api;
    }

    /**
    * Opens the panel on the map. (For the user to see)
    */
    open(): void {
        //fires opening observable
        this.openingSubject.next();
        this.panelContents.removeClass('hidden');
    }

    /**
    * Closes the panel on the map. (For the user to see).
    */
    close(): void {
        this.closingSubject.next();
        this.panelContents.addClass('hidden');
    }

    /**
     * Determines if the content passed is a typeof PanelElem.
     *
     * @param content   panel body content
     */
    isPanelElem(content: Element | string | HTMLElement | JQuery<HTMLElement>): content is Element {
        return !!(<Element>content).element;
    }

    /**
     * Sets the panel body to the provided content.
     *
     * @param content   panel body content
     */
    setBody(content: Element | string | HTMLElement | JQuery<HTMLElement>) {
        const pElemContent = this.isPanelElem(content) ? content : new Element(content);
        this.panelBody.removeClass('hidden');
        this.contentAttr = pElemContent;
        //First empty existing content
        this.panelBody.html('');
        //then fill in new contents
        this.panelBody.append(this.getBody());
        return this;
    }

    /**
     * Returns the panel body.
     */
    getBody() {
        return this.contentAttr.element;
    }

    /**
    * Gets the id for the Panel
    * @return {string} - the panel id
    */
    get id(): string {
        return this._id;
    }

    /**
     * Throw an error when attempting to set a panel id, should be set when a panel is created.
     */
    set id(id: string) {
        throw new Error('API(panels): you cannot modify a panels id.');
    }

    /**
    * Returns panel shell element
    * @return {JQuery<HTMLElement>} - shell element that holds controls and content of panel
    */
    get element(): JQuery<HTMLElement> {
        return this.panelContents;
    }

    position(topLeft: number[], bottomRight: number[], snapToMobile: boolean = false): void {
        this.panelContents.css({
            top: topLeft[1] + 'px',
            left: topLeft[0] + 'px',
            width: bottomRight[0] - topLeft[0] + 'px'
        });

        if (snapToMobile) {
            this.panelContents.addClass('rv-panel-mobile-snap');
        }

        this.panelBody.css('height', bottomRight[1] - topLeft[1] + 'px');
    }

    private _initRXJS(): void {
        // init the various subjects
        this.openingSubject = new Subject();
        this.closingSubject = new Subject();
        this.positionChangedSubject = new Subject();
        this.widthChangedSubject = new Subject();
        this.heightChangedSubject = new Subject();

        // turn subjects into observables
        this.opening = this.openingSubject.asObservable();
        this.closing = this.closingSubject.asObservable();
        this.positionChanged = this.positionChangedSubject.asObservable();
        this.widthChanged = this.widthChangedSubject.asObservable();
        this.heightChanged = this.heightChangedSubject.asObservable();
    }

    private _initElements(): void {
        //create panel components as HTMLElements
        this.panelContents = $(document.createElement("div"));
        this.panelContents.addClass('panel-contents');

        this.panelControls = $(document.createElement("div"));
        this.panelControls.addClass(['panel-controls', 'hidden']);

        this.panelBody = $(document.createElement("div"));
        this.panelBody.addClass(['panel-body', 'hidden']);

        this.panelContents.attr('id', this.id);

        //append panel controls/body to panel contents ("shell")
        this.panelContents.append(this.panelControls);
        this.panelContents.append(this.panelBody);
        this.panelContents.addClass('hidden'); //hide panel before a call to open is made
        //append panel contents ("shell") to document fragment
        this.documentFragment = document.createDocumentFragment();
        this.documentFragment.appendChild(this.panelContents[0]);

        // $(this.mapObject.innerShell).append(this.documentFragment);
    }

    /**
     * Initialize rxJS subjects as observables and create panel elements on the DOM.
     *
     * @param id - the user defined ID name for this Panel
     */
    constructor(id: string) {
        this._id = id;

        this._initRXJS();
        this._initElements();
    }
}

export interface Panel {

    _id: string;

    //Panel items
    contentAttr: Element;
    controlList: (Element)[];

    //HTML parent Components
    panelContents: JQuery<HTMLElement>;
    panelControls: JQuery<HTMLElement>;
    panelBody: JQuery<HTMLElement>;
    documentFragment: DocumentFragment;

    widthAttr: number | string | undefined;
    heightAttr: number | string | undefined;

    contentsHeight: number;

    //subjects initialized for observables that are fired through method calls
    openingSubject: Subject<any>;
    closingSubject: Subject<any>;
    positionChangedSubject: Subject<any>;
    widthChangedSubject: Subject<any>;
    heightChangedSubject: Subject<any>;

    //user accessible observables
    opening: Observable<any>;
    closing: Observable<any>;
    positionChanged: Observable<[number, number]>; //top left, bottom right
    widthChanged: Observable<number>
    heightChanged: Observable<number>
}