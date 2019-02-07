import { Observable, Subject } from 'rxjs';
import Map from 'api/map';

export class Panel {
    /**
     * Creates a new Panel.
     * @param {string}  id      - the user defined ID name for this Panel
     * @param {Map}     map     - the map instance that this Panel resides on
     */
    constructor(id: string, map: Map) {
        //init class attributes
        this.idAttr = id;
        this.mapObject = map;

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

        //create panel components and document fragment
        this.createElements();
    }

    /**
    * Returns the Map object for this panel, used in set height and set width of the PanelPositions class.
    * @return {Map} - the Map object for this Panel.
    */
    get map(): Map {
        return this.mapObject;
    }

    /**
    * Returns a newly created Btn
    */
    get button() {
        return Btn.bind(null, this);
    }

    /**
    * Returns a newly created PanelElem
    * @param {string | HTMLElement | JQuery<HTMLElement>} element - the element to be scoped by the PanelElem
    * @return {Btn} - the PanelElem that was created.
    */
    get container() {
        return PanelElem.bind(null, this);
    }

    private createElements(): void {
        //create panel components as HTMLElements
        this.panelContents = $(document.createElement("div"));
        this.panelContents.addClass('panel-contents');

        this.panelControls = $(document.createElement("div"));
        this.panelControls.addClass(['panel-controls', 'hidden']);

        this.panelBody = $(document.createElement("div"));
        this.panelBody.addClass(['panel-body', 'hidden']);

        this.panelContents.attr('id', this.idAttr);

        //append panel controls/body to panel contents ("shell")
        this.panelContents.append(this.panelControls);
        this.panelContents.append(this.panelBody);
        this.panelContents.addClass('hidden'); //hide panel before a call to open is made
        //append panel contents ("shell") to document fragment
        this.documentFragment = document.createDocumentFragment();
        this.documentFragment.appendChild(this.panelContents[0]);

        $(this.mapObject.innerShell).append(this.documentFragment);
    }

    getControls(): (PanelElem | Btn)[] {
        return this.controlList;
    }

    setControls(elems: (PanelElem | Btn | string | HTMLElement | JQuery<HTMLElement>)[]) {
        this.panelControls.removeClass('hidden');
        this.controlList = elems.map(e => this.isPanelElem(e) ? e : new this.container(e));

        //First empty existing controls
        this.panelControls.html('');

        //then fill in new controls
        this.controlList.forEach(elem => {
            this.panelControls.append(elem.elementAttr);
        });
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
    isPanelElem(content: PanelElem | string | HTMLElement | JQuery<HTMLElement>): content is PanelElem {
        return !!(<PanelElem>content).element;
    }

    /**
     * Sets the panel body to the provided content.
     * 
     * @param content   panel body content
     */
    setBody(content: PanelElem | string | HTMLElement | JQuery<HTMLElement>) {
        const pElemContent = this.isPanelElem(content) ? content : new this.container(content);
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
        return this.idAttr;
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
}

/**
 * PanelElems can be set as the contents or controls of the Panel.
 */
export class PanelElem {
    panel: Panel;
    /**
    * Constructs PanelElem object
    * @constructor
    * @param {string | HTMLElement | JQuery<HTMLElement>} [element] - element to be set as PanelElem (strings assumed to be titles)
    *                                                               - not to be specified for Btns    */
    constructor(panel: Panel, element?: string | HTMLElement | JQuery<HTMLElement>) {
        this.panel = panel;
        if (element)
            this.setElement(element);
    }

    set title(title: string) {
        this.elementAttr = $('<h2 style="font-weight: normal;display:inline;vertical-align: middle;">' + title + '</h2>');
    }

    get divider(): JQuery<HTMLElement> {
        return $('<div class="divider"></div>');
    }

    /**
    * Helper method, sets PanelElem object
    * @param {(string | HTMLElement | JQuery<HTMLElement>)} [element] - element to be set as PanelElem
    *                                                                 - parameter should always be set if directly accessing PanelElem class (not from Btn)
    * @throws {Exception} - cannot have multiple top level elements.
    */
    setElement(element: string | HTMLElement | JQuery<HTMLElement>): void {

        this.elementAttr = $(element);
        this.panel.map.$compile(this.elementAttr[0]);

        //If element already has id attribute, set id to that id, otherwise set to randomly generated id
        if (this.elementAttr !== undefined && this.elementAttr.attr('id') !== undefined) {
            this.idAttr = this.elementAttr.attr('id');
        }
        else {
            this.idAttr = "PanelElem" + Math.round(Math.random() * 10000).toString(); //random id autogenerated
            this.elementAttr.attr('id', this.idAttr);
        }

        //Adds elem style from stylesheet
        this.elementAttr.addClass("elem");
    }

    /**
    * Gets the id of PanelElem object.
    * @return {string} - the id of this PanelElem.
    */
    get id(): string {
        return this.idAttr;
    }

    /**
    * Gets element of PanelElem object.
    * @return {JQuery<HTMLElement>} - this element that the PanelElem scopes.
    */
    get element(): JQuery<HTMLElement> {
        return this.elementAttr;
    }
}

class Btn extends PanelElem {
    constructor(scope: Panel, type?: string) {
        const buttonType = type === 'X' ? 'contentPane.aria.close' : 'toggle'; // TODO: add translation for toggle
        super(scope, `<div><md-button class="btn md-icon-button black rv-button-24" aria-label="{{ '${buttonType}' | translate }}"></md-button></div>`);
        // close button
        if (type === 'X') {
            this.contents = `<md-icon md-svg-src="navigation:close"><md-tooltip>{{ 'contentPane.tooltip.close' | translate }}</md-tooltip></md-icon>`;
            $(this.panel.panelContents).on('click', '#' + this.id, () => {
                this.panel.close();
            });
        }
        //toggle button
        else if (type === 'T') {
            this.contents = '<md-icon md-svg-src="content:remove"></md-icon>';
            $(this.panel.panelContents).on('click', '#' + this.id, () => {
                // if user wants to expand panel
                if (this.panel.panelBody.css('display') === 'none') {
                    this.panel.panelBody.css('display', 'block');
                    this.contents = '<md-icon md-svg-src="content:remove"></md-icon>'; // update icon
                } else {
                    this.panel.panelBody.css('display', 'none');
                    this.contents = '<md-icon md-svg-src="content:add"></md-icon>'; // update icon
                }
            });

        } else {
            this.elementAttr.html(type || '');
        }

    }

    /**
    * Sets an icon for the Btn
    * @param {SVG} svg - the icon to be set for the Btn
    */
    set contents(contents: string | Node | HTMLElement | JQuery<HTMLElement>) {
        contents = $((<any>contents));

        this.panel.map.$compile(contents[0]);
        $(this.elementAttr.children('button')[0]).html(contents[0]);
    }

    /**
    * Sets text for the Btn
    * @param {string} txt - the text to be set for the Btn
    */
    set text(txt: string) {
        let buttonElement = $(this.elementAttr.children('button')[0]);
        buttonElement.html(txt);
        buttonElement.addClass('text-btn');
    }
}

export interface Panel {

    idAttr: string;

    //Panel items
    contentAttr: PanelElem;
    controlList: (PanelElem)[];

    //HTML parent Components
    panelContents: JQuery<HTMLElement>;
    panelControls: JQuery<HTMLElement>;
    panelBody: JQuery<HTMLElement>;
    documentFragment: DocumentFragment;

    mapObject: Map;

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

export interface PanelElem {
    idAttr: string;
    documentFragment: DocumentFragment;
    elementAttr: JQuery<HTMLElement>;
}
