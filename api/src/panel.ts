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
+    * @param {string} id - the user defined ID name for this panel
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
     * Returns panel positions object 
     */
    get panelPositions(): PanelPositions {
        return this._panel_positions;
    }

    /**
    * Helper method to create panel components and the document fragment. 
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
            //INNERSHELL
            //if current width is different from stored width, fire width changed
            if (panel._map_width !== $(panel._map_object.innerShell).width()) {

                panel._widthChanged.next(<number>$(panel._map_object.innerShell)!.width() * 0.05);
                panel._map_width = $(panel._map_object.innerShell).width();
            }
            //if current height is different from stored height, fire height changed
            else if (panel._map_height !== $(panel._map_object.innerShell).height()) {
                panel._heightChanged.next(<number>$(panel._map_object.innerShell).height() * 0.05);
                panel._map_height = <number>$(panel._map_object.innerShell).height();
            }

            //changes width/height to new percentage value of the map
            panel.changePosition();

            //need to preserve previously defined width and height of panel
            if (panel._width !== undefined && panel._height !== undefined) {
                panel.width = panel._width;
                panel.height = panel._height;
            }

            if (parentHeight !== undefined) {
                panel._contentsHeight = ((panelCoords[3] - panelCoords[1] - 1) * 0.05 * parentHeight);

                //if the body is supposed to be hidden
                if (panel._panel_body.classList.contains('hidden')) {
                    panel._panel_contents.style.height = (<number>$(panel._panel_controls).height()).toString() + 'px';
                }
                else {
                    panel._panel_contents.style.height = (panel._contentsHeight + 0.1 * parentHeight).toString() + "px";
                }
            }
        });
    }

    /**
    * Helper method to setPosition(), setMinPosition(), set coverable(). Updates available spaces on the grid.
    * @private
    */
    /*private updateGridSpaces(coverage: number, topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number): void {
        this._map_object.updateMapGrid(coverage, topLeftX * 20 + topLeftY, bottomRightX * 20 + bottomRightY);
    }*/

    /**
    * Returns an array of arrays representing each grid square. An array value can be the following:
    * -1 : Invalid panel position (not coverable because it is some panel's min position, or user wants this area empty)
    *  0 :  Valid panel position (no panels set in this area)
    * 1+: Valid panel position with 1 or more other panels capable of covering it (panel is here, but coverable)
    *
    * If width and/or height are not provided the width/height can be computed from the panel position. 
    * If position is not set throw an error
    * 
    * "If a panel of this dimension were to use this grid square as its top left corner would it fit?" computation based on using grid square as its top left position
    * 
    * 
    * @param {number} [width] - the panel width
    * @param {number} [height] - the panel height
    * @return {number[][]} - array of arrays representing each grid square 
    */

    static availableSpaces(panelRegistry: Panel[], width: number, height: number, panel?: Panel): number[][] {
        return PanelPositions.availableSpaces(panelRegistry, width, height, panel);
    }


    /**
    * If no position is set, calculate based on a 1x1 panel. 
    * @return {number[][]} - array of arrays representing each grid square 
    */
    availableSpaces(width?: number, height?: number): number[][] {

        if (this._map_object === undefined) {
            throw "this panel's map is not set; cannot retrieve grid.";
        }

        //if no position, width or height set calculate based on a 1x1 panel
        if (this.panelPositions.panelCoords[0] === undefined && this.panelPositions.panelCoords[1] === undefined && this.panelPositions.panelCoords[2] === undefined && this.panelPositions.panelCoords[3] === undefined && width === undefined && height === undefined) {

            return Panel.availableSpaces(this._map_object.panelRegistry, 1, 1);
        }
        //
        else {
            if (width !== undefined && height !== undefined) {
                return Panel.availableSpaces(this._map_object.panelRegistry, width, height, this);
            }
            else {
                return Panel.availableSpaces(this._map_object.panelRegistry, this.panelPositions.panelCoords[2] - this.panelPositions.panelCoords[0] + 1, this.panelPositions.panelCoords[3] - this.panelPositions.panelCoords[1] + 1, this);
            }
        }
    }

    /**
    * Returns controls for panel
    * @return {(PanelElem)[]} - a list of controls for the panel. 
    */
    get controls(): (PanelElem | Btn)[] {
        return this._controls;
    }

    /**
    * Sets panel controls. 
    * @param {(PanelElem)[]} elems - the array of control elements that are set as panel controls
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
            else if (elem._element.get(0).classList.length === 4 && elem._element.get(0).classList[1] === "toggle-btn") {
                $(elem._element.get(0)).click(function () {
                    if (body.classList.contains('hidden')) {
                        body.classList.remove('hidden');
                        let minusSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,13H5V11H19V13Z"/></svg>')[0];


                        let btn = new Btn();
                        btn.icon = <SVGElement>minusSVG;
                        btn._element.addClass('btn');
                        btn._element.addClass('toggle-btn');
                        panel._hidden = false;
                        elem._element.get(0).removeChild(<HTMLElement>elem._element.get(0).firstChild);
                        elem._element.get(0).appendChild(<HTMLElement>minusSVG);

                        if (panel._contentsHeight !== undefined) {
                            panel._panel_contents.style.height = (panel._contentsHeight + <number>panel._map_height * 0.10).toString() + 'px';
                        }

                    }
                    else {
                        body.classList.add('hidden');
                        let plusSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>')[0];
                        let btn = new Btn();
                        btn.icon = <SVGElement>plusSVG;
                        btn._element.addClass('btn');
                        btn._element.addClass('toggle-btn');
                        panel._hidden = true;
                        elem._element.get(0).removeChild(<HTMLElement>elem._element.get(0).firstChild);
                        elem._element.get(0).appendChild(<HTMLElement>plusSVG);
                        panel._panel_contents.style.height = (<number>$(panel._panel_controls).height()).toString() + 'px';

                    }
                });
            }
        }
    }

    /**
    * Opens the panel on the map. (For the user to see)
    * @throws {Exception} - panel positon is not set. 
    * @throws {Exception} - panel is out of bounds of map. 
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
                throw "Exception: panel position is not set. Set position before opening panel.";
            }
        }
        else {
            throw "Exception: panel can't be opened if it has not been added to a map."
        }
    }

    /**
    * Helper method to open(). Detects a conflict where an opening panel interferes with the opening of another panel. 
    * @returns {boolean} - returns false if conflict is not detected
    * @throws {Exception} - ConflictDetectedError: Panel Unshrinkable!
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
    */
    close(): void {
        let panelCoords = this._panel_positions.panelCoords;

        //if the map doesn't exist or the position hasn't been set then the map hasn't been added to a map
        if (this._map_object !== undefined && panelCoords[0] !== undefined && panelCoords[1] !== undefined && panelCoords[2] !== undefined && panelCoords[3] !== undefined && this._open === true) {
            this._closing.next();
            this._panel_contents.classList.add('hidden');
            //updates panel registry

            //this.updateGridSpaces(0, this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY);
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

    //if number, set to pixels, if string, set to %
    //assume the user gives correct pixels/percent input
    //catch errors javascript?
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

    //if number, set to pixels, if string, set to %
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
    * @param {number} topLeftX - the x coordinate of the top left square (set as top left panel corner) 
    * @param {number} topLeftY - the y coordinate of the top left square (set as top left panel corner) 
    * @param {number} bottomRightX - the x coordinate of the bottom right square (set as the bottom right panel corner)
    * @param {number} bottomRightY - the y coordinate of the bottom right square (set as the bottom right panel corner)
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

export class PanelElem {

    _id: string;
    _document_fragment: DocumentFragment;
    _element: JQuery<HTMLElement>;

    /**
    * Constructs PanelElem object
    * @param {string | HTMLElement | JQuery<HTMLElement>} [element] - element to be set as PanelElem (strings assumed to be titles)
    *                                                               - not to be specified for Btns
    */
    constructor(element?: string | HTMLElement | JQuery<HTMLElement>) {
        this.setElement(element);
    }

    /**
    * Helper method, sets PanelElem object
    * @param {(string | HTMLElement | JQuery<HTMLElement>)} [element] - element to be set as PanelElem
    * @throws {Exception} - cannot have multiple top level elements
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
    * Gets id of PanelElem object. 
    * @return {string} - the id of this PanelElem 
    */
    get id(): string {
        return this._id;
    }

    /**
    * Gets id of PanelElem object. 
    * @return {JQuery<HTMLElement>} - this PanelElem
    */
    get element(): JQuery<HTMLElement> {
        return this._element;
    }

}

export class Btn extends PanelElem {

    _element = <JQuery<HTMLElement>>$('<button class="btn"></button>');


    /**
    * Sets an icon for the Btn
    * @param {SVG} svg - the icon to be set for the Btn
    */
    set icon(svg: SVGElement) {
        console.log(svg);
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

export class PanelPositions {

    private _topLeftX: number;
    private _topLeftY: number;
    private _bottomRightX: number;
    private _bottomRightY: number;

    private _minTopLeftX: number;
    private _minTopLeftY: number;
    private _minBottomRightX: number;
    private _minBottomRightY: number;

    private _panel: Panel;

    constructor(panel: Panel) {
        this._panel = panel;
    }

    get panelCoords(): number[] {
        return [this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY];
    }

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
    * @throws {Exception} - panel is not contained within map grid.
    * @return {boolean} - false is returned if  OutOfBoundsException not thrown
    * @private
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
                                ///console.log([minTopX, minTopY, minBottomX, minBottomY]);
                                availableSpaces[j][i] = 1;
                            }
                        }
                    }
                }
            }
        }

        return availableSpaces;
    }

    setWidth(width: number | string): (string | null) {

        let parentWidth = <number>$(this._panel.map.innerShell).width();

        if (typeof width === 'number') {

            let topLeftPx = this._topLeftX * 0.05 * parentWidth
            let bottomRightPx = this._bottomRightX * 0.05 * parentWidth;

            //as long as supplied width is within panel width -> else ignored
            if (topLeftPx + width <= bottomRightPx) {
                console.log('returning pixel conversion');
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
                    console.log('returning percent conversion');
                    return newWidth.toString() + "px";
                }
            }
        }
        return null;
    }

    setHeight(height: number | string): (string | null) {

        let parentHeight = <number>$(this._panel.map.innerShell).height();

        if (typeof height === 'number') {

            let topLeftPx = this._topLeftY * 0.05 * parentHeight;
            let bottomRightPx = this._bottomRightY * 0.05 * parentHeight;

            //as long as supplied width is within panel width -> else ignored
            if (topLeftPx + height <= bottomRightPx) {
                console.log('returning pixel conversion');
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
                    console.log('returning percent conversion');
                    return newHeight.toString() + "px";
                }
            }
        }
        return null;
    }
}