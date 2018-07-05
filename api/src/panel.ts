import { Observable, Subject } from 'rxjs';
import Map from 'api/map';
import { minusSVG, plusSVG, closeSVG } from '../theme/assets/images/panel-icons'; //import svg files

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
 * Panels require a map instance upon creation. A new Panel is easily created like so:
 * ```js
 * mapInstance.createPanel('panelID');   //do this
 * ```
 *
 * Map instances track panels through their panelRegistry. Thus to retrieve a panel on a map, the following can be done:
 * ```js
 * mapInstance.panelRegistry[2]; // retrieves the third panel added to the map instance
 * ```
 */

export class Panel {
    /**
     * Creates a new Panel.
     * @param {string}  id      - the user defined ID name for this Panel
     * @param {Map}     map     - the map instance that this Panel resides on
     */
    constructor(id: string, map: Map) {
        //init class attributes
        this.idAttr = id;
        this.openAttr = false;

        this.openingAttr = new Subject();
        this.closingAttr = new Subject();
        this.positionChangedAttr = new Subject();
        this.widthChangedAttr = new Subject();
        this.heightChangedAttr = new Subject();

        this.opening = this.openingAttr.asObservable();
        this.closing = this.closingAttr.asObservable();
        this.positionChanged = this.positionChangedAttr.asObservable();
        this.widthChanged = this.widthChangedAttr.asObservable();
        this.heightChanged = this.heightChangedAttr.asObservable();
        this.mapObject = map;
        this.mapHeight = $(this.mapObject.innerShell).height();
        this.mapWidth = $(this.mapObject.innerShell).width();

        //create panel components and document fragment
        this.createPanelComponents();
        this.windowResize(this);

        this.panelPositionsAttr = new PanelPositions(this);
        this.hidden = false;
    }

    /**
    * Returns the Map object for this panel, used in set height and set width of the PanelPositions class.
    * @return {Map} - the Map object for this Panel.
    */
    get map(): Map {
        return this.mapObject;
    }

    /**
    * Returns the PanelPositions object for this panel
    * @return {PanelPositions} - the PanelPositions object for this Panel.
    */
    get panelPositions(): PanelPositions {
        return this.panelPositionsAttr;
    }

    /**
    * Returns a newly created Btn
    */
    get button() {
        return Btn;
    }

    /**
    * Returns a newly created PanelElem
    * @param {string | HTMLElement | JQuery<HTMLElement>} element - the element to be scoped by the PanelElem
    * @return {Btn} - the PanelElem that was created.
    */
    get container() {
        return PanelElem;
    }

    /**
    * Helper method to create panel components and the document fragment, and to specify panel behaviour on window resize.
    * @private
    */
    private createPanelComponents(): void {

        //create panel components as HTMLElements
        this.panelContents = document.createElement("div");
        this.panelContents.classList.add('panel-contents');

        this.panelControls = document.createElement("div");
        this.panelControls.classList.add('panel-controls');
        this.panelControls.classList.add('hidden');

        this.panelBody = document.createElement("div");
        this.panelBody.classList.add('panel-body');
        this.panelBody.classList.add('hidden');

        this.separator = document.createElement('div');
        this.separator.classList.add('separator');
        this.separator.classList.add('hidden');


        this.panelContents.setAttribute('id', this.idAttr.toString());

        //append panel controls/body to panel contents ("shell")
        this.panelContents.appendChild(this.panelControls);
        this.panelContents.appendChild(this.separator);
        this.panelContents.appendChild(this.panelBody);
        this.panelContents.classList.add('hidden'); //hide panel before a call to open is made
        //append panel contents ("shell") to document fragment
        this.documentFragment = document.createDocumentFragment();
        this.documentFragment.appendChild(this.panelContents);

        $(this.mapObject.innerShell).append(this.documentFragment);
    }


    /**
    * Helper method to deal with Panel behaviour when the map grid changes size.
    * @private
    */
    private windowResize(panel: Panel): void {

        $(window).resize(function () {

            let panelCoords = panel.panelPositions.panelCoords;
            let parentHeight = $(panel.mapObject.innerShell).height();
            let parentWidth = $(panel.mapObject.innerShell).width();
            let controlsHeight = $(panel.panelControls).height();

            //if current width is different from stored width, fire width changed
            if (panel.mapWidth !== undefined && panel.mapWidth !== parentWidth && parentWidth !== undefined) {
                panel.widthChangedAttr.next(parentWidth * 0.05);
                panel.mapWidth = parentWidth;
            }

            //if current height is different from stored height, fire height changed
            else if (panel.mapWidth !== undefined && panel.mapHeight !== parentHeight && parentHeight !== undefined) {
                panel.heightChangedAttr.next(parentHeight * 0.05);
                panel.mapHeight = parentHeight;
            }

            //changes width/height to new percentage value of the map
            panel.changePosition();

            //need to preserve previously defined width and height of panel
            if (panel.widthAttr !== undefined) {
                panel.width = panel.widthAttr;
            }
            if (panel.heightAttr !== undefined) {
                panel.height = panel.heightAttr;
            }

            //ensures that toggle (open/close of panel body) is preserved during position change
            if (parentHeight !== undefined) {
                panel.contentsHeight = ((panelCoords[3] - panelCoords[1] - 1) * 0.05 * parentHeight);

                if (panel.panelBody.classList.contains('hidden') && controlsHeight !== undefined) {
                    panel.panelContents.style.height = controlsHeight.toString() + 'px';
                }
                else {
                    panel.panelContents.style.height = (panel.contentsHeight + 0.1 * parentHeight).toString() + "px";
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

        if (this.mapObject === undefined) {
            throw "Exception: this panel's map is not set; cannot retrieve grid.";
        }

        //if no position, width or height set calculate based on a 1x1 panel
        if (this.panelPositions.panelCoords.every(coord => coord === undefined) && width === undefined && height === undefined) {

            return Panel.availableSpaces(this.mapObject.panelRegistry, 1, 1);
        }
        else {
            //calculate based on user supplied width and height
            if (width !== undefined && height !== undefined) {
                return Panel.availableSpaces(this.mapObject.panelRegistry, width, height, this);
            }
            else {
                //calculate based on width and height from panel position
                return Panel.availableSpaces(this.mapObject.panelRegistry, this.panelPositions.panelCoords[2] - this.panelPositions.panelCoords[0] + 1, this.panelPositions.panelCoords[3] - this.panelPositions.panelCoords[1] + 1, this);
            }
        }
    }

    /**
    * Returns controls for the Panel
    * @return {(PanelElem | Btn)[]} - a list of controls for the Panel.
    */
    get controls(): (PanelElem | Btn)[] {
        return this.controlsAttr;
    }

    /**
    * Sets panel controls.
    * @param {(PanelElem | Btn)[]} elems - the array of control elements that are set as panel controls
    */
    set controls(elems: (PanelElem | Btn)[]) {
        this.panelControls.classList.remove('hidden');
        this.separator.classList.remove('hidden');
        this.controlsAttr = elems;
        let body = this.panelBody;
        //First empty existing controls
        this.panelControls.innerHTML = '';
        let panel = this;

        //then fill in new controls
        for (let elem of elems) {
            $(this.panelControls).append(elem.elementAttr.get(0));
            elem.elementAttr.get(0).classList.add('inline');

            //if the control is a close button, then open/close panel upon clicking
            if (elem.elementAttr.get(0).classList.length === 4 && elem.elementAttr.get(0).classList[1] === "close-btn") {
                $(elem.elementAttr.get(0)).click(function () {
                    panel.close();
                });
            }
            //if the control button is a toggle button, then allow it to toggle visibility of panel body
            else if (elem.elementAttr.get(0).classList.length === 4 && elem.elementAttr.get(0).classList[1] === "toggle-btn") {
                $(elem.elementAttr.get(0)).click(function () {


                    let btn = new Btn();
                    btn.elementAttr.addClass('btn');
                    btn.elementAttr.addClass('toggle-btn');
                    elem.elementAttr.get(0).removeChild(<HTMLElement>elem.elementAttr.get(0).firstChild);
                    let controls = $(panel.panelControls).height();
                    let parentHeight = panel.mapHeight;

                    // if user wants to expand panel
                    if (body.classList.contains('hidden')) {
                        body.classList.remove('hidden');
                        btn.icon = <SVGElement>minusSVG;
                        panel.hidden = false;
                        elem.elementAttr.get(0).appendChild(minusSVG);
                        if (panel.contentsHeight !== undefined && parentHeight !== undefined) {
                            panel.panelContents.style.height = (panel.contentsHeight + parentHeight * 0.10).toString() + 'px';
                        }
                    }
                    //if user wants to shrink panel
                    else {
                        body.classList.add('hidden');
                        let btn = new Btn();
                        btn.icon = <SVGElement>plusSVG;
                        panel.hidden = true;
                        elem.elementAttr.get(0).appendChild(plusSVG);
                        if (controls !== undefined) {
                            panel.panelContents.style.height = controls.toString() + 'px';
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

        let panelCoords = this.panelPositions.panelCoords;

        if (this.mapObject !== undefined) {

            //check to see panel position is set
            if (panelCoords.every(coord => coord !== undefined)) {

                //check to see if panel position is out of bounds of grid
                if (this.panelPositions.checkOutOfBounds(false, panelCoords[0], panelCoords[1], panelCoords[2], panelCoords[3]) === false) {

                    //If there is no conflict with an existing panel, allow the panel to open
                    if (!this.conflictDetected()) {

                        //fires opening observable
                        this.openingAttr.next()

                        //changes position on map and updates panel registry
                        this.changePosition();
                        this.panelContents.classList.remove('hidden'); //hide panel before a call to open is made

                        if (this.hidden) {
                            this.panelContents.style.height = (<number>$(this.panelControls).height()).toString() + 'px';
                        }

                        this.openAttr = true;
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
        for (let panel of this.mapObject.panelRegistry) {
            if (panel.openAttr === true && panel !== this) {
                this.panelPositions.conflictDetected(panel);
                this.changePosition();
                panel.changePosition();
            }
        }
        return false;
    }

    /**
    * Closes the panel on the map. (For the user to see).
    * @throws {Exception} - panel is either: not added to the map, doesn't have a position set, is not open.
    */
    close(): void {
        let panelCoords = this.panelPositions.panelCoords;

        //if the map doesn't exist or the position hasn't been set then the map hasn't been added to a map
        if (this.mapObject !== undefined && panelCoords.every(coord => coord !== undefined) && this.openAttr === true) {
            this.closingAttr.next();
            this.panelContents.classList.add('hidden');
            this.openAttr = false;
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
        return this.contentAttr;
    }


    /**
    * Sets the contents for the Panel
    * @param {PanelElem} content - the PanelElem to be used as panel's contents (scopes other PanelElems)
    */
    set content(content: PanelElem) {

        this.panelBody.classList.remove('hidden');

        this.contentAttr = content;

        //First empty existing content
        this.panelBody.innerHTML = '';

        //then fill in new contents
        $(this.panelBody).append(content.element);
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
        return $(this.panelContents);
    }


    /**
    * Sets the position for the Panel according to the map grid layout.
    * @param {number} topLeft - the grid square that is the panel's top left corner
    * @param {number} bottomRight - the grid square that is the panel's bottom right corner
    * @throws {Exception} - positions supplied are out of bound of map grid.
    */
    setPosition(topLeftCoord: number | number[], bottomRightCoord: number | number[]): void {

        let topLeft: number;
        let bottomRight: number;

        if (typeof topLeftCoord !== 'number' && typeof bottomRightCoord !== 'number') {
            topLeft = topLeftCoord[0] + topLeftCoord[1] * 20;
            bottomRight = bottomRightCoord[0] + bottomRightCoord[1] * 20;
        }
        else {
            topLeft = <number>topLeftCoord;
            bottomRight = <number>bottomRightCoord;
        }

        let parentHeight = $(this.mapObject.innerShell).height();

        if (topLeft !== undefined && bottomRight !== undefined) {
            if (topLeft < 0 || topLeft > 399 || bottomRight < 0 || bottomRight > 399) {
                throw "Exception: positions cannot be less than 0 or greater than 399.";
            }

            if (this.panelPositions.setPanelPosition(topLeft, bottomRight)) {

                let panelCoords = this.panelPositions.panelCoords;

                //change min positions to new default -> user changes away from default if they want
                this.setMinPosition(topLeft, bottomRight);

                this.positionChangedAttr.next([topLeft, bottomRight]);

                //refresh width and height properties
                this.widthAttr = undefined;
                this.heightAttr = undefined;
                this.panelContents.style.maxHeight = "none";
                this.panelContents.style.maxWidth = "none";

                //if panel already open, available spaces should be updated.
                if (this.mapObject !== undefined && this.openAttr === true) {
                    this.close();
                    this.open();
                }
                if (parentHeight !== undefined) {
                    this.contentsHeight = ((panelCoords[3] - panelCoords[1] - 1) * 0.05 * parentHeight);
                }
            }
        }

    }

    /**
    * Sets the width for the Panel.
    * @param {number | string} width - the width of the panel in pixels (number) or percent (string).
    * @throws {Exception} - cannot set width if panel is not open.
    */
    set width(width: number | string) {
        if (this.openAttr) {
            if (typeof this.panelPositions.setWidth(width) === 'string') {
                this.panelContents.style.maxWidth = this.panelPositions.setWidth(width);
                this.panelContents.style.width = this.panelPositions.setWidth(width);
                this.panelContents.style.minHeight = this.panelPositions.setHeight(width);
                this.widthAttr = width;
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
        if (this.openAttr) {

            if (typeof this.panelPositions.setHeight(height) === 'string') {
                this.panelContents.style.height = this.panelPositions.setHeight(height);
                this.panelContents.style.maxHeight = this.panelPositions.setHeight(height);
                this.panelContents.style.minHeight = this.panelPositions.setHeight(height);
                this.heightAttr = height;
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
    setMinPosition(topLeftCoord: number | number[], bottomRightCoord: number | number[]): void {

        let panelCoords = this.panelPositions.panelCoords;

        if (!panelCoords.every(coord => coord !== undefined)) {
            throw "Exception: cannot set min position before a valid position is set.";
        }

        let topLeft: number;
        let bottomRight: number;

        if (typeof topLeftCoord !== 'number' && typeof bottomRightCoord !== 'number') {
            topLeft = topLeftCoord[0] + topLeftCoord[1] * 20;
            bottomRight = bottomRightCoord[0] + bottomRightCoord[1] * 20;
        }
        else {
            topLeft = <number>topLeftCoord;
            bottomRight = <number>bottomRightCoord;
        }

        if (topLeft < 0 || topLeft > 399 || bottomRight < 0 || bottomRight > 399) {
            throw "Exception: positions cannot be less than 0 or greater than 399.";
        }

        if (this.panelPositions.setMinPanelPosition(topLeft, bottomRight)) {
            //if panel already open, available spaces should be updated. (everything outside min is coverable)
            if (this.mapObject !== undefined && this.openAttr === true) {
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

        let panelCoords = this.panelPositions.panelCoords;

        //set left position (5% * parentWidth * topLeftX)
        let parentWidth = <number>$(this.mapObject.innerShell).width();
        this.panelContents.style.left = (0.05 * parentWidth * panelCoords[0]).toString() + "px";

        //set top position (5% * parentHeight * topLeftY)
        //need to forcecast because height and width return undefined
        let parentHeight = <number>$(this.mapObject.innerShell).height();
        this.panelContents.style.top = (0.05 * parentHeight * panelCoords[1]).toString() + "px";

        //calculate width and height of panel according to bottom right.
        this.panelContents.style.width = ((panelCoords[2] - panelCoords[0] + 1) * 0.05 * parentWidth).toString() + "px";
        this.panelContents.style.height = ((panelCoords[3] - panelCoords[1] + 1) * 0.05 * parentHeight).toString() + "px";

    }
}

/**
 * PanelElems can be set as the contents or controls of the Panel.
 *
 * `PanelElem` can be of type string, HTMLElement or JQuery<HTMLElement>. The can be constructed like so:
 * ```js
 * let panelElem2 = panel1.createPanelElem($("<div style='color: lightslategray'>Contents:</div>"));
 * let panelElem3 = panel1.createPanelElem($.parseHTML('<input type="text" value="Search..." id="coolInput"></input>'));
 * ```
 *
 * Shortcuts can be used to create special `PanelElem`s inteded for use on panel controls. There are four shortcuts:
 * ```js
 * let panelElem1 = panel1.createPanelElem('Layers');   //Title shortcut
 * let panelElem2 = panel1.createPanelElem('T'); //toggle shortcut
 * let panelElem3 = panel1.createPanelElem('x'); //close button shortcut
 * let panelElem4 = panel1.createPanelElem('|'); //controls divider shortcut
 * ```
 */
export class PanelElem {

    /**
    * Constructs PanelElem object
    * @constructor
    * @param {string | HTMLElement | JQuery<HTMLElement>} [element] - element to be set as PanelElem (strings assumed to be titles)
    *                                                               - not to be specified for Btns    */
    constructor(element?: string | HTMLElement | JQuery<HTMLElement>) {
        if (element)
            this.setElement(element);
    }

    set title(title: string) {
        this.elementAttr = $('<h1 style="font-weight: normal">' + title + '</h1>');
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
        

        //if the element is a string either control divider, close button or title
        if (typeof element === "string") {
            
        }
        else {
            this.elementAttr = $(element);

            //Throw exception if there's multiple top level elements
            let children = this.elementAttr.html();
            let checkElem = this.elementAttr.empty();
            if (checkElem.length > 1) {
                throw "Exception: cannot have multiple top level elements.";
            }
            this.elementAttr = this.elementAttr.append(children);
        }


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


/**
 * `Btn`s can be set to SVG icons or text.
 *
 * Creating `Btn`s:
 * ```js
 *
 * // a text Btn
 * let btn = panel1.createBtn();
 * btn.text = "Btn.";
 *
 * //an SVG Btn
 *
 * //setup for svg
 * let svg = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>');
 *
 * //assigning it to the Btn
 * let btn2 = panel1.createBtn();
 * btn2.icon = svg[0];
 * ```
 */
class Btn extends PanelElem {

    elementAttr = <JQuery<HTMLElement>>$('<button class="btn"></button>');

    constructor(type?: string) {
        super();
        // close button
        if (type === "x") {
            this.icon = <SVGElement>closeSVG;
            this.elementAttr = this.element;
            this.elementAttr.addClass('btn');
            this.elementAttr.addClass('close-btn');

        }
        //toggle button
        else if (type === 'T') {
            this.icon = <SVGElement>minusSVG;
            this.elementAttr = this.element;
            this.elementAttr.addClass('btn');
            this.elementAttr.addClass('toggle-btn');
        }
    }

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
        this.elementAttr.append(svg);
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


/**
 * PanelPositions is used to abstract positioning information and positioning related calculations for Panels.
 * The Panel class methods uses some PanelPositions methods as helpers.
 * This is not meant to be used directly by the API user.
 */
class PanelPositions {

    /**
    * Constructs PanelElem object
    * @constructor
    * @param {Panel} panel - Panel for which position relation computations are performed
    */
    constructor(panel: Panel) {
        this.panelAttr = panel;
    }

    /**
    * Constructs PanelElem object
    * @return {number[]} - topLeft and bottomRight Panel coordinates
    */
    get panelCoords(): number[] {
        return [this.topLeftXVal, this.topLeftYVal, this.bottomRightXVal, this.bottomRightYVal];
    }

    get minPanelCoords(): number[] {
        return [this.mintopLeftXVal, this.mintopLeftYVal, this.minbottomRightXVal, this.minbottomRightYVal]
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
            this.topLeftXVal = topLeftX;
            this.topLeftYVal = topLeftY;
            this.bottomRightXVal = bottomRightX;
            this.bottomRightYVal = bottomRightY;
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
            this.mintopLeftXVal = topLeftX;
            this.mintopLeftYVal = topLeftY;
            this.minbottomRightXVal = bottomRightX;
            this.minbottomRightYVal = bottomRightY;
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
            let minErrorConds = bottomRightX > this.bottomRightXVal || bottomRightY > this.bottomRightYVal || topLeftX < this.topLeftXVal || topLeftY < this.topLeftYVal;
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
        //these are the positions of the "enemy panel"
        let topLeftX = panel.panelPositions.panelCoords[0];
        let topLeftY = panel.panelPositions.panelCoords[1];
        let bottomRightX = panel.panelPositions.panelCoords[2];
        let bottomRightY = panel.panelPositions.panelCoords[3];
        //these are the min positions of the "enemy panel"
        let minTopLeftX = panel.panelPositions.minPanelCoords[0];
        let minTopLeftY = panel.panelPositions.minPanelCoords[1];
        let minBottomRightX = panel.panelPositions.minPanelCoords[2];
        let minBottomRightY = panel.panelPositions.minPanelCoords[3];

        //if our panel doesn't completely avoid "enemy panel", then one of the panels is shrunk incrementally to min position
        //avoiding happens when our panel's min is to left OR top OR bottom OR right (or some combo) relative to enemy
        if (!(this.bottomRightXVal < topLeftX || this.bottomRightYVal < topLeftY || this.topLeftXVal > bottomRightX || this.topLeftYVal > bottomRightY)) {

            //if our panel's min doesn't completely avoid enemy panel's min, then our panel can't open
            if (!(this.minbottomRightXVal < minTopLeftX || this.minbottomRightYVal < minTopLeftY || this.mintopLeftXVal > minBottomRightX || this.mintopLeftYVal > minBottomRightY)) {
                throw "Exception: conflicting panels, panels cannot shrink any further to accomodate, panel closing.";
            }
            else {

                let newLeft = this.topLeftXVal;
                let newTop = this.topLeftYVal;
                let newBottom = this.bottomRightYVal;
                let newRight = this.bottomRightXVal;

                let oldMinLeft = this.mintopLeftXVal;
                let oldMinTop = this.mintopLeftYVal;
                let oldMinRight = this.minbottomRightXVal;
                let oldMinBottom = this.minbottomRightYVal;

                let shrunk = false; // here so that panels don't shrink twice

                //if our min position avoided enemy panel by being on left, decrease right position of this panel to get closer to min
                if (this.minbottomRightXVal < topLeftX && this.bottomRightXVal > this.minbottomRightXVal) {
                    newRight = topLeftX - 1;
                    console.log("Shrinking right!");
                    shrunk = true;
                }
                //if enemy min position avoided our panel by being on left, decrease right position of enemy panel to get closer to min
                else if (minBottomRightX < this.topLeftXVal && bottomRightX > minBottomRightX) {
                    bottomRightX = this.topLeftXVal - 1;
                    console.log("Shrinking enemy right!");
                    shrunk = true;
                }
                //if min position avoided enemy min by being on left of enemy min
                else if (this.minbottomRightXVal < minTopLeftX && this.bottomRightXVal > this.minbottomRightXVal) {
                    newRight = oldMinRight; //we shrink this panel's right down to its min
                    topLeftX = oldMinRight + 1; // we shrink the enemy's left to fit on right of this panel
                    console.log("Shrinking right!");
                    shrunk = true;
                }
                //if enemy min position avoided enemy min by being on left of this panel's min
                else if (minBottomRightX < this.mintopLeftXVal && bottomRightX > minBottomRightX) {
                    bottomRightX = minBottomRightX; //we shrink enemy's right down to its min
                    newLeft = minBottomRightX + 1; //we shrink this panel's left  to fit on right of enemy panel
                    console.log("Shrinking enemy right!")
                    shrunk = true;
                }

                //if issue was resolved don't shrink another dimension (want to max out space)
                if (!shrunk) {
                    //if min position avoided panel by being on top, decrease bottom position of this panel to get closer to min
                    if (this.minbottomRightYVal < topLeftY && this.bottomRightYVal > this.minbottomRightYVal) {
                        newBottom = topLeftY - 1;
                        console.log("Shrinking bottom!");
                        shrunk = true;

                    }
                    //if enemy min position avoided our panel by being on top, decrease bottom position of enemy panel to get closer to min
                    else if (minBottomRightY < this.topLeftYVal && bottomRightY > minBottomRightY) {
                        bottomRightY = this.topLeftYVal - 1;
                        console.log("Shrinking enemy bottom!");
                        shrunk = true;

                    }
                    //if min position avoided enemy min by being on top of enemy min
                    else if (this.minbottomRightYVal < topLeftY && this.bottomRightYVal > this.minbottomRightYVal) {
                        newBottom = oldMinBottom; //we shrink this panel's bottom down to its min
                        topLeftY = oldMinBottom + 1; // we shrink the enemy's top to fit right below this panel
                        console.log("Shrinking bottom!");
                        shrunk = true;

                    }
                    else if (minBottomRightY < this.mintopLeftYVal && bottomRightY > minBottomRightY) {
                        bottomRightY = minBottomRightY; //we shrink enemy panel's bottom down to its min
                        newTop = minBottomRightY + 1; // we shrink the this panel's top to fit right below enemy
                        console.log("Shrinking enemy bottom!");
                        shrunk = true;
                    }
                }
                if (!shrunk) {
                    //if min position avoided panel by being on right, increase left position of this panel to get closer to min
                    if (this.mintopLeftXVal > minBottomRightX && this.topLeftXVal < this.mintopLeftXVal) {
                        newLeft = bottomRightX + 1;
                        console.log("Shrinking left!");
                        shrunk = true;
                    }
                    //if enemy min position avoided enemy min position by being on right, increase left position of enemy panel to get closer to min
                    else if (minTopLeftX > this.bottomRightXVal && topLeftX < minTopLeftX) {
                        topLeftX = oldMinLeft;
                        console.log("Shrinking enemy left!");
                        shrunk = true;
                    }
                    //if min position avoided enemy min by being on right of enemy min
                    else if (this.mintopLeftXVal > minBottomRightX && this.topLeftXVal < this.mintopLeftXVal) {
                        newLeft = oldMinLeft; //we shrink this panel's left down to its min
                        bottomRightX = oldMinLeft - 1; // we shrink the enemy's right to fit right at left of enemy min
                        console.log("Shrinking left!");
                        shrunk = true;
                    }
                    else if (minTopLeftX > this.minbottomRightXVal && topLeftX < minTopLeftX) {
                        topLeftX = minTopLeftX; //we shrink the enemy's left down to its min
                        newRight = minTopLeftX - 1; //we shrink this panel's right to fit at left of the enemy min
                        console.log("Shrinking enemy left!");
                        shrunk = true;
                    }
                }

                if (!shrunk) {
                    //if min position avoided panel by being on bottom, increase top position of this panel to get closer to min
                    if (this.mintopLeftYVal > bottomRightY && this.topLeftYVal < this.mintopLeftYVal) {
                        newTop = bottomRightY + 1;
                        console.log("Shrinking top!");
                    }
                    //if enemy min position avoided our panel by being on bottom, increase top position of enemy panel to get closer to min
                    else if (minTopLeftY > this.bottomRightYVal && topLeftY < minTopLeftY) {
                        topLeftY = this.bottomRightYVal + 1;
                        console.log("Shrinking enemy top!");
                    }
                    //if min position avoided enemy min by being on bottom of enemy min
                    else if (this.mintopLeftYVal > minBottomRightY && this.topLeftYVal < this.mintopLeftYVal) {
                        newTop = oldMinTop; //we shrink this panel's top down to its min
                        bottomRightY = oldMinTop - 1; // we shrink the enemy's bottom to fit right on top of this panel
                        console.log("Shrinking top!");
                    }
                    else if (minTopLeftY > this.minbottomRightYVal && topLeftY < minTopLeftY) {
                        topLeftY = minTopLeftY; //we shrink the enemy's top down to its min
                        newBottom = minTopLeftY - 1; // we shrink the this panel's bottom to fit right on top of the enemy panel
                        console.log("Shrinking enemy top!");
                    }
                }

                this.setPanelPosition(newTop * 20 + newLeft, newBottom * 20 + newRight);
                this.setMinPanelPosition(oldMinTop * 20 + oldMinLeft, oldMinBottom * 20 + oldMinRight);

                panel.panelPositions.setPanelPosition(topLeftY * 20 + topLeftX, bottomRightY * 20 + bottomRightX);
                panel.panelPositions.setMinPanelPosition(minTopLeftY * 20 + minTopLeftX, minBottomRightY * 20 + minBottomRightX);
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
            if (panel.panelPositions.bottomRightXVal !== panel.panelPositions.minbottomRightXVal || panel.panelPositions.bottomRightYVal !== panel.panelPositions.minbottomRightYVal || panel.panelPositions.topLeftXVal !== panel.panelPositions.mintopLeftXVal || panel.panelPositions.topLeftYVal !== panel.panelPositions.mintopLeftYVal) {

                //how far removed the min topLeft from topLeft?
                minTopX = panel.panelPositions.mintopLeftXVal - panel.panelPositions.topLeftXVal;
                minTopY = panel.panelPositions.mintopLeftYVal - panel.panelPositions.topLeftYVal;

                //how far removed is minBottomRight topLeft?
                minBottomX = panel.panelPositions.minbottomRightXVal - panel.panelPositions.topLeftXVal;
                minBottomY = panel.panelPositions.minbottomRightYVal - panel.panelPositions.topLeftYVal;
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
            if (panelObj.openAttr === true && panelObj !== panel) {

                //panel position will be invalid if the topLeft coordinate of the panel when treated as the bottomRight corner overlaps
                let topLeftX = panelObj.panelPositions.topLeftXVal - width + 1;
                let originalTopLeftX = panelObj.panelPositions.topLeftXVal;
                let topLeftY = panelObj.panelPositions.topLeftYVal - height + 1;
                let originalTopLeftY = panelObj.panelPositions.topLeftYVal;
                let bottomRightX = panelObj.panelPositions.bottomRightXVal;
                let bottomRightY = panelObj.panelPositions.bottomRightYVal;

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

        let parentWidth = <number>$(this.panelAttr.map.innerShell).width();

        if (typeof width === 'number') {

            let topLeftPx = this.topLeftXVal * 0.05 * parentWidth
            let bottomRightPx = this.bottomRightXVal * 0.05 * parentWidth;

            //as long as supplied width is within panel width -> else ignored
            if (topLeftPx + width <= bottomRightPx) {
                return width.toString() + "px";
            }
        }
        else {
            let numWidth = parseInt(width.slice(0, -1)) * 0.01; //convert the percent into a decimal
            //as long as supplied width is within panel width in percents
            if (numWidth >= 0 && numWidth <= 1) {

                let panelWidth = (this.bottomRightXVal - this.topLeftXVal + 1) * 0.05 * parentWidth;
                let newWidth = panelWidth * numWidth;   //converts percent width to pixel width
                let topLeftPx = this.topLeftXVal * 0.05 * parentWidth
                let bottomRightPx = this.bottomRightXVal * 0.05 * parentWidth;

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

        let parentHeight = <number>$(this.panelAttr.map.innerShell).height();

        if (typeof height === 'number') {

            let topLeftPx = this.topLeftYVal * 0.05 * parentHeight;
            let bottomRightPx = this.bottomRightYVal * 0.05 * parentHeight;

            //as long as supplied width is within panel width -> else ignored
            if (topLeftPx + height <= bottomRightPx) {
                return height.toString() + "px";
            }
        }
        else {
            let numHeight = parseInt(height.slice(0, -1)) * 0.01; //convert the percent into a decimal
            //as long as supplied width is within panel width in percents
            if (numHeight >= 0 && numHeight <= 1) {

                let panelHeight = (this.bottomRightYVal - this.topLeftYVal + 1) * 0.05 * parentHeight;
                let newHeight = panelHeight * numHeight;   //converts percent width to pixel width
                let topLeftPx = this.topLeftYVal * 0.05 * parentHeight;
                let bottomRightPx = this.bottomRightYVal * 0.05 * parentHeight;

                //as long as supplied width is within panel width -> else ignored
                if (topLeftPx + newHeight <= bottomRightPx) {
                    return newHeight.toString() + "px";
                }
            }
        }
        return null;
    }
}

export interface Panel {

    idAttr: string;

    //Panel items
    contentAttr: PanelElem;
    controlsAttr: (PanelElem)[];

    //HTML parent Components
    panelContents: HTMLElement;
    panelControls: HTMLElement;
    panelBody: HTMLElement;
    documentFragment: DocumentFragment;
    separator: HTMLElement;

    mapWidth: number | undefined;
    mapHeight: number | undefined;

    mapObject: Map;

    widthAttr: number | string | undefined;
    heightAttr: number | string | undefined;

    contentsHeight: number;
    hidden: boolean;

    //subjects initialized for observables that are fired through method calls
    openingAttr: Subject<any>;
    closingAttr: Subject<any>;
    positionChangedAttr: Subject<any>;
    widthChangedAttr: Subject<any>;
    heightChangedAttr: Subject<any>;

    panelPositionsAttr: PanelPositions;

    openAttr: boolean; //whether panel is open or closed

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
    angularCompiler: (html: Element) => JQuery<HTMLElement>
}

interface PanelPositions {
    topLeftXVal: number;
    topLeftYVal: number;
    bottomRightXVal: number;
    bottomRightYVal: number;

    mintopLeftXVal: number;
    mintopLeftYVal: number;
    minbottomRightXVal: number;
    minbottomRightYVal: number;

    panelAttr: Panel;
}
