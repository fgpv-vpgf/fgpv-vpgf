import { Observable, Subject } from 'rxjs/Rx';
import Map from 'api/map';


export class Panel {

    private _id: string;
    private _coverable: boolean;

    //Panel items
    private _content: PanelElem;
    private _controls: (PanelElem)[];

    //HTML/JQuery panel and parent Components
    private _panel_contents: HTMLElement;
    private _panel_controls: HTMLElement;
    private _panel_body: HTMLElement;
    private _document_fragment: DocumentFragment;

    private _parent_map: HTMLElement;
    private _parent_map_jq: JQuery;
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

    widthChanged: Observable<number>
    heightChanged: Observable<number>

    //subjects initialized for observables that are fired through method calls
    private _opening: Subject<any> = new Subject();
    private _closing: Subject<any> = new Subject();
    private _positionChangedX: Subject<any> = new Subject();
    private _positionChangedY: Subject<any> = new Subject();
    private _widthChanged: Subject<any> = new Subject();
    private _heightChanged: Subject<any> = new Subject();

    opening: Observable<any>;
    closing: Observable<any>;

    //positionChanged: Observable<number, number>; //doesn't work
    topLeftXChanged: Observable<number>;
    bottomRightXChanged: Observable<number>;
    positionChangedX: Observable<[number, number]>; //top left, bottom right
    positionChangedY: Observable<[number, number]>; //top left, bottom right
    _open: boolean;



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
        this.positionChangedX = this._positionChangedX.asObservable();
        this.positionChangedY = this._positionChangedY.asObservable();
        this.widthChanged = this._widthChanged.asObservable();
        this.heightChanged = this._heightChanged.asObservable();


        this.observableSubscribe();

        //create panel components and document fragment
        this.createPanelComponents();

    }

    private observableSubscribe() {
        this.opening.subscribe(val => console.log("Panel opening..."));
        this.closing.subscribe(val => console.log("Panel closing..."));
        this.positionChangedX.subscribe(posX => console.log(posX));
        this.positionChangedY.subscribe(posY => console.log(posY));
        this.widthChanged.subscribe(width => console.log(width));
        this.heightChanged.subscribe(height => console.log(height));
    }

    /**
    * Helper method to create panel components and the document fragment. 
    */
    createPanelComponents() {

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
    */
    updateAvailableSpaces(coverage: number, topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number) {
        if (this._map_object !== undefined) {
            this._map_object.setPanelRegistry(coverage, topLeftX, topLeftY, bottomRightX, bottomRightY);
        }
    }

    /**
     * Helper method to changePosition(). Sets the parent map for width/height calculations.
     * @return {boolean} - returns true if the parent map is set 
     */
    setParentMap(parentMap: Map) {
        this._map_object = parentMap;
        let panel = this;
        if ((<HTMLElement>document.getElementById(this._id)).parentNode !== undefined) {
            let parentMapID = (<HTMLElement>(<HTMLElement>document.getElementById(this._id)).parentNode).id;
            this._parent_map = (<HTMLElement>document.getElementById(parentMapID));
            this._parent_map_jq = $(this._parent_map);
            /*this.widthChanged = Observable.fromEvent(this._parent_map, 'resize')
                .map(() => {
                    return (<number>$(this._parent_map).width() * 0.20);
                }).debounceTime(200);
            this.heightChanged = Observable.fromEvent(this._parent_map, 'resize')
                .map(() => {
                    return (<number>$(this._parent_map).height() * 0.20);
                }).debounceTime(200);
            
            this.widthChanged.subscribe(val => console.log(val));*/

            $("#"+parentMapID).resize(function(){
                console.log('hi');
                //panel._widthChanged.next("I changed!");
            });

            return true;
        }
        throw "Error! Parent map is undefined.";
    }

    /**
    * Returns an array of arrays representing each grid square. An array value can be the following:
    * -1 : Invalid panel position (not coverable because it is some panel's min position)
    *  0 :  Valid panel position (no panels set in this area)
    * 1+: Valid panel position with 1 or more other panels capable of covering it (panel is here, but coverable)
    *
    * If width and/or height are not provided the width/height can be computed from the panel position. 
    * If position is not set throw an error
    * @param {number} [width] - the panel width
    * @param {number} [height] - the panel height
    * @return {number[][]} - array of arrays representing each grid square 
    */

    /*static*/ availableSpaces(width?: number, height?: number) {
        //TODO: since there will be a panelRegistry in the Map object would it make sense to return the panel registry?
        //Could have an option for user to return grid for just the panel
        if (this._map_object !== undefined) {
            return this._map_object.panelRegistry;
        }
    }

    /**
    * If no position is set, calculate based on a 1x1 panel. 
    * @return {number[][]} - array of arrays representing each grid square 
    */
    /*availableSpaces(): number[][] {
        return [[0]];
    }*/

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
    * @throws {Exception} - PositionUndefinedException
    * @throws {Exception} - Panel Out of Bounds error
    * 
    */
    open() {

        //check to see panel position is set
        if (this._bottomRightX !== undefined && this._bottomRightY !== undefined && this._topLeftX !== undefined && this._topLeftY !== undefined) {

            //check to see if panel position is out of bounds of grid 
            if (this.checkOutOfBounds(false, this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY) === false) {

                //If there is no conflict with an existing panel, allow the panel to open
                if (!this.conflictDetected()) {

                    //fires opening observable
                    this._opening.next()

                    this.changePosition(this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY);
                    this._panel_contents.classList.remove('hidden'); //hide panel before a call to open is made
                    this.updateAvailableSpaces(1, this._topLeftX, this._topLeftY, this._bottomRightX, this._bottomRightY);
                    this.updateAvailableSpaces(-1, this._minTopLeftX, this._minTopLeftY, this._minBottomRightX, this._minBottomRightY);
                    console.log([this._minTopLeftX, this._minTopLeftY, this._minBottomRightX, this._minBottomRightY]);
                    this._open = true;

                }
            }
        }
        else {
            throw "Exception: panel position is not set. Set position before opening panel.";
        }

    }

    /**
    * Helper method to open(). Detects a conflict where an opening panel interferes with the opening of another panel. 
    * @returns {boolean} - returns false if conflict is not detected
    * @throws {Exception} - ConflictDetectedError: Panel Unshrinkable!
    */
    private conflictDetected() {

        let availableSpaces = <number[][]>this.availableSpaces();

        //all the indices in this array 
        for (let i = this._topLeftX; i <= this._bottomRightX; i++) {
            for (let j = this._topLeftY; j <= this._bottomRightY; j++) {
                //if a panel exists where THIS panel is trying to open
                if (availableSpaces[i][j] !== 0) {
                    //if the current [i][j] conflict is in the territory of panel's min positions, throw an error
                    if ((i >= this._minTopLeftX && i <= this._minBottomRightX) || (j >= this._minTopLeftY && i <= this._minBottomRightY)) {
                        throw "ConflictDetectedError: Conflicting panels, this panel cannot shrink any further!";
                    }
                }
            }
        }

        return false;
    }

    /**
    * Helper method to conflictDetected(). Shrinks the panel (if possible) to accomodate a conflicting panel.
    * For now can only shrink the panel attempting to open on the map (not the already existing panel). 
    * @throws {Exception} - ConflictDetectedError: Panel Unshrinkable!
    */
    private shrinkPanel() {

        //panel shrinks by one row and one column
        return true;
    }

    /**
    * Closes the panel on the map. (For the user to see).
    */
    close() {
        this._closing.next();
        this._panel_contents.classList.add('hidden');
        this._open = false;
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
    * @param {number} topLeftX - the x coordinate of the top left square (set as top left panel corner) 
    * @param {number} topLeftY - the y coordinate of the top left square (set as top left panel corner) 
    * @param {number} bottomRightX - the y coordinate of the bottom right square (set as the bottom right panel corner)
    * @param {number} bottomRightY - the y coordinate of the bottom right square (set as the bottom right panel corner)
    */
    setPosition(topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number) {

        //if position supplied is invalid throw an error
        if (topLeftY > bottomRightY || topLeftX > bottomRightX) {
            throw "Invalid position supplied!";
        }
        else {
            //set position values
            this._topLeftX = topLeftX;
            this._topLeftY = topLeftY;
            this._bottomRightX = bottomRightX;
            this._bottomRightY = bottomRightY;

            //change min positions to new default -> user changes away from default if they want
            this.setMinPosition(topLeftX, topLeftY, bottomRightX, bottomRightY);

            this._positionChangedX.next([topLeftX, bottomRightX]);
            this._positionChangedY.next([topLeftY, bottomRightY]);

            //if panel already open, available spaces should be updated. 
            if (this._map_object !== undefined && this._open === true) {
                this.close();
                this.open();
            }

        }


    }


    /**
    * Sets the position for the Panel according to the map grid layout (such that panel has a minimum size). 
    * @param {number} topLeftX - the x coordinate of the top left square (set as top left panel corner) 
    * @param {number} topLeftY - the y coordinate of the top left square (set as top left panel corner) 
    * @param {number} bottomRightX - the y coordinate of the bottom right square (set as the bottom right panel corner)
    * @param {number} bottomRightY - the y coordinate of the bottom right square (set as the bottom right panel corner)
    */
    setMinPosition(topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number) {
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
    * @throws {Exception} - parent map not defined
    */
    changePosition(topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number) {
        if (this.setParentMap(this._map_object) === true) {
            //set left position (5% * parentWidth * topLeftX)
            var parentWidth = <number>this._parent_map_jq.width();
            this._panel_contents.style.left = (0.05 * parentWidth * topLeftX).toString() + "px";

            //set top position (5% * parentHeight * topLeftY)
            var parentHeight = <number>this._parent_map_jq.height();
            this._panel_contents.style.top = (0.05 * parentHeight * topLeftY).toString() + "px";

            //calculate width and height of panel according to bottom right. 
            this._panel_contents.style.width = ((bottomRightX - topLeftX) * 0.05 * parentWidth).toString() + "px";
            this._panel_contents.style.height = ((bottomRightY - topLeftY) * 0.05 * parentHeight).toString() + "px";
        }
    }

    /**
    * Helper Method: Checks to see if the panel is out of bounds of its _parent_map.
    * Does not correct the panel - up to panel creator to properly place panel on the map.
    * @throws {Exception} - OutOfBoundsException
    * @return {boolean} - false is returned if  OutOfBoundsException not thrown
    */
    checkOutOfBounds(isMin: boolean, topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number) {

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
            throw "OutOfBoundsException: Panel is not contained within grid";
        }

        //min position not within specified positioning
        if (isMin === true) {
            let minErrorConds = bottomRightX > this._bottomRightX || bottomRightY > this._bottomRightY || topLeftX < this._topLeftX || topLeftY < this._topLeftY;
            if (minErrorConds) {
                throw "OutOfBoundsException: min position panel is not contained within panel";
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
    setElement(element?: string | HTMLElement | JQuery<HTMLElement>) {

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
                throw "Exception: Cannot have multiple top level elements!";
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
    get id() {
        return this._id;
    }

    /**
    * Gets id of PanelElem object. 
    * @return {JQuery<HTMLElement>} - this PanelElem
    */
    get element() {
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