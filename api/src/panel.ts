import { Observable, Subject } from 'rxjs/Rx';
import Map from 'api/map';


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

    private _map_object: Map;

    //Panel positioning/size 
    private _topLeftX: number;
    private _topLeftY: number;
    private _bottomRightX: number;
    private _bottomRightY: number;

    //Min panel positioning/size
    private _minTopLeftX: number;
    private _minTopLeftY: number;
    private _minBottomRightX: number;
    private _minBottomRightY: number;

    private _GRIDROWS = 20;
    private _GRIDCOLS = 20;

    //subjects initialized for observables that are fired through method calls
    private _opening: Subject<any> = new Subject();
    private _closing: Subject<any> = new Subject();
    private _positionChanged: Subject<any> = new Subject();
    private _widthChanged: Subject<any> = new Subject();
    private _heightChanged: Subject<any> = new Subject();

    private _open: boolean; //whether panel is open or closed 

    //user accessible observables 
    opening: Observable<any>;
    closing: Observable<any>;
    topLeftXChanged: Observable<number>;
    bottomRightXChanged: Observable<number>;
    positionChanged: Observable<[number, number]>; //top left, bottom right
    widthChanged: Observable<number>
    heightChanged: Observable<number>


    /**
+    * Creates a new Panel.
+    * @constructor
+    * @param {string} id - the user defined ID name for this panel
+    */
    constructor(id: string) {

        //init class attributes
        this._id = id;
        this._open = false;
        this.opening = this._opening.asObservable();
        this.closing = this._closing.asObservable();
        this.positionChanged = this._positionChanged.asObservable();
        this.widthChanged = this._widthChanged.asObservable();
        this.heightChanged = this._heightChanged.asObservable();

        this.observableSubscribe();

        //create panel components and document fragment
        this.createPanelComponents();

    }


    /**
    * Helper method to see observables firing in console.
    * To be removed when API is finished. 
    * @private
    */
    private observableSubscribe(): void {
        this.opening.subscribe(val => console.log("Panel opening..."));
        this.closing.subscribe(val => console.log("Panel closing..."));
        this.positionChanged.subscribe(pos => console.log([pos, 'position changed!']));
        this.widthChanged.subscribe(width => console.log([width, 'width changed!']));
        this.heightChanged.subscribe(height => console.log([height, 'height changed!']));
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

        this._panel_body = document.createElement("div");
        this._panel_body.classList.add('panel-body');

        this._panel_contents.setAttribute('id', this._id.toString());

        //append panel controls/body to panel contents ("shell")
        this._panel_contents.appendChild(this._panel_controls);
        this._panel_contents.appendChild(this._panel_body);
        this._panel_contents.classList.add('hidden'); //hide panel before a call to open is made
        //append panel contents ("shell") to document fragment
        this._document_fragment = document.createDocumentFragment();
        this._document_fragment.appendChild(this._panel_contents);
        document.body.appendChild(this._document_fragment);
    }

    /**
    * Helper method to setPosition(), setMinPosition(), set coverable(). Updates available spaces on the grid.
    * @private
    */
    private updateGridSpaces(coverage: number, topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number) {
        this._map_object.updateMapGrid(coverage, topLeftX * 20 + topLeftY, bottomRightX * 20 + bottomRightY);
    }

    /**
     * Sets the map object that this panel resides on. 
     */
    setMap(map: Map): void {
        this._map_object = map;
        let panel = this;
        this._map_object.addPanel(this);
        //resize listener
        $(window).resize(function () {
            //fires observables
            panel._widthChanged.next(<number>$(panel._map_object.mapElement).width());
            panel._heightChanged.next(<number>$(panel._map_object.mapElement).height());

            //changes width/height to new percentage value of the map
            panel.changePosition(panel._topLeftX, panel._topLeftY, panel._bottomRightX, panel._bottomRightY);
        });
    }

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

    staticavailableSpaces(width?: number, height?: number): number[][] {

        if (this._map_object === undefined) {
            throw "Exception: this panel's map is not set; cannot retrieve grid.";
        }

        //initializes availableSpaces array
        let cols = 20, rows = 20;
        let availableSpaces = [], row = [];
        while (cols--) row.push(0);
        while (rows--) availableSpaces.push(row.slice());
        let panelWidth, panelHeight;
        let minPanelWidth = undefined;
        let minPanelHeight = undefined;

        //if the user does not supply the width and height for the panel, compute it using the panel's position
        if (width === undefined && height === undefined) {
            if (this._bottomRightX !== undefined && this._bottomRightY !== undefined && this._topLeftX !== undefined && this._topLeftY !== undefined) {
                panelWidth = this._bottomRightX - this._topLeftX;
                panelHeight = this._bottomRightY - this._topLeftY;
                minPanelWidth = panelWidth;
                minPanelHeight = panelHeight;

                //if the min position is different than regular position, take this into account
                if (this._bottomRightX !== this._minBottomRightX || this._bottomRightY !== this._minBottomRightY || this._topLeftX !== this._minTopLeftX || this._topLeftY !== this._minTopLeftY) {
                    minPanelWidth = this._minBottomRightX - this._minTopLeftX;
                    minPanelHeight = this._minBottomRightY - this._minTopLeftY;
                }
            }
            //if a panel's position is not set throw an error
            else {
                throw "Exception: Panel position is undefined, cannot compute width and height.";
            }
        }
        //otherwise use user supplied width and height
        else {
            panelWidth = width;
            panelHeight = height;
            minPanelWidth = panelWidth;
            minPanelHeight = panelHeight;
        }

        //when it checks panel registry, check for conflicts in min panel width/height
        //auto mark 20- width and 20 - height as invalid
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {

                //if available spaces currently marked as 'valid', need to check if that needs to change
                if (availableSpaces[i][j] === 0) {

                    //if panel's top left corner is in one of these squares, it would be out of bounds of the map (invalid positions)
                    if (panelWidth !== undefined && panelHeight !== undefined && ((20 - i) < panelWidth || (20 - j) < panelHeight)) {
                        availableSpaces[i][j] = -1;
                    }
                }
                //if panel's minWidth/height fall into some conflict
                //calculate panelRegistry indices to check for minWidth and minHeight
            }
        }

        return availableSpaces;
    }

    /**
    * If no position is set, calculate based on a 1x1 panel. 
    * @return {number[][]} - array of arrays representing each grid square 
    */
    availableSpaces(): number[][] {

        if (this._map_object === undefined) {
            throw "this panel's map is not set; cannot retrieve grid.";
        }

        console.log(this._map_object);

        let cols = 20, rows = 20;
        let availableSpaces = [], row = [];
        while (cols--) row.push(0);
        while (rows--) availableSpaces.push(row.slice());
        console.log(availableSpaces);
        //if there is an existing panel in this position 
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                if (this._map_object.mapGrid[i][j] !== 0) {
                    availableSpaces[i][j] = -1;
                }
            }
        }

        return availableSpaces;
    }

    /**
    * Returns controls for panel
    * @return {(PanelElem)[]} - a list of controls for the panel. 
    */
    get controls(): PanelElem[] {
        return this._controls;
    }

    /**
    * Sets panel controls. 
    * @param {(PanelElem)[]} elems - the array of control elements that are set as panel controls
    */
    set controls(elems: PanelElem[]) {
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
                    if (elem._element.get(0).innerHTML === '+') {
                        elem._element.get(0).innerHTML = '-';
                        body.classList.remove('hidden');
                    }
                    else {
                        elem._element.get(0).innerHTML = '+';
                        body.classList.add('hidden');
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
        if (this._map_object !== undefined) {
            //check to see panel position is set
            if (this._bottomRightX !== undefined && this._bottomRightY !== undefined && this._topLeftX !== undefined && this._topLeftY !== undefined) {

                //check to see if panel position is out of bounds of grid 
                if (this.checkOutOfBounds(false, this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY) === false) {

                    //If there is no conflict with an existing panel, allow the panel to open
                    if (!this.conflictDetected()) {

                        //fires opening observable
                        this._opening.next()

                        //changes position on map and updates panel registry
                        this.changePosition(this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY);
                        this._panel_contents.classList.remove('hidden'); //hide panel before a call to open is made
                        this.updateGridSpaces(1, this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY);
                        this.updateGridSpaces(-1, this._minTopLeftX, this._minTopLeftY, this._minBottomRightX, this._minBottomRightY);
                        this._open = true;
                        console.log("position in open function");
                        console.log([this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY]);
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

        let availableSpaces = this._map_object.mapGrid;

        //first check available spaces for panel's min position, if conflict then throw exception
        //all the indices in this array 
        for (let i = this._minTopLeftX; i <= this._minBottomRightX; i++) {
            for (let j = this._minTopLeftY; j <= this._minBottomRightY; j++) {
                //if a panel exists where THIS panel is trying to open
                if (availableSpaces[i][j] !== 0) {
                    throw "Exception: conflicting panels, this panel cannot shrink any further to accomodate.";
                }
            }
        }

        //then check whole panel for conflict --> if a conflict is found
        this.shrinkPanel();

        return false;


    }



    /**
    * Helper method to conflictDetected(). Shrinks the panel to accomodate a conflicting panel.
    * For now can only shrink the panel attempting to open on the map (not the already existing panel). 
    * @private
    */
    private shrinkPanel(): void {

        let availableSpaces = this._map_object.mapGrid;
        let newTop = this._topLeftY;
        let newBottom = this._bottomRightY;
        let newLeft = this._topLeftX;
        let newRight = this._bottomRightX;

        //this looks for conflict in all rows above min box
        for (let i = this._topLeftX; i <= this._bottomRightX; i++) {
            for (let j = this._topLeftY; j <= this._minBottomRightY; j++) {

                //if conflict exits in this row then newTop has to be some row below it
                if (availableSpaces[i][j] !== 0) {
                    newTop = j + 1;
                }
            }
        }

        let newBottomSet = false;
        //this looks for conflict in all rows below min box
        for (let i = this._topLeftX; i <= this._bottomRightX; i++) {
            for (let j = this._minBottomRightY; j <= this._bottomRightY; j++) {

                //if conflict exits in this row then newBottom has to be the row above it
                if (availableSpaces[i][j] !== 0) {
                    newBottom = j - 1;
                    newBottomSet = true;
                    break;
                }
            }
            if (newBottomSet) {
                break;
            }
        }

        //this looks for conflict in all columns left of min box
        for (let i = this._topLeftX; i <= this._minTopLeftX; i++) {
            for (let j = this._minTopLeftY; j <= this._minBottomRightY; j++) {

                //if conflict exits in this column then newLeft has to be some column to the right
                if (availableSpaces[i][j] !== 0) {
                    newLeft = i + 1;
                }
            }
        }

        let newRightSet = false;
        //this looks for conflict in all columns right of min box
        for (let i = this._minBottomRightX; i <= this._bottomRightX; i++) {
            for (let j = this._minTopLeftY; j <= this._minBottomRightY; j++) {

                //if conflict exits in this column then newRight has to be the column to the left
                if (availableSpaces[i][j] !== 0) {
                    newRight = i - 1;
                    newRightSet = true;
                    break;
                }
            }
            if (newRightSet) {
                break;
            }
        }

        let oldMinLeft = this._minTopLeftX;
        let oldMinTop = this._minTopLeftY;
        let oldMinRight = this._minBottomRightX;
        let oldMinBottom = this._minBottomRightY;

        //lets say have left to be 0 and top to be 1 --> how to get position 20?
        //top*20 + left
        //position of 42? 


        this.setPosition(newTop * 20 + newLeft, newBottom * 20 + newRight);
        console.log("the new position:")
        console.log([newLeft, newTop, newRight, newBottom]);

        this.setMinPosition(oldMinTop * 20 + oldMinLeft, oldMinBottom * 20 + oldMinRight);
        //console.log([oldMinLeft, oldMinTop, oldMinRight, oldMinBottom]);
    }



    /**
    * Closes the panel on the map. (For the user to see).
    */
    close(): void {

        //if the map doesn't exist or the position hasn't been set then the map hasn't been added to a map
        if (this._map_object !== undefined || this._bottomRightX !== undefined && this._bottomRightY !== undefined && this._topLeftX !== undefined && this._topLeftY !== undefined) {
            this._closing.next();
            this._panel_contents.classList.add('hidden');
            //updates panel registry

            this.updateGridSpaces(0, this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY);
            this._open = false;
        }
        else {
            throw "Exception: can't close a panel that has not been added to a map."
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

        let topLeftX = (topLeft) % 20; //example panel topLeft of 20 means left is 0, 
        let topLeftY = Math.floor(topLeft / 20);
        let bottomRightX = (bottomRight) % 20;
        let bottomRightY = Math.floor(bottomRight / 20);

        console.log([topLeftX, topLeftY, bottomRightX, bottomRightY]);
        //if position supplied is invalid throw an error
        if (topLeftX > bottomRightX || topLeftY > bottomRightY) {
            throw "Invalid position supplied!";
        }
        else {
            //set position values
            this._topLeftX = topLeftX;
            this._topLeftY = topLeftY;
            this._bottomRightX = bottomRightX;
            this._bottomRightY = bottomRightY;

            //newTop*10 + 10 + newLeft, newBottom*10 + 10 + newRight

            //change min positions to new default -> user changes away from default if they want
            this.setMinPosition(topLeft, bottomRight);

            this._positionChanged.next([topLeft, bottomRight]);

            //if panel already open, available spaces should be updated. 
            if (this._map_object !== undefined && this._open === true) {
                this.close();
                this.open();
            }

        }

    }


    /**
    * Sets the position for the Panel according to the map grid layout (such that panel has a minimum size). 
    * @param {number} topLeft - the grid square representing the top left corner of the panel
    * @param {number} bottomRight - the grid square representing the bottom right corner of the panel
    */
    setMinPosition(topLeft: number, bottomRight: number): void {

        let topLeftX = topLeft % 20;
        let topLeftY = Math.floor(topLeft / 20);
        let bottomRightX = bottomRight % 20;
        let bottomRightY = Math.floor(bottomRight / 20);

        //if position supplied is invalid throw an error
        if (topLeftX > bottomRightX || topLeftY > bottomRightY) {
            throw "Invalid position supplied!";
        }

        if (this.checkOutOfBounds(true, topLeftX, topLeftY, bottomRightX, bottomRightY) === false) {
            this._minTopLeftX = topLeftX;
            this._minTopLeftY = topLeftY;
            this._minBottomRightX = bottomRightX;
            this._minBottomRightY = bottomRightY;
        }
        //if panel already open, available spaces should be updated. (everything outside min is coverable)
        if (this._map_object !== undefined && this._open === true) {
            this.close();
            this.open();
        }
    }

    /**
    * Helper method: adjusts the css positioning of the panel on map.
    * Calculating according to 5% default grid blocks. 
    * @param {number} topLeftX - the x coordinate of the top left square (set as top left panel corner) 
    * @param {number} topLeftY - the y coordinate of the top left square (set as top left panel corner) 
    * @param {number} bottomRightX - the y coordinate of the bottom right square (set as the bottom right panel corner)
    * @param {number} bottomRightY - the y coordinate of the bottom right square (set as the bottom right panel corner)
    * @private
    */
    private changePosition(topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number): void {
        //set left position (5% * parentWidth * topLeftX)
        var parentWidth = <number>$(this._map_object.mapElement).width();
        this._panel_contents.style.left = (0.05 * parentWidth * topLeftX).toString() + "px";

        //set top position (5% * parentHeight * topLeftY)
        //need to forcecast because height and width return undefined
        var parentHeight = <number>$(this._map_object.mapElement).height();
        this._panel_contents.style.top = (0.05 * parentHeight * topLeftY).toString() + "px";

        //calculate width and height of panel according to bottom right. 
        this._panel_contents.style.width = ((bottomRightX - topLeftX) * 0.05 * parentWidth).toString() + "px";
        this._panel_contents.style.height = ((bottomRightY - topLeftY) * 0.05 * parentHeight).toString() + "px";
    }

    /**
    * Helper Method: Checks to see if the panel is out of bounds of its map object.
    * Does not correct the panel - up to panel creator to properly place panel on the map.
    * @throws {Exception} - panel is not contained within map grid.
    * @return {boolean} - false is returned if  OutOfBoundsException not thrown
    * @private
    */
    private checkOutOfBounds(isMin: boolean, topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number): boolean {

        //checks for overflow if panel is added to map
        //panel positions less than 0 conditions
        let lessThanZero = topLeftX < 0 || bottomRightX < 0 || bottomRightY < 0 || topLeftY < 0;

        //panel x positions more than number of gridCols
        let gridCols = this._GRIDCOLS;
        let overflowX = topLeftX > gridCols || bottomRightX > gridCols;

        //panel y positions more than number of gridRows
        let gridRows = this._GRIDROWS;
        let overflowY = topLeftY > gridRows || bottomRightY > gridRows;

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

}

export class PanelElem {

    _id: string;
    _document_fragment: DocumentFragment;
    _element: JQuery<HTMLElement>;

    /**
    * Constructs PanelElem object
    * @param {string | HTMLElement | JQuery<HTMLElement>} [element] - element to be set as PanelElem (strings assumed to be titles)
    *                                                               - not to be specified for buttons
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

        //if the element is a string either control divider, close button or title
        //TODO: what is a control divider?
        if (typeof element === "string") {
            //divider shortcut
            if (element === "|") {
                this._element = $('<div class="divider"></div>')
            }
            //close button shortcut
            else if (element === "x") {
                var btn = new Btn();
                btn.text = "x";
                this._element = btn.element;
                this._element.addClass('close-btn');
                //TODO: define close function in panel class 
            }
            //toggle button shortcut
            else if (element === 'T') {
                var btn = new Btn();
                btn.text = "-";
                this._element = btn.element;
                this._element.addClass('toggle-btn');
            }
            else {
                this._element = $('<h2>' + element + '</h2>');
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
        svg.classList.add('svg-style');
        this._element.append(svg);
    }

    /**
    * Sets text for the Btn
    * @param {string} txt - the text to be set for the Btn
    */
    set text(txt: string) {
        this._element.html(txt);
    }
}