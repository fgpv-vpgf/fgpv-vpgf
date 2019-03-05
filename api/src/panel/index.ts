import { Observable, Subject } from 'rxjs';
import Button from './button';
import CloseButton from './button.close';
import ToggleButton from './button.toggle';
import Element from './element';
import Map from 'api/map';
import Header from './header';

export { default as CloseButton } from './button.close';
export { default as ToggleButton } from './button.toggle';

export class Panel {

    private underlayRuleCheck(otherPanel: Panel) {
        if (otherPanel.isDialog || otherPanel.isCloseable !== this.isCloseable || this.underlay) {
            return;
        }

        const rect1 = this.element[0].getBoundingClientRect();
        const rect2 = otherPanel.element[0].getBoundingClientRect();

        const overlap = !(rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom);

        if (overlap) {
            this.close();
        }
    }

    set underlay(keepOpenWhenOverlaid: boolean) {
        this._underlay = keepOpenWhenOverlaid;
    }

    get underlay() {
        return this._underlay;
    }

    set offscreen(keepOpenWhenOffscreen: boolean) {
        this._offscreen = keepOpenWhenOffscreen;
    }

    get offscreen() {
        return this._offscreen;
    }

    set api(map: Map) {
        this._api = map;
    }

    get api() {
        return this._api;
    }

    /**
     * Returns true if the panel has a close button in its header. Dialog panels are always closeable.
     */
    get isCloseable() {
        return this.isDialog || (!!this._header && this._header.hasCloseButton);
    }

    /**
     * Returns true if the panel is a dialog.
     */
    get isDialog() {
        // if all properties have default values (0px) we consider this a dialog (non user defined position)
        return ['top', 'left', 'right', 'bottom']
            .map(t => this.element.css(t))
            .every( (val, i, arr) => val === '0px' && val === arr[0] );
    }

    private openDialog() {
        this.element.wrap('<div class="dialog-container"></div>');
        this.element.css({
            left: '25%',
            top: '25%'
        });
        this.header.closeButton;
        this._element = this.element.parent();
        this.element.prependTo($(this.api.innerShell).parent().parent());
    }

    private openStandard() {
        if (this.element.is(':offscreen')) {
            this.close(true);
            throw new Error('API(panels): Failed to open panel as all or part of it would render off the screen.');
        }

        this.element.css({'z-index': this.isCloseable ? 14 : 10});
    }

    /**
    * Opens the panel on the map. (For the user to see)
    */
    open(): void {
        if (this.isDialog) {
            this.openDialog();
        } else {
            this.openStandard();
        }

        this.openingSubject.next(this);
    }

    /**
    * Closes the panel on the map. (For the user to see).
    */
    close(silent: boolean = false): void {
        if (!silent) {
            this.closingSubject.next(this);
        }

        this.element.remove();
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
        const element = new Element(this, content);
        this.body.html( element.elem );
        element.panel = this;
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
        this.element.addClass('rv-content-pane layout-padding panel-contents dialog');

        //this.panelControls = $(document.createElement("div"));
        //this.panelControls.addClass(['panel-controls', 'hidden']);

        this._body = $(document.createElement("div"));
        this.body.addClass(['panel-body']);

        this.element.attr('id', id);

        //append panel controls/body to panel contents ("shell")
        //this.panelContents.append(this.panelControls);
        this.element.append(this.body);
        //this.element.addClass('hidden'); //hide panel before a call to open is made
        //append panel contents ("shell") to document fragment
        const documentFragment = document.createDocumentFragment();
        documentFragment.appendChild(this.element[0]);

        $(this.api.innerShell).append(documentFragment);

        $( window ).resize(() => {
            if (!this.offscreen && this.element.is(':offscreen')) {
                this.close();
            }

            this.api.panels.forEach(p => this.underlayRuleCheck(p));
        });

        this.api.panelOpened.subscribe(otherPanel => {
            if (this === otherPanel) {
                return;
            }

            this.underlayRuleCheck(otherPanel);
        });
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

        this.underlay = true;
        this.offscreen = false;

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
    _underlay: boolean;
    _offscreen: boolean;

    //subjects initialized for observables that are fired through method calls
    openingSubject: Subject<any>;
    closingSubject: Subject<any>;
    positionChangedSubject: Subject<any>;
    widthChangedSubject: Subject<any>;
    heightChangedSubject: Subject<any>;

    //user accessible observables
    opening: Observable<Panel>;
    closing: Observable<Panel>;
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