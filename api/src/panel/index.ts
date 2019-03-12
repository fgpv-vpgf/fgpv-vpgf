import { Observable, Subject, Subscription } from 'rxjs';
import Button from './button';
import CloseButton from './button.close';
import ToggleButton from './button.toggle';
import Element from './element';
import Map from 'api/map';
import Header from './header';

export { default as Element } from './element';
export { default as CloseButton } from './button.close';
export { default as ToggleButton } from './button.toggle';

/**
 * This is the "main" panel file which defines the Panel class.
 *
 * ## Types
 *
 * A panel is one of three possible types:
 *
 * 1. Dialog - Opens over all other panels and disables all interaction with the viewer (via a transparent backdrop).
 * 2. Closeable - Has a close button in its header, opens over **persistent** panels and under a dialog.
 * 3. Persistent - Has no close button in its header, opens under all other panel types.
 *
 * **Note:** A dialog panel is always **closeable**.
 *
 * A panel type is **inferred** automatically by the API based on two conditions:
 *
 * 1. If the panel has no set position when it is opened it is a **dialog**.
 * 2. Otherwise it is **closeable** when the close button is present in its header, or **persistent** if not present.
 *
 *  ## Automatic collision handling
 *
 * When a **closeable** or **persistent** panel is open and another **closeable** or **persistent** panel is opened, the viewport size changes,
 * or a panel elements **style** property is altered, a check is run to determine if any panel is overlapping another and if so one of two things can happen:
 *
 * 1. The panel below the other can remain open (default behaviour)
 * 2. The panel below can chose to close by setting the `underlay` property on the panel instance to `false`.
 *
 * Since **persistent** panels always render below **closeable** panels, a **persistent** panel can never trigger a **closeable** panel to close.
 *
 * ### Offscreen
 *
 * When a **closeable** or **persistent** panel is opened, the viewport is resized, or a panel elements **style** property is altered such that
 * any part of it is rendered outside the viewport then an error is thrown and the panel is closed. This default behaviour can be disabled by setting
 * the `offscreen` property of the panel instance to `true`.
 *
 * ## Implementation
 *
 * All panels have a main `element` property. A `MutationObserver` watches for changes to the **style** property and executes the underlay and offscreen rule checks.
 * When a panel is opened all panels run their underlay rule checks with that panel to determine if they are affected by it.
 * Lastly, when the viewport size changes it executes the underlay and offscreen rule checks.
 *
 */
export class Panel {
    /**
     * Returns a [[Button]] class bound to this panel instance.
     */
    get Button() {
        return Button.bind(null, this);
    }

    /**
     * Returns a [[CloseButton]] class bound to this panel instance.
     */
    get CloseButton() {
        return CloseButton.bind(null, this);
    }

    /**
     * Returns a [[ToggleButton]] class bound to this panel instance.
     */
    get ToggleButton() {
        return ToggleButton.bind(null, this);
    }

    /**
     * Returns an [[Element]] class bound to this panel instance.
     */
    get Element() {
        return Element.bind(null, this);
    }

    private offScreenRuleCheck(errorMsg?: string) {
        if (!this.offscreen && this.element.is(':offscreen')) {
            this.close(true);

            if (errorMsg) {
                throw new Error(`API(panels): ${errorMsg}`);
            }
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

    /**
     * Returns true if the panel container takes up the entire viewport.
     */
    get isFullScreen() {
        return this.element && window.innerWidth <= 480 && (<any>this.element).width() === window.innerWidth && (<any>this.element).height() === window.innerHeight;
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

        // watch for 'style' property changes on a panels element and perform underlay rule checks + offscreen checks.
        this._observer = new MutationObserver(mutations => {
            mutations.forEach(mutationRecord => {
                if (mutationRecord.type == 'attributes') {
                    this.api.panels.forEach(p => p.underlayRuleCheck(this));
                    this.offScreenRuleCheck('Panel position was moved offscreen.');
                }
            });
        });
        this._observer.observe(this.element[0], { attributes : true, attributeFilter : ['style'] });

        this.openingSubject.next(this);
    }

    /**
    * Closes the panel permanently. Handles the graceful destruction of a panel instance by unhooking from various observers/streams/DOM/APIs etc.
    */
    close(silent: boolean = false): void {
        if (!silent) {
            this.closingSubject.next(this);
        }

        this.element.css({'display': 'none'});
    }

    destroy() {
        this.api.panels.splice(this.api.panels.findIndex(p => p === this), 1); // remove this panel from the API
        this.element.remove(); // remove element from the DOM
        this._observer.disconnect(); // disconnect the mutation observer
        this._openPanelSubscriber.unsubscribe(); // unsubscribe from panel opening stream
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

    /**
     * Initialize the various Subjects and Observables.
     */
    private _initRXJS(): void {
        this.openingSubject = new Subject();
        this.closingSubject = new Subject();
        this.positionChangedSubject = new Subject();
        this.widthChangedSubject = new Subject();
        this.heightChangedSubject = new Subject();

        this.opening = this.openingSubject.asObservable();
        this.closing = this.closingSubject.asObservable();
        this.positionChanged = this.positionChangedSubject.asObservable();
        this.widthChanged = this.widthChangedSubject.asObservable();
        this.heightChanged = this.heightChangedSubject.asObservable();
    }

    /**
     * Creates the various panel elements, styling, and DOM operations for placing the panel on the page.
     *
     * @param id A unique ID for the panel (and the DOM)
     */
    private _initElements(id: string): void {
        this._element = $(document.createElement("div"));
        this.element.addClass('rv-content-pane layout-padding panel-contents dialog');

        this._body = $(document.createElement("div"));
        this.body.addClass(['panel-body']);

        this.element.attr('id', id);
        this.element.append(this.body);
        this.element.css({'display': 'none'});
        const documentFragment = document.createDocumentFragment();
        documentFragment.appendChild(this.element[0]);

        $(this.api.innerShell).append(documentFragment);
    }

     /**
     * Executes the underlay rule logic which determines if the panel should remain open when another panel opens, or when the viewport size changes.
     *
     * When the viewport size changes, panels with a percentage based width/height and/or position can end up overlaying neighboring panels.
     *
     * @param otherPanel The overlaying panel instance
     */
    private underlayRuleCheck(otherPanel: Panel) {
        if (
            otherPanel === this || // cannot overlay oneself
            otherPanel.isDialog ||
            this.underlay ||
            this.element.css('z-index') > otherPanel.element.css('z-index') || // only enforce an overlap if the overlapping panel has a greater than or equal z-index (on top of - not below this panel)
            this.isFullScreen) {
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

    /**
     * Opens dialog panels.
     */
    private openDialog() {
        this.element.wrap('<div class="dialog-container"></div>');
        this.element.css({
            left: '25%',
            top: '25%'
        });
        this.header.closeButton;
        this.element.css({'display': ''});
        this._element = this.element.parent();
        this.element.prependTo($(this.api.innerShell).parent().parent());
    }

    /**
     * Opens closeable & persistent panels.
     */
    private openStandard() {
        this.element.css({'z-index': this.isCloseable ? 14 : 10});
        this.element.css({'display': ''});

        // this check must occur AFTER the element is placed in the DOM AND is visible.
        this.offScreenRuleCheck('Failed to open panel as all or part of it would render off the screen.');
    }

    /**
     * Initialize rxJS subjects as observables and create panel elements on the DOM.
     *
     * @param id - the user defined ID name for this Panel
     */
    constructor(id: string, api: Map) {
        this.api = api;

        this.underlay = true;
        this.offscreen = false;

        this._initRXJS();
        this._initElements(id);

        $( window ).resize(() => {
            this.offScreenRuleCheck();
            this.api.panels.forEach(p => this.underlayRuleCheck(p));
        });

        this._openPanelSubscriber = this.api.panelOpened.subscribe(otherPanel => {
            this.underlayRuleCheck(otherPanel);
        });
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
    _observer: MutationObserver;
    _openPanelSubscriber: Subscription;

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
}