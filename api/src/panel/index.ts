import { Observable, Subject, Subscription } from 'rxjs';
import Button from './button';
import CloseButton from './button.close';
import ToggleButton from './button.toggle';
import Element from './element';
import { Map as ViewerAPI } from 'api/map';
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
 * 2. The panel below can chose to close by setting the `allowUnderlay` property on the panel instance to `false`.
 *
 * Since **persistent** panels always render below **closeable** panels, a **persistent** panel can never trigger a **closeable** panel to close.
 *
 * ### Offscreen
 *
 * When a **closeable** or **persistent** panel is opened, the viewport is resized, or a panel elements **style** property is altered such that
 * any part of it is rendered outside the viewport then an error is thrown and the panel is closed. This default behaviour can be disabled by setting
 * the `allowOffscreen` property of the panel instance to `true`.
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

    set allowUnderlay(allow: boolean) {
        this._underlay = allow;
    }

    get allowUnderlay() {
        return this._underlay;
    }

    set allowOffscreen(allow: boolean) {
        this._offscreen = allow;
    }

    get allowOffscreen() {
        return this._offscreen;
    }

    set reopenAfterOverlay(reopen: boolean) {
        this._reopenAfterOverlay = reopen;
    }

    get reopenAfterOverlay() {
        return this._reopenAfterOverlay;
    }

    set api(api: ViewerAPI) {
        this._api = api;
    }

    get api() {
        return this._api;
    }

    /**
     * Returns true if the panel has a close button in its header. Dialog panels are always closeable.
     */
    get isCloseable() {
        return this.isDialog || this._isCloseable || (!!this._header && this._header.hasCloseButton);
    }

    /**
     * Manually flag a panel as closeable when there is an alternative way to close the panel through
     * the UI.
     */
    set isCloseable(closeable: boolean) {
        this._isCloseable = closeable;
    }

    get isClosed() {
        return this.element.css('visibility') === 'hidden';
    }

    get isOpen() {
        return !this.isClosed;
    }

    /**
     * Returns true if the panel is a dialog.
     */
    get isDialog() {
        return this._isDialog;
    }

    /**
     * Returns true if the panel container takes up the entire viewport.
     */
    get isFullScreen() {
        return this.element && (<any>this.element).width() === this.api.innerShell.clientWidth && (<any>this.element).height() === this.api.innerShell.clientHeight;
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
                    // scan the attribute change to style to see if anything we care about changed, otherwise ignore. Performance optimization.
                    const changedCSS = ['top', 'left', 'right', 'bottom', 'width', 'height'].filter(t => {
                        const styleValue = this.element.css(t);
                        if (styleValue !== this._style[t]) {
                            this._style[t] = styleValue;
                            return true;
                        } else {
                            return false;
                        }
                    });

                    if (changedCSS.length > 0) {
                        this.api.panels.all.forEach(p => p.underlayRuleCheck(this));
                        this.offScreenRuleCheck('Panel position was moved offscreen.');
                        this.api.panels.reopenOverlay();
                    }
                }
            });

        });
        this._observer.observe(this.element[0], { attributes: true, attributeFilter: ['style'] });

        this.openingSubject.next(this);
    }

    /**
     * Closes the panel and removes it from the dom.
     * By default, calling close also destroys it meaning it can no longer be used. To prevent panel destruction set `destroy` to `false`.
     *
     * @param opts closing option:
     *      - destroy: true to destroy the panel
     *      - silent: when true, do not emit a closing event
     *      - closingCode: a code indicating why the panel was closed
     *      - otherPanel: sometimes a panel causes another to be closed, provided for context
     */
    close(opts?: ClosingOpts): void {
        opts = opts ? opts : { destroy: false, silent: false };

        if (this.isClosed) {
            return;
        }

        try {
            this._observer.disconnect(); // disconnect the mutation observer
        } catch {
            // nothing to do, observer is already disconnected.
        }
        this.element.css('visibility', 'hidden');
        this.api.mapI.releaseAppbarTitle(this);

        if (!opts.silent) {
            const closingResponse: ClosingResponse = {
                code: opts.closingCode ? opts.closingCode : CLOSING_CODES.OTHER,
                panel: this
            };

            if (opts.otherPanel) {
                closingResponse.otherPanel = opts.otherPanel;
            }

            this.closingSubject.next(closingResponse);
        }

        try {
            if (opts.destroy) {
                this.destroy();
            }
        } catch (err) {
            // Do nothing
        }
    }

    toggle() {
        if (this.isClosed) {
            this.open();
        } else {
            this.close({ 'destroy': false });
        }
    }

    reopen() {
        if (!this.api.panels.opened.find(p => this.underlayRuleCheck(p, false))) {
            this.open();
        }
    }

    set body(content: any) {
        const element = new Element(this, content);
        this.body.html(element.elem);
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

    private offScreenRuleCheck(errorMsg?: string) {
        if (!this.isDialog && !this.allowOffscreen && this.element.is(':offscreen')) {
            this.close({ closingCode: CLOSING_CODES.OFFSCREEN });

            if (errorMsg) {
                throw new Error(`API(panels): ${errorMsg}`);
            }
        }
    }

    /**
     * Handles the graceful destruction of a panel instance by unhooking from various observers/streams/DOM/APIs etc.
     */
    private destroy() {
        this.close();
        this.api.panels.all.splice(this.api.panels.all.findIndex(p => p === this), 1); // remove this panel from the API
        this.element.remove(); // remove element from the DOM
        this._openPanelSubscriber.unsubscribe(); // unsubscribe from panel opening stream
        this.element.off('click');
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
        this.listInit = new Subject();

        this.opening = this.openingSubject.asObservable();
        this.closing = this.closingSubject.asObservable();
        this.positionChanged = this.positionChangedSubject.asObservable();
        this.widthChanged = this.widthChangedSubject.asObservable();
        this.heightChanged = this.heightChangedSubject.asObservable();
        this.populateList = this.listInit.asObservable();
    }

    /**
     * Creates the various panel elements, styling, and DOM operations for placing the panel on the page.
     *
     * @param id A unique ID for the panel (and the DOM)
     */
    private _initElements(id: string): void {
        this._element = $(document.createElement("div"));
        this.element.addClass('rv-content-pane layout-padding panel-contents');

        this._body = $(document.createElement("div"));
        this.body.addClass(['panel-body']);

        this.element.attr('id', id);
        this.element.append(this.body);
        this.element.css({ 'visibility': 'hidden' });
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
    private underlayRuleCheck(otherPanel: Panel, close = true) {
        if (
            otherPanel === this || // cannot overlay oneself
            otherPanel.isDialog ||
            otherPanel.isClosed ||
            this.allowUnderlay ||
            this.element.css('z-index') > otherPanel.element.css('z-index') || // only enforce an overlap if the overlapping panel has a greater than or equal z-index (on top of - not below this panel)
            this.isFullScreen) {
            return false;
        }

        const rect1 = this.element[0].getBoundingClientRect();
        const rect2 = otherPanel.element[0].getBoundingClientRect();

        const overlap = !(rect1.right <= rect2.left ||
            rect1.left >= rect2.right ||
            rect1.bottom <= rect2.top ||
            rect1.top >= rect2.bottom);

        if (overlap && close) {
            this.close({ closingCode: CLOSING_CODES.OVERLAID, otherPanel: otherPanel });
        }

        return overlap;
    }

    /**
     * Opens dialog panels.
     */
    private openDialog() {
        this.element.addClass('dialog');
        this.element.wrap('<div class="dialog-container"></div>');

        this.header.closeButton;
        this.element.css({ 'visibility': '' });
        this._element = this.element.parent();
        this.element.prependTo($(this.api.innerShell).parent().parent());

        // position so backdrop only blocks the inner shell portion of the page.
        const innerShellDimensions = this.api.innerShell.getBoundingClientRect();
        this.element.css({
            top: innerShellDimensions.top,
            left: innerShellDimensions.left,
            bottom: innerShellDimensions.bottom,
            right: innerShellDimensions.right
        });

        // close the dialog when clicking on the backdrop
        this.element.on('click', evt => {
            if ($(evt.target).is(this.element)) {
                this.close({ closingCode: CLOSING_CODES.CLICKEDOUTSIDE });
            }
        });
    }

    /**
     * Opens closeable & persistent panels.
     */
    private openStandard() {
        this.element.css({ 'z-index': this.isCloseable ? 14 : 10 });
        this.element.css({ 'visibility': '' });

        // this check must occur AFTER the element is placed in the DOM AND is visible.
        this.offScreenRuleCheck('Failed to open panel as all or part of it would render off the screen.');
    }

    /**
     * Initialize rxJS subjects as observables and create panel elements on the DOM.
     *
     * @param id - the user defined ID name for this Panel
     */
    constructor(id: string, api: ViewerAPI, panelType: PanelTypes) {
        this.api = api;

        this.appBar = new appBar(this);

        this.allowUnderlay = true;
        this.allowOffscreen = false;
        this.reopenAfterOverlay = false;
        this._isDialog = (panelType === PanelTypes.Dialog);

        this._style = {};
        this._initRXJS();
        this._initElements(id);

        $(window).resize(() => {
            this.offScreenRuleCheck();
            this.api.panels.all.forEach(p => this.underlayRuleCheck(p));
        });

        this._openPanelSubscriber = this.api.panels.opening.subscribe((otherPanel: Panel) => {
            this.underlayRuleCheck(otherPanel);
        });
    }
}

export interface Panel {
    _api: ViewerAPI;
    _style: {
        [index: string]: string | undefined;
        top?: string;
        bottom?: string;
        left?: string;
        right?: string;
        width?: string;
        height?: string;
    };
    _reopenAfterOverlay: boolean;
    _isDialog: boolean;
    _isCloseable: boolean;

    //HTML parent Components
    _element: JQuery<HTMLElement>;
    _body: JQuery<HTMLElement>;
    _header: Header;
    _underlay: boolean;
    _offscreen: boolean;
    _observer: MutationObserver;
    _openPanelSubscriber: Subscription;

    //subjects initialized for observables that are fired through method calls
    openingSubject: Subject<Panel>;
    closingSubject: Subject<ClosingResponse>;
    positionChangedSubject: Subject<any>;
    widthChangedSubject: Subject<any>;
    heightChangedSubject: Subject<any>;
    listInit: Subject<any>;

    //user accessible observables
    opening: Observable<Panel>;
    closing: Observable<ClosingResponse>;
    positionChanged: Observable<[number, number]>; //top left, bottom right
    widthChanged: Observable<number>;
    heightChanged: Observable<number>;
    populateList: Observable<any>;

    appBar: appBar;
}

class appBar {
    set title(title: string) {
        this.panel.api.mapI.setAppbarTitle(this.panel, title);
    }

    constructor(panel: Panel) {
        this.panel = panel;
    }
}

interface appBar {
    panel: Panel;
}

export enum CLOSING_CODES {
    OFFSCREEN = 'offscreen',
    OVERLAID = 'overlaid',
    CLOSEBTN = 'closebtn',
    CLICKEDOUTSIDE = 'clickedoutside',
    OTHER = 'other'
};

export interface ClosingResponse {
    code: CLOSING_CODES;
    panel: Panel;
    otherPanel?: Panel;
}

export enum PanelTypes {
    Panel,
    Dialog
}

interface ClosingOpts {
    destroy?: boolean,
    silent?: boolean,
    closingCode?: CLOSING_CODES,
    otherPanel?: Panel
}
