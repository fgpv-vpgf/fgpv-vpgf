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

    /**
    * Returns controls for the Panel
    * @return {(PanelElem | Btn)[]} - a list of controls for the Panel.
    */
    get controls(): (PanelElem | Btn)[] {
        return this.controlList;
    }

    /**
    * Sets panel controls.
    * @param {(PanelElem | Btn)[]} elems - the array of control elements that are set as panel controls
    */
    set controls(elems: (PanelElem | Btn)[]) {
        this.panelControls.removeClass('hidden');
        this.controlList = elems;
        let body = this.panelBody;
        //First empty existing controls
        this.panelControls.html('');
        let panel = this;

        //then fill in new controls
        elems.forEach(elem => {
            this.panelControls.append(elem.elementAttr);

            //if the control is a close button, then open/close panel upon clicking
            if (elem instanceof Btn && elem.type === 'close') {
                elem.elementAttr.click(function () {
                    panel.close();
                });
            } else if (elem instanceof Btn && elem.type === 'toggle') {
                elem.elementAttr.click(function () {
                    // if user wants to expand panel
                    if (body.css('display') === 'none') {
                        body.css('display', 'block');
                        elem.contents = '<md-icon md-svg-src="content:remove"></md-icon>'; // update icon
                    } else {
                        body.css('display', 'none');
                        elem.contents = '<md-icon md-svg-src="content:add"></md-icon>'; // update icon
                    }
                });
            }
        });
    }

    /**
    * Opens the panel on the map. (For the user to see)
    */
    open(): void {
        //fires opening observable
        this.openingSubject.next();
        //changes position on map and updates panel registry
        this.panelContents.removeClass('hidden'); //hide panel before a call to open is made
    }

    /**
    * Closes the panel on the map. (For the user to see).
    */
    close(): void {
        
    }

    /**
    * Returns contents for panel
    */
    get content(): PanelElem {
        return this.contentAttr;
    }

    /**
    * Sets the contents for the Panel.
    * @param {PanelElem} content - the PanelElem to be used as panel's contents (scopes other PanelElems)
    */
    set content(content: PanelElem) {
        this.panelBody.removeClass('hidden');
        this.contentAttr = content;
        //First empty existing content
        this.panelBody.html('');
        //then fill in new contents
        this.panelBody.append(content.element);
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

    position(topLeft: number[], bottomRight: number[]): void {
        this.panelContents.css({
            top: topLeft[1] + 'px',
            left: topLeft[0] + 'px',
            width: bottomRight[0] - topLeft[0] + 'px'
        });

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

        this.elementAttr = this.angularCompiler($(element)[0]);

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

    elementAttr = $(`<md-button class="btn md-icon-button black rv-button-24"></md-button>`);
    type: string = 'custom';

    constructor(scope: Panel, type?: string) {
        super(scope);
        // close button
        if (type === 'X') {
            this.elementAttr.html('<md-icon md-svg-src="navigation:close"></md-icon>');
            this.type = 'close';
        }
        //toggle button
        else if (type === 'T') {
            this.elementAttr.html('<md-icon md-svg-src="content:remove"></md-icon>');
            this.type = 'toggle';
        
        } else {
            this.elementAttr.html(type || '');
        }

        this.setElement(this.elementAttr); // compiles the element
    }

    /**
    * Sets an icon for the Btn
    * @param {SVG} svg - the icon to be set for the Btn
    */
    set contents(contents: string | Node | HTMLElement | JQuery<HTMLElement>) {
        contents = $(contents);
        contents.addClass('svg-style');
        this.elementAttr.html('');

        contents.find(':first-child').addClass('svg-style');

        let compiledContents = this.angularCompiler(contents[0]);
        this.elementAttr.append(compiledContents);
    }

    /**
    * Sets text for the Btn
    * @param {string} txt - the text to be set for the Btn
    */
    set text(txt: string) {
        this.elementAttr.html(txt);
        this.elementAttr.addClass('text-btn');
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

Panel.prototype.openingSubject = new Subject();
Panel.prototype.closingSubject = new Subject();
Panel.prototype.positionChangedSubject = new Subject();
Panel.prototype.widthChangedSubject = new Subject();
Panel.prototype.heightChangedSubject = new Subject();

export interface PanelElem {
    idAttr: string;
    documentFragment: DocumentFragment;
    elementAttr: JQuery<HTMLElement>;
    angularCompiler: (html: Element) => JQuery<HTMLElement>
}
