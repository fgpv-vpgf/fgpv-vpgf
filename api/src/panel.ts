import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import Map from 'api/map';
import { S_IFMT } from 'constants';

/**
 * Panel is a box to be displayed on the map. It can be positioned, sized, and has contents and controls. 
 *
 * Panels are sized and positioned relative to the map they are on. Each map instance can be thought of as a 20 x 20 grid. 
 * - Rows and columns on this grid are numbered from 0-19
 * - Each grid square gets a number from (0 - 399) with 400 squares in total
 * - A grid square width is 5% of the map width
 * - A grid square height is 5% of the map height
 * - Thus if the width and height of the map are not equal, these "squares" are actually rectangles!
 * - A panel with the position (25, 149) has: 
 *      - top-left corner: 2nd row, 6th column
 *      - bottom-right corner: 8th row, 10th column
 * 
 * Panels require a map instance upon creation. While this can be manually passed in by the user, a new Panel is easily created like so:
 * ```js
 * mapInstance.createPanel('panelID');   //do this
 * let panel = new Panel('panelID', mapInstance); //instead of this
 * ``` 
 * 
 * Map instances track panels through their panelRegistry. Thus to retrieve a panel on a map, the following can be done:
 * ```js
 * mapInstance.panelRegistry[2]; // retrieves the third panel added to the map instance
 * ```
 */
export class Panel {

    private _id: string;

    //Panel items
    private _content: PanelElem;
    private _controls: (PanelElem)[];

    //HTML parent Components
    private _panel_contents: HTMLElement;
    private _panel_controls: HTMLElement;
    private _panel_body: HTMLElement;
    private _document_fragment: DocumentFragment;
    private _separator: HTMLElement;

    private _map_width: number | undefined;
    private _map_height: number | undefined;

    private _map_object: Map;

    private _width: number | string | undefined;
    private _height: number | string | undefined;

    private _contentsHeight: number;
    private _hidden: boolean;

    //subjects initialized for observables that are fired through method calls
    private _opening: Subject<any> = new Subject();
    private _closing: Subject<any> = new Subject();
    private _positionChanged: Subject<any> = new Subject();
    private _widthChanged: Subject<any> = new Subject();
    private _heightChanged: Subject<any> = new Subject();

    private _panel_positions: PanelPositions;

    _open: boolean; //whether panel is open or closed 

    //user accessible observables 
    opening: Observable<any>;
    closing: Observable<any>;
    positionChanged: Observable<[number, number]>; //top left, bottom right
    widthChanged: Observable<number>
    heightChanged: Observable<number>


    /**
+    * Creates a new Panel.
+    * @constructor
+    * @param {string} id - the user defined ID name for this Panel
     * @param {Map} map - the map instance that this Panel resides on
+    */
    constructor(id: string, map: Map) {

        //init class attributes
        this._id = id;
        this._open = false;
        this.opening = this._opening.asObservable();
        this.closing = this._closing.asObservable();
        this.positionChanged = this._positionChanged.asObservable();
        this.widthChanged = this._widthChanged.asObservable();
        this.heightChanged = this._heightChanged.asObservable();
        this._map_object = map;
        this._map_height = $(this._map_object.innerShell).height();
        this._map_width = $(this._map_object.innerShell).width();

        //create panel components and document fragment
        this.createPanelComponents();

        this._panel_positions = new PanelPositions(this);
        this._hidden = false;

    }

    /**
    * Returns the Map object for this panel, used in set height and set width of the PanelPositions class.
    * @return {Map} - the Map object for this Panel. 
    */
    get map(): Map {
        return this._map_object;
    }


    /**
    * Helper method to see observables firing in console.
    * To be removed when API is finished. 
    */
    observableSubscribe(): void {
        this.opening.subscribe(val => console.log("Panel opening..."));
        this.closing.subscribe(val => console.log("Panel closing..."));
        this.positionChanged.subscribe(pos => console.log([pos, 'position changed!']));
        this.widthChanged.subscribe(width => console.log([width, 'width changed!']));
        this.heightChanged.subscribe(height => console.log([height, 'height changed!']));
    }

    /**
    * Returns the PanelPositions object for this panel
    * @return {PanelPositions} - the PanelPositions object for this Panel. 
    */
    get panelPositions(): PanelPositions {
        return this._panel_positions;
    }

    /**
    * Helper method to create panel components and the document fragment, and to specify panel behaviour on window resize.
    * @private
    */
    private createPanelComponents(): void {

        //create panel components as HTMLElements
        this._panel_contents = document.createElement("div");
        this._panel_contents.classList.add('panel-contents');

        this._panel_controls = document.createElement("div");
        this._panel_controls.classList.add('panel-controls');
        this._panel_controls.classList.add('hidden');

        this._panel_body = document.createElement("div");
        this._panel_body.classList.add('panel-body');
        this._panel_body.classList.add('hidden');

        this._separator = document.createElement('div');
        this._separator.classList.add('separator');


        this._panel_contents.setAttribute('id', this._id.toString());

        //append panel controls/body to panel contents ("shell")
        this._panel_contents.appendChild(this._panel_controls);
        this._panel_contents.appendChild(this._separator);
        this._panel_contents.appendChild(this._panel_body);
        this._panel_contents.classList.add('hidden'); //hide panel before a call to open is made
        //append panel contents ("shell") to document fragment
        this._document_fragment = document.createDocumentFragment();
        this._document_fragment.appendChild(this._panel_contents);

        $(this._map_object.innerShell).append(this._document_fragment);

        let panel = this;

        $(window).resize(function () {

            let panelCoords = panel._panel_positions.panelCoords;
            let parentHeight = $(panel._map_object.innerShell).height();
            let parentWidth = $(panel._map_object.innerShell).width();
            let controlsHeight = $(panel._panel_controls).height();

            //if current width is different from stored width, fire width changed
            if (panel._map_width !== parentWidth && parentWidth !== undefined) {
                panel._widthChanged.next(parentWidth * 0.05);
                panel._map_width = parentWidth;
            }

            //if current height is different from stored height, fire height changed
            else if (panel._map_height !== parentHeight && parentHeight !== undefined) {
                panel._heightChanged.next(parentHeight * 0.05);
                panel._map_height = parentHeight;
            }

            //changes width/height to new percentage value of the map
            panel.changePosition();

            //need to preserve previously defined width and height of panel
            if (panel._width !== undefined && panel._height !== undefined) {
                panel.width = panel._width;
                panel.height = panel._height;
            }

            //ensures that toggle (open/close of panel body) is preserved during position change 
            if (parentHeight !== undefined) {
                panel._contentsHeight = ((panelCoords[3] - panelCoords[1] - 1) * 0.05 * parentHeight);

                if (panel._panel_body.classList.contains('hidden') && controlsHeight !== undefined) {
                    panel._panel_contents.style.height = controlsHeight.toString() + 'px';
                }
                else {
                    panel._panel_contents.style.height = (panel._contentsHeight + 0.1 * parentHeight).toString() + "px";
                }
            }
        });
    }

    /**
    * Returns an array of arrays representing each grid square. An array value can be the following:
    * -1 : Invalid panel position (not coverable because it is some panel's min position, or user wants this area empty)
    * 0 : Valid panel position (no panels set in this area)
    * 1+: Valid panel position with 1 or more other panels capable of covering it (panel is here, but coverable)
    *
    * If width and/or height are not provided the width/height can be computed from the panel position. 
    * If position is not set throw an error
    * 
    * "If a panel of this dimension were to use this grid square as its top left corner would it fit?" computation based on using grid square as its top left position
    * 
    * @param {Panel[]} panelRegistry - the list of all the other Panels on the map instance
    * @param {number} width - the Panel width
    * @param {number} height - the Panel height
    * @param {Panel} [panel] - the Panel instance to check available spaces for
    * @return {number[][]} - array of arrays representing each grid square 
    * @throws {Exception} - map instance is not set, cannot retrieve grid.
    */

    static availableSpaces(panelRegistry: Panel[], width: number, height: number, panel?: Panel): number[][] {

        return PanelPositions.availableSpaces(panelRegistry, width, height, panel);
    }


    /**
    * Non static version of the method. Calculates available spaces on the grid for a specific panel instance based on:
    *                                   - Panel position
    *                                   - user supplied width and height
    *                                   - a 1x1 panel if no height/width/position are set
    * @param {number} [width] - user specified width for available space calculations
    * @param {number} [height] - user specified height for available space calculations 
    * @return {number[][]} - array of arrays representing each grid square 
    * @throws {Exception} - panel's map instance is undefined.
    */
    availableSpaces(width?: number, height?: number): number[][] {

        if (this._map_object === undefined) {
            throw "Exception: this panel's map is not set; cannot retrieve grid.";
        }

        //if no position, width or height set calculate based on a 1x1 panel
        if (this.panelPositions.panelCoords[0] === undefined && this.panelPositions.panelCoords[1] === undefined && this.panelPositions.panelCoords[2] === undefined && this.panelPositions.panelCoords[3] === undefined && width === undefined && height === undefined) {

            return Panel.availableSpaces(this._map_object.panelRegistry, 1, 1);
        }
        else {
            //calculate based on user supplied width and height
            if (width !== undefined && height !== undefined) {
                return Panel.availableSpaces(this._map_object.panelRegistry, width, height, this);
            }
            else {
                //calculate based on width and height from panel position
                return Panel.availableSpaces(this._map_object.panelRegistry, this.panelPositions.panelCoords[2] - this.panelPositions.panelCoords[0] + 1, this.panelPositions.panelCoords[3] - this.panelPositions.panelCoords[1] + 1, this);
            }
        }
    }

    /**
    * Returns controls for the Panel
    * @return {(PanelElem | Btn)[]} - a list of controls for the Panel. 
    */
    get controls(): (PanelElem | Btn)[] {
        return this._controls;
    }

    /**
    * Sets panel controls. 
    * @param {(PanelElem | Btn)[]} elems - the array of control elements that are set as panel controls
    */
    set controls(elems: (PanelElem | Btn)[]) {
        this._panel_controls.classList.remove('hidden');
        this._controls = elems;
        let body = this._panel_body;
        //First empty existing controls
        this._panel_controls.innerHTML = '';
        let panel = this;

        //then fill in new controls
        for (let elem of elems) {
            $(this._panel_controls).append(elem._element.get(0));
            elem._element.get(0).classList.add('inline');

            //if the control is a close button, then open/close panel upon clicking
            if (elem._element.get(0).classList.length === 4 && elem._element.get(0).classList[1] === "close-btn") {
                $(elem._element.get(0)).click(function () {
                    panel.close();
                });
            }
            //if the control button is a toggle button, then allow it to toggle visibility of panel body
            else if (elem._element.get(0).classList.length === 4 && elem._element.get(0).classList[1] === "toggle-btn") {
                $(elem._element.get(0)).click(function () {
                    
                    //initialize attributes
                    let minusSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,13H5V11H19V13Z"/></svg>')[0];
                    let plusSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>')[0];
                    let btn = new Btn();
                    btn._element.addClass('btn');
                    btn._element.addClass('toggle-btn');
                    elem._element.get(0).removeChild(<HTMLElement>elem._element.get(0).firstChild);
                    let controls = $(panel._panel_controls).height();
                    let parentHeight = panel._map_height;

                    // if user wants to expand panel
                    if (body.classList.contains('hidden')) {
                        body.classList.remove('hidden');
                        btn.icon = <SVGElement>minusSVG;
                        panel._hidden = false;
                        elem._element.get(0).appendChild(minusSVG);
                        if (panel._contentsHeight !== undefined && parentHeight !== undefined) {
                            panel._panel_contents.style.height = (panel._contentsHeight + parentHeight * 0.10).toString() + 'px';
                        }
                    }
                    //if user wants to shrink panel
                    else {
                        body.classList.add('hidden');
                        let btn = new Btn();
                        btn.icon = <SVGElement>plusSVG;                        
                        panel._hidden = true;
                        elem._element.get(0).appendChild(plusSVG);
                        if (controls !== undefined){
                            panel._panel_contents.style.height = controls.toString() + 'px';
                        }            
                    }
                });
            }
        }
    }


    /**
    * Opens the panel on the map. (For the user to see)
    * @throws {Exception} - panel positon is not set. 
    * @throws {Exception} - panel has not been added to the map instance.
    * 
    */
    open(): void {

        let panelCoords = this._panel_positions.panelCoords;

        if (this._map_object !== undefined) {

            //check to see panel position is set
            if (panelCoords[0] !== undefined && panelCoords[1] !== undefined && panelCoords[2] !== undefined && panelCoords[3] !== undefined) {

                //check to see if panel position is out of bounds of grid 
                if (this._panel_positions.checkOutOfBounds(false, panelCoords[0], panelCoords[1], panelCoords[2], panelCoords[3]) === false) {

                    //If there is no conflict with an existing panel, allow the panel to open
                    if (!this.conflictDetected()) {

                        //fires opening observable
                        this._opening.next()

                        //changes position on map and updates panel registry
                        this.changePosition();
                        this._panel_contents.classList.remove('hidden'); //hide panel before a call to open is made

                        if (this._hidden) {
                            this._panel_contents.style.height = (<number>$(this._panel_controls).height()).toString() + 'px';
                        }

                        this._open = true;
                    }
                }
            }
            else {
                throw "Exception: Panel position is not set. Set position before opening panel.";
            }
        }
        else {
            throw "Exception: Panel can't be opened if it has not been added to a map."
        }
    }

    /**
    * Helper method to open(). Detects a conflict where an opening panel interferes with the opening of another panel. 
    * @returns {boolean} - returns false if conflict is not detected
    * @private
    */
    private conflictDetected(): boolean {

        //first check all currently open panels for panel's min position, if conflict then throw exception
        for (let panel of this._map_object.panelRegistry) {
            if (panel._open === true && panel !== this) {
                this._panel_positions.conflictDetected(panel);
            }
        }
        return false;
    }

    /**
    * Closes the panel on the map. (For the user to see).
    * @throws {Exception} - panel is either: not added to the map, doesn't have a position set, is not open.
    */
    close(): void {
        let panelCoords = this._panel_positions.panelCoords;

        //if the map doesn't exist or the position hasn't been set then the map hasn't been added to a map
        if (this._map_object !== undefined && panelCoords[0] !== undefined && panelCoords[1] !== undefined && panelCoords[2] !== undefined && panelCoords[3] !== undefined && this._open === true) {
            this._closing.next();
            this._panel_contents.classList.add('hidden');
            this._open = false;
        }
        else {
            throw "Exception: can't close a panel that has not been added to a map, whose position is not set or that is not open.";
        }
    }

    /**
    * Returns contents for panel
    * @return {PanelElem} - the PanelElem that scopes the Panel's contents
    */
    get content(): PanelElem {
        return this._content;
    }

    /**
    * Sets the contents for the Panel
    * @param {PanelElem} content - the PanelElem to be used as panel's contents (scopes other PanelElems)
    */
    set content(content: PanelElem) {

        this._panel_body.classList.remove('hidden');

        this._content = content;

        //First empty existing content
        this._panel_body.innerHTML = '';

        //then fill in new contents
        $(this._panel_body).append(content.element);
    }

    /**
    * Gets the id for the Panel
    * @return {string} - the panel id
    */
    get id(): string {
        return this._id;
    }


    /**
    * Returns panel shell element
    * @return {JQuery<HTMLElement>} - shell element that holds controls and content of panel
    */
    get element(): JQuery<HTMLElement> {
        return $(this._panel_contents);
    }


    /**
    * Sets the position for the Panel according to the map grid layout. 
    * @param {number} topLeft - the grid square that is the panel's top left corner
    * @param {number} bottomRight - the grid square that is the panel's bottom right corner
    * @throws {Exception} - positions supplied are out of bound of map grid.
    */
    setPosition(topLeft: number, bottomRight: number): void {

        let parentHeight = $(this._map_object.innerShell).height();

        if (topLeft < 0 || topLeft > 399 || bottomRight < 0 || bottomRight > 399) {
            throw "Exception: positions cannot be less than 0 or greater than 399.";
        }

        if (this._panel_positions.setPanelPosition(topLeft, bottomRight)) {

            let panelCoords = this._panel_positions.panelCoords;

            //change min positions to new default -> user changes away from default if they want
            this.setMinPosition(topLeft, bottomRight);

            this._positionChanged.next([topLeft, bottomRight]);

            //refresh width and height properties
            this._width = undefined;
            this._height = undefined;

            //if panel already open, available spaces should be updated. 
            if (this._map_object !== undefined && this._open === true) {
                this.close();
                this.open();
            }
            if (parentHeight !== undefined) {
                this._contentsHeight = ((panelCoords[3] - panelCoords[1] - 1) * 0.05 * parentHeight);
            }
        }
    }

    /**
    * Sets the width for the Panel. 
    * @param {number | string} width - the width of the panel in pixels (number) or percent (string).
    * @throws {Exception} - cannot set width if panel is not open.
    */
    set width(width: number | string) {
        if (this._open) {

            if (typeof this._panel_positions.setWidth(width) === "string") {
                this._panel_contents.style.width = this._panel_positions.setWidth(width);
                this._width = width;
            }
        }
        else {
            throw "Exception: cannot set width if panel is not open."
        }
    }

    /**
    * Sets the height for the Panel. 
    * @param {number | string} height - the height of the panel in pixels (number) or percent (string).
    * @throws {Exception} - cannot set height if panel is not open.
    */
    set height(height: number | string) {
        if (this._open) {

            if (typeof this._panel_positions.setHeight(height) === "string") {
                this._panel_contents.style.height = this._panel_positions.setHeight(height);
                this._height = height;
            }
        }
        else {
            throw "Exception: cannot set height if panel is not open."
        }
    }


    /**
    * Sets the position for the Panel according to the map grid layout (such that panel has a minimum size). 
    * @param {number} topLeft - the grid square representing the top left corner of the panel
    * @param {number} bottomRight - the grid square representing the bottom right corner of the panel
    */
    setMinPosition(topLeft: number, bottomRight: number): void {

        let panelCoords = this._panel_positions.panelCoords;

        if (topLeft < 0 || topLeft > 399 || bottomRight < 0 || bottomRight > 399) {
            throw "Exception: positions cannot be less than 0 or greater than 399.";
        }

        if (panelCoords[0] === undefined || panelCoords[1] === undefined || panelCoords[2] === undefined || panelCoords[3] === undefined) {
            throw "Exception: cannot set min position before a valid position is set.";
        }

        if (this._panel_positions.setMinPanelPosition(topLeft, bottomRight)) {
            //if panel already open, available spaces should be updated. (everything outside min is coverable)
            if (this._map_object !== undefined && this._open === true) {
                this.close();
                this.open();
            }
        }
    }

    /**
    * Helper method: adjusts the css positioning of the panel on map.
    * Calculating according to 5% default grid blocks. 
    * @private
    */
    private changePosition(): void {

        let panelCoords = this._panel_positions.panelCoords;

        //set left position (5% * parentWidth * topLeftX)
        let parentWidth = <number>$(this._map_object.innerShell).width();
        this._panel_contents.style.left = (0.05 * parentWidth * panelCoords[0]).toString() + "px";

        //set top position (5% * parentHeight * topLeftY)
        //need to forcecast because height and width return undefined
        let parentHeight = <number>$(this._map_object.innerShell).height();
        this._panel_contents.style.top = (0.05 * parentHeight * panelCoords[1]).toString() + "px";

        //calculate width and height of panel according to bottom right. 
        this._panel_contents.style.width = ((panelCoords[2] - panelCoords[0] + 1) * 0.05 * parentWidth).toString() + "px";
        this._panel_contents.style.height = ((panelCoords[3] - panelCoords[1] + 1) * 0.05 * parentHeight).toString() + "px";

    }

}

/**
 * PanelElems can be set as the contents or controls of the Panel. 
 *
 * `PanelElem` can be of type string, HTMLElement or JQuery<HTMLElement>. The can be constructed like so:
 * ```js
 * let panelElem2 = new RZ.PanelElem($("<div style='color: lightslategray'>Contents:</div>"));
 * let panelElem3 = new RZ.PanelElem($.parseHTML('<input type="text" value="Search..." id="coolInput"></input>'));
 * ``` 
 * 
 * Shortcuts can be used to create special `PanelElem`s inteded for use on panel controls. There are four shortcuts:
 * ```js
 * let panelElem1 = new RZ.PanelElem('Layers');   //Title shortcut
 * let panelElem2 = new RZ.PanelElem('T'); //toggle shortcut
 * let panelElem3 = new RZ.PanelElem('x'); //close button shortcut
 * let panelElem4 = new RZ.PanelElem('|'); //controls divider shortcut
 * ```
 */
export class PanelElem {

    private _id: string;
    private _document_fragment: DocumentFragment;
    _element: JQuery<HTMLElement>;


    /**
    * Constructs PanelElem object
    * @constructor
    * @param {string | HTMLElement | JQuery<HTMLElement>} [element] - element to be set as PanelElem (strings assumed to be titles)
    *                                                               - not to be specified for Btns    */
    constructor(element?: string | HTMLElement | JQuery<HTMLElement>) {
        this.setElement(element);
    }


    /**
    * Helper method, sets PanelElem object
    * @param {(string | HTMLElement | JQuery<HTMLElement>)} [element] - element to be set as PanelElem
    *                                                                 - parameter should always be set if directly accessing PanelElem class (not from Btn)
    * @throws {Exception} - cannot have multiple top level elements.
    */
    setElement(element?: string | HTMLElement | JQuery<HTMLElement>): void {

        let minusSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,13H5V11H19V13Z"/></svg>')[0];
        let closeSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>')[0];

        //if the element is a string either control divider, close button or title
        if (typeof element === "string") {
            //divider shortcut
            if (element === "|") {
                this._element = $('<div class="divider"></div>')
            }
            //close button shortcut
            else if (element === "x") {
                var btn = new Btn();
                btn.icon = <SVGElement>closeSVG;
                this._element = btn.element;
                this._element.addClass('btn');
                this._element.addClass('close-btn');

            }
            //toggle button shortcut
            else if (element === 'T') {
                var btn = new Btn();
                btn.icon = <SVGElement>minusSVG;
                this._element = btn.element;
                this._element.addClass('btn');
                this._element.addClass('toggle-btn');
            }
            //title shortcut
            else {
                this._element = $('<h1 style="font-weight: normal">' + element + '</h1>');
            }
        }
        else {
            this._element = $(element);

            //Throw exception if there's multiple top level elements
            let children = this._element.html();
            let checkElem = this._element.empty();
            if (checkElem.length > 1) {
                throw "Exception: cannot have multiple top level elements.";
            }
            this._element = this._element.append(children);
        }


        //If element already has id attribute, set id to that id, otherwise set to randomly generated id
        if (this._element !== undefined && this._element.attr('id') !== undefined) {
            this._id = this._element.attr('id');
        }
        else {
            this._id = "PanelElem" + Math.round(Math.random() * 10000).toString(); //random id autogenerated
            this._element.attr('id', this._id);
        }

        //Adds elem style from stylesheet 
        this._element.addClass("elem");

    }

    /**
    * Gets the id of PanelElem object. 
    * @return {string} - the id of this PanelElem.
    */
    get id(): string {
        return this._id;
    }

    /**
    * Gets element of PanelElem object. 
    * @return {JQuery<HTMLElement>} - this element that the PanelElem scopes.
    */
    get element(): JQuery<HTMLElement> {
        return this._element;
    }

}


/**
 * `Btn`s can be set to SVG icons or text.  
 *
 * Creating `Btn`s:
 * ```js
 * // a text Btn
 * let btn = new RZ.Btn();
 * btn.text = "Btn.";
 * 
 * //an SVG Btn
 * let svg = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>');
 * let btn2 = new RZ.Btn();
 * btn2.icon = svg[0];
 * ``` 
 */
export class Btn extends PanelElem {

    _element = <JQuery<HTMLElement>>$('<button class="btn"></button>');


    /**
    * Sets an icon for the Btn
    * @param {SVG} svg - the icon to be set for the Btn
    */
    set icon(svg: SVGElement) {
        svg.classList.add('svg-style');

        //usually SVG element's children control fill property (eg when appending path object or rect object etc)
        if (svg.firstChild !== null) {
            (<HTMLElement>svg.firstChild).classList.add('svg-style');
        }
        this._element.append(svg);
    }

    /**
    * Sets text for the Btn
    * @param {string} txt - the text to be set for the Btn
    */
    set text(txt: string) {
        this._element.html(txt);
        this._element.addClass('text-btn');
    }
}


/**
 * PanelPositions is used to abstract positioning information and positioning related calculations for Panels.
 * The Panel class methods uses some PanelPositions methods as helpers.
 * This is not meant to be used directly by the API user.
 */
class PanelPositions {

    private _topLeftX: number;
    private _topLeftY: number;
    private _bottomRightX: number;
    private _bottomRightY: number;

    private _minTopLeftX: number;
    private _minTopLeftY: number;
    private _minBottomRightX: number;
    private _minBottomRightY: number;

    private _panel: Panel;

    /**
    * Constructs PanelElem object
    * @constructor
    * @param {Panel} panel - Panel for which position relation computations are performed
    */
    constructor(panel: Panel) {
        this._panel = panel;
    }

    /**
    * Constructs PanelElem object
    * @return {number[]} - topLeft and bottomRight Panel coordinates
    */
    get panelCoords(): number[] {
        return [this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY];
    }

    /**
    * Helper method to setPosition in Panel class.
    * @param topLeft - the topLeft grid square of the Panel
    * @param bottomRight - the bottomRight grid square of the Panel
    * @throws {Exception} - invalid panel position supplied.
    */
    setPanelPosition(topLeft: number, bottomRight: number): boolean {
        let topLeftX = (topLeft) % 20; //example panel topLeft of 20 means left is 0, 
        let topLeftY = Math.floor(topLeft / 20);
        let bottomRightX = (bottomRight) % 20;
        let bottomRightY = Math.floor(bottomRight / 20);

        //if position supplied is invalid throw an error
        if (topLeftX > bottomRightX || topLeftY > bottomRightY) {
            throw "Exception: invalid position supplied, the topLeft row or column is greater than the bottomRight row or column.";
        }
        else {
            //set position values
            this._topLeftX = topLeftX;
            this._topLeftY = topLeftY;
            this._bottomRightX = bottomRightX;
            this._bottomRightY = bottomRightY;
        }
        return true;
    }


    /**
    * Helper method to setMinPosition in Panel class.
    * @param topLeft - the topLeft grid square of the min Panel area.
    * @param bottomRight - the bottomRight grid square of the min Panel area.
    * @throws {Exception} - invalid position supplied. 
    */
    setMinPanelPosition(topLeft: number, bottomRight: number): boolean {

        let topLeftX = topLeft % 20;
        let topLeftY = Math.floor(topLeft / 20);
        let bottomRightX = bottomRight % 20;
        let bottomRightY = Math.floor(bottomRight / 20);

        //if position supplied is invalid throw an error
        if (topLeftX > bottomRightX || topLeftY > bottomRightY) {
            throw "Exception: invalid position supplied, the topLeft row or column is greater than the bottomRight row or column.";
        }

        if (this.checkOutOfBounds(true, topLeftX, topLeftY, bottomRightX, bottomRightY) === false) {
            this._minTopLeftX = topLeftX;
            this._minTopLeftY = topLeftY;
            this._minBottomRightX = bottomRightX;
            this._minBottomRightY = bottomRightY;
        }

        return true;
    }

    /**
    * Helper Method: Checks to see if the panel is out of bounds of its map object.
    * Does not correct the panel - up to panel creator to properly place panel on the map.
    * @param {boolean} isMin - true if checkOutOfBounds is to check if min position is subset of position
    * @param {number} topLeftX - the x coordinate of the topLeft Panel square
    * @param {number} topLeftY - the y coordinate of the topLeft Panel square
    * @param {number} bottomRightX - the x coordinate of the bottomRight Panel square
    * @param {number} bottomRightY - the y coordinate of the bottomRight Panel square
    * @throws {Exception} - panel is not contained within map grid.
    * @throws {Exception} - panel min position is not a subset of panel position
    * @return {boolean} - false is returned if no exceptions are thrown
    */
    checkOutOfBounds(isMin: boolean, topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number): boolean {

        //checks for overflow if panel is added to map
        //panel positions less than 0 conditions
        let lessThanZero = topLeftX < 0 || bottomRightX < 0 || bottomRightY < 0 || topLeftY < 0;

        //panel x positions more than number of gridCols
        let overflowX = topLeftX > 20 || bottomRightX > 20;

        //panel y positions more than number of gridRows
        let overflowY = topLeftY > 20 || bottomRightY > 20;

        if (lessThanZero || overflowX || overflowY) {
            throw "Exception: Panel is not contained within map grid.";
        }

        //min position not within specified positioning
        if (isMin === true) {
            let minErrorConds = bottomRightX > this._bottomRightX || bottomRightY > this._bottomRightY || topLeftX < this._topLeftX || topLeftY < this._topLeftY;
            if (minErrorConds) {
                throw "Exception: the minPosition Panel is not contained within Panel position.";
            }
        }

        return false;
    }


    /**
    * Helper Method: Checks to see if panel that is being added causes a conflict with an existing Panel. Autoshrinks the Panel if possible.
    * @param {Panel} panel - the Panel being checked for conflict.
    * @throws {Exception} - panel cannot shrink any further to accomodate.
    */
    conflictDetected(panel: Panel): void {

        let topLeftX = panel.panelPositions.panelCoords[0];
        let topLeftY = panel.panelPositions.panelCoords[1];
        let bottomRightX = panel.panelPositions.panelCoords[2];
        let bottomRightY = panel.panelPositions.panelCoords[3];

        //if panel  doesn't completely avoid panel, then panel needs to be shrunk incrementally up to min position
        //avoiding happens when opening panel's min is to left OR top OR bottom OR right (or some combo)
        if (!(this._bottomRightX < topLeftX || this._bottomRightY < topLeftY || this._topLeftX > bottomRightX || this._topLeftY > bottomRightY)) {

            //if panel's min doesn't completely avoid panel, then panel can't open
            if (!(this._minBottomRightX < topLeftX || this._minBottomRightY < topLeftY || this._minTopLeftX > bottomRightX || this._minTopLeftY > bottomRightY)) {
                throw "Exception: conflicting panels, this panel cannot shrink any further to accomodate, panel closing.";
            }
            else {

                let newLeft = this._topLeftX;
                let newTop = this._topLeftY;
                let newBottom = this._bottomRightY;
                let newRight = this._bottomRightX;
                let oldMinLeft = this._minTopLeftX;
                let oldMinTop = this._minTopLeftY;
                let oldMinRight = this._minBottomRightX;
                let oldMinBottom = this._minBottomRightY;

                //if min position avoided panel by being on left, decrease right position of this panel to get closer to min
                if (this._minBottomRightX < topLeftX && this._bottomRightX > this._minBottomRightX) {
                    newRight = topLeftX - 1;
                    console.log("Shrinking right!");
                }

                //if min position avoided panel by being on top, decrease bottom position of this panel to get closer to min
                if (this._minBottomRightY < topLeftY && this._bottomRightY > this._minBottomRightY) {
                    newBottom = topLeftY - 1;
                    console.log("Shrinking bottom!");
                }

                //if min position avoided panel by being on right, increase left position of this panel to get closer to min
                if (this._minTopLeftX > bottomRightX && this._topLeftX < this._minTopLeftX) {
                    newLeft = bottomRightX + 1;
                    console.log("Shrinking left!");
                }

                //if min position avoided panel by being on bottom, increase top position of this panel to get closer to min
                if (this._minTopLeftY > bottomRightY && this._topLeftY < this._minTopLeftY) {
                    newTop = bottomRightY + 1;
                    console.log("Shrinking top!");
                }

                this.setPanelPosition(newTop * 20 + newLeft, newBottom * 20 + newRight);
                this.setMinPanelPosition(oldMinTop * 20 + oldMinLeft, oldMinBottom * 20 + oldMinRight);
            }
        }
    }

    /**
    * Helper Method to static availableSpaces in Panel class.
    * @param {Panel[]} panelRegistry - the list of Panels on the map instance being checked.
    * @param {number} width - the width of the Panel being checked
    * @param {height} height - the height of the Panel being checked
    * @param {Panel} [panel] - the Panel instance that available spaces are being checked for 
    * @returns {number[][]} - the grid representation of available spaces on the Map instance
    */
    static availableSpaces(panelRegistry: Panel[], width: number, height: number, panel?: Panel): number[][] {

        //initializes availableSpaces array
        let cols = 20, rows = 20;
        let availableSpaces = [], row = [];
        while (cols--) row.push(0);
        while (rows--) availableSpaces.push(row.slice());


        let minBottomX = undefined;
        let minBottomY = undefined;
        let minTopX = undefined;
        let minTopY = undefined;

        //if the user supplies the panel
        if (panel !== undefined) {
            //if the min position is different than regular position, take this into account
            if (panel.panelPositions._bottomRightX !== panel.panelPositions._minBottomRightX || panel.panelPositions._bottomRightY !== panel.panelPositions._minBottomRightY || panel.panelPositions._topLeftX !== panel.panelPositions._minTopLeftX || panel.panelPositions._topLeftY !== panel.panelPositions._minTopLeftY) {

                //how far removed the min topLeft from topLeft?
                minTopX = panel.panelPositions._minTopLeftX - panel.panelPositions._topLeftX;
                minTopY = panel.panelPositions._minTopLeftY - panel.panelPositions._topLeftY;

                //how far removed is minBottomRight topLeft?
                minBottomX = panel.panelPositions._minBottomRightX - panel.panelPositions._topLeftX;
                minBottomY = panel.panelPositions._minBottomRightY - panel.panelPositions._topLeftY;
            }
        }

        //all squares in these spaces when used as topLeft corner would put panel out of bounds of map
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                if ((20 - i) < width || (20 - j) < height) {
                    availableSpaces[j][i] = -1;
                }
            }
        }


        //for every open panel in panel registry
        for (let panelObj of panelRegistry) {
            if (panelObj._open === true && panelObj !== panel) {

                //panel position will be invalid if the topLeft coordinate of the panel when treated as the bottomRight corner overlaps
                let topLeftX = panelObj.panelPositions._topLeftX - width + 1;
                let originalTopLeftX = panelObj.panelPositions._topLeftX;
                let topLeftY = panelObj.panelPositions._topLeftY - height + 1;
                let originalTopLeftY = panelObj.panelPositions._topLeftY;
                let bottomRightX = panelObj.panelPositions._bottomRightX;
                let bottomRightY = panelObj.panelPositions._bottomRightY;

                //if these are out of bounds of map, just use the zeroth coordinates
                if (topLeftX < 0) {
                    topLeftX = 0;
                }
                if (topLeftY < 0) {
                    topLeftY = 0;
                }

                //mark as invalid
                for (let i = topLeftX; i <= bottomRightX; i++) {
                    for (let j = topLeftY; j <= bottomRightY; j++) {

                        availableSpaces[j][i] = -1;

                        //if min width and height are specified want to mark all spaces causing overlap as '1'
                        if (minBottomX !== undefined && minBottomY !== undefined && minTopX !== undefined && minTopY !== undefined) {
                            //if min position completely misses this panel
                            if ((i + minTopX + 1) < originalTopLeftX || (j + minTopY) < originalTopLeftY || (i + minBottomX - 1) > bottomRightX || (j + minBottomY) > bottomRightY) {
                                availableSpaces[j][i] = 1;
                            }
                        }
                    }
                }
            }
        }

        return availableSpaces;
    }


    /**
    * Helper Method to set width method in Panel class. 
    * @param {number | string} width - the width that the Panel needs to be set to.
    * @returns {string | null} - the px conversion of width
    */
    setWidth(width: number | string): (string | null) {

        let parentWidth = <number>$(this._panel.map.innerShell).width();

        if (typeof width === 'number') {

            let topLeftPx = this._topLeftX * 0.05 * parentWidth
            let bottomRightPx = this._bottomRightX * 0.05 * parentWidth;

            //as long as supplied width is within panel width -> else ignored
            if (topLeftPx + width <= bottomRightPx) {
                return width.toString() + "px";
            }
        }
        else {
            let numWidth = parseInt(width.slice(0, -1)) * 0.01; //convert the percent into a decimal
            //as long as supplied width is within panel width in percents
            if (numWidth >= 0 && numWidth <= 1) {

                let panelWidth = (this._bottomRightX - this._topLeftX + 1) * 0.05 * parentWidth;
                let newWidth = panelWidth * numWidth;   //converts percent width to pixel width
                let topLeftPx = this._topLeftX * 0.05 * parentWidth
                let bottomRightPx = this._bottomRightX * 0.05 * parentWidth;

                //as long as supplied width is within panel width -> else ignored
                if (topLeftPx + newWidth <= bottomRightPx) {
                    return newWidth.toString() + "px";
                }
            }
        }
        return null;
    }

    /**
    * Helper Method to set height method in Panel class. 
    * @param {number | string} height - the height that the Panel needs to be set to.
    * @returns {string | null} - the px conversion of height
    */
    setHeight(height: number | string): (string | null) {

        let parentHeight = <number>$(this._panel.map.innerShell).height();

        if (typeof height === 'number') {

            let topLeftPx = this._topLeftY * 0.05 * parentHeight;
            let bottomRightPx = this._bottomRightY * 0.05 * parentHeight;

            //as long as supplied width is within panel width -> else ignored
            if (topLeftPx + height <= bottomRightPx) {
                return height.toString() + "px";
            }
        }
        else {
            let numHeight = parseInt(height.slice(0, -1)) * 0.01; //convert the percent into a decimal
            //as long as supplied width is within panel width in percents
            if (numHeight >= 0 && numHeight <= 1) {

                let panelHeight = (this._bottomRightY - this._topLeftY + 1) * 0.05 * parentHeight;
                let newHeight = panelHeight * numHeight;   //converts percent width to pixel width
                let topLeftPx = this._topLeftY * 0.05 * parentHeight;
                let bottomRightPx = this._bottomRightY * 0.05 * parentHeight;

                //as long as supplied width is within panel width -> else ignored
                if (topLeftPx + newHeight <= bottomRightPx) {
                    return newHeight.toString() + "px";
                }
            }
        }
        return null;
    }
}