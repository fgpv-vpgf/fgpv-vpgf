import { Observable, Subject } from 'rxjs';
import Button from './button';
import CloseButton from './button.close';
import ToggleButton from './button.toggle';
import Element from './element';
import Map from 'api/map';
import Header from './header';

export { default as CloseButton } from './button.close';

export class Panel {

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
        this.element.removeClass('hidden');

        const positionTypes = ['top', 'left', 'right', 'bottom'];

        // checks if all position types are the same 0px - the default values.
        const all0px = positionTypes.map(t => this.element.css(t)).every( (val, i, arr) => val === '0px' && val === arr[0] );

        if (all0px) {
            //TODO: SET CSS
            //position: relative;
            //margin: 10px auto;
            //min-width: 250px;
            //min-height: 250px;
        }
    }

    /**
    * Closes the panel on the map. (For the user to see).
    */
    close(): void {
        this.closingSubject.next();
        this.element.addClass('hidden');
    }

    /**
     * Determines if the content passed is a typeof PanelElem.
     *
     * @param content   panel body content
     */
    isPanelElem(content: Element | string | HTMLElement | JQuery<HTMLElement>): content is Element {
        return !!(<Element>content).elem;
    }

    set body(content: any) {
        this.body.html( (new Element(content, this)).elem );
        this.body.removeClass('hidden');
    }

    get body() {
        return this._body;
    }

    get element() {
        return this._element;
    }

    get header() {
        this._header = this._header ? this._header : new Header(this);
        return this._header;
    }

    /**
    * Gets the id for the Panel
    * @return {string} - the panel id
    */
    get id(): string {
        return this.element.attr('id');
    }

    /**
     * Throw an error when attempting to set a panel id, should be set when a panel is created.
     */
    set id(id: string) {
        throw new Error('API(panels): you cannot modify a panels id property.');
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

    private _initElements(id: string): void {
        //create panel components as HTMLElements
        this._element = $(document.createElement("div"));
        this.element.addClass('rv-content-pane layout-padding panel-contents');

        //this.panelControls = $(document.createElement("div"));
        //this.panelControls.addClass(['panel-controls', 'hidden']);

        this._body = $(document.createElement("div"));
        this.body.addClass(['panel-body']);

        this.element.attr('id', id);

        //append panel controls/body to panel contents ("shell")
        //this.panelContents.append(this.panelControls);
        this.element.append(this.body);
        this.element.addClass('hidden'); //hide panel before a call to open is made
        //append panel contents ("shell") to document fragment
        const documentFragment = document.createDocumentFragment();
        documentFragment.appendChild(this.element[0]);

        $(this.api.innerShell).append(documentFragment);
    }

    /**
     * Initialize rxJS subjects as observables and create panel elements on the DOM.
     *
     * @param id - the user defined ID name for this Panel
     */
    constructor(id: string, api?: Map) {
        if (api) {
            this.api = api;
        }

        this._initRXJS();
        this._initElements(id);
    }
}

export interface Panel {
    _api: Map;

    //HTML parent Components
    _element: JQuery<HTMLElement>;
    _body: JQuery<HTMLElement>;
    _header: Header;

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
    widthChanged: Observable<number>;
    heightChanged: Observable<number>;

    CloseButton: typeof CloseButton;
    ToggleButton: typeof ToggleButton;
    Button: typeof Button;
    Element: typeof Element;
}

Panel.prototype.CloseButton = CloseButton;
Panel.prototype.ToggleButton = ToggleButton;
Panel.prototype.Button = Button;
Panel.prototype.Element = Element;