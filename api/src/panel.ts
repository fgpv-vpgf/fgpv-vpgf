import { Observable, Subject } from 'rxjs';
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
+    * Creates a new Panel.
+    * @constructor
+    * @param {string} id - the user defined ID name for this Panel
     * @param {Map} map - the map instance that this Panel resides on
+    */
    constructor(id: string, map: Map) {

        //init class attributes
        this.id_attr = id;
        this.open_attr = false;

        this.opening_attr = new Subject();
        this.closing_attr = new Subject();
        this.position_changed = new Subject();
        this.width_changed = new Subject();
        this.height_changed = new Subject();

        this.opening = this.opening_attr.asObservable();
        this.closing = this.closing_attr.asObservable();
        this.positionChanged = this.position_changed.asObservable();
        this.widthChanged = this.width_changed.asObservable();
        this.heightChanged = this.height_changed.asObservable();
        this.map_object = map;
        this.map_height = $(this.map_object.innerShell).height();
        this.map_width = $(this.map_object.innerShell).width();

        //create panel components and document fragment
        this.createPanelComponents();
        this.windowResize(this);

        this.panel_positions = new PanelPositions(this);
        this.hidden = false;
    }

    /**
    * Returns the Map object for this panel, used in set height and set width of the PanelPositions class.
    * @return {Map} - the Map object for this Panel.
    */
    get map(): Map {
        return this.map_object;
    }

    /**
    * Returns the PanelPositions object for this panel
    * @return {PanelPositions} - the PanelPositions object for this Panel.
    */
    get panelPositions(): PanelPositions {
        return this.panel_positions;
    }

    /**
    * Returns a newly created Btn
    * @return {Btn} - the Btn that was created.
    */
    createBtn(): Btn {
        return new Btn();
    }

    /**
    * Returns a newly created PanelElem
    * @param {string | HTMLElement | JQuery<HTMLElement>} element - the element to be scoped by the PanelElem
    * @return {Btn} - the PanelElem that was created.
    */
    createPanelElem(element: string | HTMLElement | JQuery<HTMLElement>): PanelElem {
        return new PanelElem(element);
    }

    /**
    * Helper method to create panel components and the document fragment, and to specify panel behaviour on window resize.
    * @private
    */
    private createPanelComponents(): void {

        //create panel components as HTMLElements
        this.panel_contents = document.createElement("div");
        this.panel_contents.classList.add('panel-contents');

        this.panel_controls = document.createElement("div");
        this.panel_controls.classList.add('panel-controls');
        this.panel_controls.classList.add('hidden');

        this.panel_body = document.createElement("div");
        this.panel_body.classList.add('panel-body');
        this.panel_body.classList.add('hidden');

        this.separator = document.createElement('div');
        this.separator.classList.add('separator');
        this.separator.classList.add('hidden');


        this.panel_contents.setAttribute('id', this.id_attr.toString());

        //append panel controls/body to panel contents ("shell")
        this.panel_contents.appendChild(this.panel_controls);
        this.panel_contents.appendChild(this.separator);
        this.panel_contents.appendChild(this.panel_body);
        this.panel_contents.classList.add('hidden'); //hide panel before a call to open is made
        //append panel contents ("shell") to document fragment
        this.document_fragment = document.createDocumentFragment();
        this.document_fragment.appendChild(this.panel_contents);

        $(this.map_object.innerShell).append(this.document_fragment);
    }


    /**
    * Helper method to deal with Panel behaviour when the map grid changes size.
    * @private
    */
    private windowResize(panel: Panel): void {

        $(window).resize(function () {

            let panelCoords = panel.panelPositions.panelCoords;
            let parentHeight = $(panel.map_object.innerShell).height();
            let parentWidth = $(panel.map_object.innerShell).width();
            let controlsHeight = $(panel.panel_controls).height();

            //if current width is different from stored width, fire width changed
            if (panel.map_width !== undefined && panel.map_width !== parentWidth && parentWidth !== undefined) {
                panel.width_changed.next(parentWidth * 0.05);
                panel.map_width = parentWidth;
            }

            //if current height is different from stored height, fire height changed
            else if (panel.map_width !== undefined && panel.map_height !== parentHeight && parentHeight !== undefined) {
                panel.height_changed.next(parentHeight * 0.05);
                panel.map_height = parentHeight;
            }

            //changes width/height to new percentage value of the map
            panel.changePosition();

            //need to preserve previously defined width and height of panel
            if (panel.width_attr !== undefined) {
                panel.width = panel.width_attr;
            }
            if (panel.height_attr !== undefined) {
                panel.height = panel.height_attr;
            }

            //ensures that toggle (open/close of panel body) is preserved during position change
            if (parentHeight !== undefined) {
                panel.contents_height = ((panelCoords[3] - panelCoords[1] - 1) * 0.05 * parentHeight);

                if (panel.panel_body.classList.contains('hidden') && controlsHeight !== undefined) {
                    panel.panel_contents.style.height = controlsHeight.toString() + 'px';
                }
                else {
                    panel.panel_contents.style.height = (panel.contents_height + 0.1 * parentHeight).toString() + "px";
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

        if (this.map_object === undefined) {
            throw "Exception: this panel's map is not set; cannot retrieve grid.";
        }

        //if no position, width or height set calculate based on a 1x1 panel
        if (this.panelPositions.panelCoords.every(coord => coord === undefined) && width === undefined && height === undefined) {

            return Panel.availableSpaces(this.map_object.panelRegistry, 1, 1);
        }
        else {
            //calculate based on user supplied width and height
            if (width !== undefined && height !== undefined) {
                return Panel.availableSpaces(this.map_object.panelRegistry, width, height, this);
            }
            else {
                //calculate based on width and height from panel position
                return Panel.availableSpaces(this.map_object.panelRegistry, this.panelPositions.panelCoords[2] - this.panelPositions.panelCoords[0] + 1, this.panelPositions.panelCoords[3] - this.panelPositions.panelCoords[1] + 1, this);
            }
        }
    }

    /**
    * Returns controls for the Panel
    * @return {(PanelElem | Btn)[]} - a list of controls for the Panel.
    */
    get controls(): (PanelElem | Btn)[] {
        return this.controls_attr;
    }

    /**
    * Sets panel controls.
    * @param {(PanelElem | Btn)[]} elems - the array of control elements that are set as panel controls
    */
    set controls(elems: (PanelElem | Btn)[]) {
        this.panel_controls.classList.remove('hidden');
        this.separator.classList.remove('hidden');
        this.controls_attr = elems;
        let body = this.panel_body;
        //First empty existing controls
        this.panel_controls.innerHTML = '';
        let panel = this;

        //then fill in new controls
        for (let elem of elems) {
            $(this.panel_controls).append(elem.element_attr.get(0));
            elem.element_attr.get(0).classList.add('inline');

            //if the control is a close button, then open/close panel upon clicking
            if (elem.element_attr.get(0).classList.length === 4 && elem.element_attr.get(0).classList[1] === "close-btn") {
                $(elem.element_attr.get(0)).click(function () {
                    panel.close();
                });
            }
            //if the control button is a toggle button, then allow it to toggle visibility of panel body
            else if (elem.element_attr.get(0).classList.length === 4 && elem.element_attr.get(0).classList[1] === "toggle-btn") {
                $(elem.element_attr.get(0)).click(function () {

                    //initialize attributes
                    const minusSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,13H5V11H19V13Z"/></svg>')[0];
                    const plusSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>')[0];

                    let btn = new Btn();
                    btn.element_attr.addClass('btn');
                    btn.element_attr.addClass('toggle-btn');
                    elem.element_attr.get(0).removeChild(<HTMLElement>elem.element_attr.get(0).firstChild);
                    let controls = $(panel.panel_controls).height();
                    let parentHeight = panel.map_height;

                    // if user wants to expand panel
                    if (body.classList.contains('hidden')) {
                        body.classList.remove('hidden');
                        btn.icon = <SVGElement>minusSVG;
                        panel.hidden = false;
                        elem.element_attr.get(0).appendChild(minusSVG);
                        if (panel.contents_height !== undefined && parentHeight !== undefined) {
                            panel.panel_contents.style.height = (panel.contents_height + parentHeight * 0.10).toString() + 'px';
                        }
                    }
                    //if user wants to shrink panel
                    else {
                        body.classList.add('hidden');
                        let btn = new Btn();
                        btn.icon = <SVGElement>plusSVG;
                        panel.hidden = true;
                        elem.element_attr.get(0).appendChild(plusSVG);
                        if (controls !== undefined) {
                            panel.panel_contents.style.height = controls.toString() + 'px';
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

        if (this.map_object !== undefined) {

            //check to see panel position is set
            if (panelCoords.every(coord => coord !== undefined)) {

                //check to see if panel position is out of bounds of grid
                if (this.panelPositions.checkOutOfBounds(false, panelCoords[0], panelCoords[1], panelCoords[2], panelCoords[3]) === false) {

                    //If there is no conflict with an existing panel, allow the panel to open
                    if (!this.conflictDetected()) {

                        //fires opening observable
                        this.opening_attr.next()

                        //changes position on map and updates panel registry
                        this.changePosition();
                        this.panel_contents.classList.remove('hidden'); //hide panel before a call to open is made

                        if (this.hidden) {
                            this.panel_contents.style.height = (<number>$(this.panel_controls).height()).toString() + 'px';
                        }

                        this.open_attr = true;
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
        for (let panel of this.map_object.panelRegistry) {
            if (panel.open_attr === true && panel !== this) {
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
        if (this.map_object !== undefined && panelCoords.every(coord => coord !== undefined) && this.open_attr === true) {
            this.closing_attr.next();
            this.panel_contents.classList.add('hidden');
            this.open_attr = false;
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
        return this.content_attr;
    }


    /**
    * Sets the contents for the Panel
    * @param {PanelElem} content - the PanelElem to be used as panel's contents (scopes other PanelElems)
    */
    set content(content: PanelElem) {

        this.panel_body.classList.remove('hidden');

        this.content_attr = content;

        //First empty existing content
        this.panel_body.innerHTML = '';

        //then fill in new contents
        $(this.panel_body).append(content.element);
    }

    /**
    * Gets the id for the Panel
    * @return {string} - the panel id
    */
    get id(): string {
        return this.id_attr;
    }


    /**
    * Returns panel shell element
    * @return {JQuery<HTMLElement>} - shell element that holds controls and content of panel
    */
    get element(): JQuery<HTMLElement> {
        return $(this.panel_contents);
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

        let parentHeight = $(this.map_object.innerShell).height();

        if (topLeft !== undefined && bottomRight !== undefined) {
            if (topLeft < 0 || topLeft > 399 || bottomRight < 0 || bottomRight > 399) {
                throw "Exception: positions cannot be less than 0 or greater than 399.";
            }

            if (this.panelPositions.setPanelPosition(topLeft, bottomRight)) {

                let panelCoords = this.panelPositions.panelCoords;

                //change min positions to new default -> user changes away from default if they want
                this.setMinPosition(topLeft, bottomRight);

                this.position_changed.next([topLeft, bottomRight]);

                //refresh width and height properties
                this.width_attr = undefined;
                this.height_attr = undefined;
                this.panel_contents.style.maxHeight = "none";
                this.panel_contents.style.maxWidth = "none";

                //if panel already open, available spaces should be updated.
                if (this.map_object !== undefined && this.open_attr === true) {
                    this.close();
                    this.open();
                }
                if (parentHeight !== undefined) {
                    this.contents_height = ((panelCoords[3] - panelCoords[1] - 1) * 0.05 * parentHeight);
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
        if (this.open_attr) {
            if (typeof this.panelPositions.setWidth(width) === 'string') {
                this.panel_contents.style.maxWidth = this.panelPositions.setWidth(width);
                this.panel_contents.style.width = this.panelPositions.setWidth(width);
                this.panel_contents.style.minHeight = this.panelPositions.setHeight(width);
                this.width_attr = width;
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
        if (this.open_attr) {

            if (typeof this.panelPositions.setHeight(height) === 'string') {
                this.panel_contents.style.height = this.panelPositions.setHeight(height);
                this.panel_contents.style.maxHeight = this.panelPositions.setHeight(height);
                this.panel_contents.style.minHeight = this.panelPositions.setHeight(height);
                this.height_attr = height;
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

        let panelCoords = this.panelPositions.panelCoords;

        if (topLeft < 0 || topLeft > 399 || bottomRight < 0 || bottomRight > 399) {
            throw "Exception: positions cannot be less than 0 or greater than 399.";
        }

        if (!panelCoords.every(coord => coord !== undefined)) {
            throw "Exception: cannot set min position before a valid position is set.";
        }

        if (this.panelPositions.setMinPanelPosition(topLeft, bottomRight)) {
            //if panel already open, available spaces should be updated. (everything outside min is coverable)
            if (this.map_object !== undefined && this.open_attr === true) {
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
        let parentWidth = <number>$(this.map_object.innerShell).width();
        this.panel_contents.style.left = (0.05 * parentWidth * panelCoords[0]).toString() + "px";

        //set top position (5% * parentHeight * topLeftY)
        //need to forcecast because height and width return undefined
        let parentHeight = <number>$(this.map_object.innerShell).height();
        this.panel_contents.style.top = (0.05 * parentHeight * panelCoords[1]).toString() + "px";

        //calculate width and height of panel according to bottom right.
        this.panel_contents.style.width = ((panelCoords[2] - panelCoords[0] + 1) * 0.05 * parentWidth).toString() + "px";
        this.panel_contents.style.height = ((panelCoords[3] - panelCoords[1] + 1) * 0.05 * parentHeight).toString() + "px";

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
class PanelElem {

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

        const minusSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,13H5V11H19V13Z"/></svg>')[0];
        const plusSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>')[0];
        const closeSVG = $.parseHTML('<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="#ffffff" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>')[0];


        //if the element is a string either control divider, close button or title
        if (typeof element === "string") {
            //divider shortcut
            if (element === "|") {
                this.element_attr = $('<div class="divider"></div>')
            }
            //close button shortcut
            else if (element === "x") {
                var btn = new Btn();
                btn.icon = <SVGElement>closeSVG;
                this.element_attr = btn.element;
                this.element_attr.addClass('btn');
                this.element_attr.addClass('close-btn');

            }
            //toggle button shortcut
            else if (element === 'T') {
                var btn = new Btn();
                btn.icon = <SVGElement>minusSVG;
                this.element_attr = btn.element;
                this.element_attr.addClass('btn');
                this.element_attr.addClass('toggle-btn');
            }
            //title shortcut
            else {
                this.element_attr = $('<h1 style="font-weight: normal">' + element + '</h1>');
            }
        }
        else {
            this.element_attr = $(element);

            //Throw exception if there's multiple top level elements
            let children = this.element_attr.html();
            let checkElem = this.element_attr.empty();
            if (checkElem.length > 1) {
                throw "Exception: cannot have multiple top level elements.";
            }
            this.element_attr = this.element_attr.append(children);
        }


        //If element already has id attribute, set id to that id, otherwise set to randomly generated id
        if (this.element_attr !== undefined && this.element_attr.attr('id') !== undefined) {
            this.id_attr = this.element_attr.attr('id');
        }
        else {
            this.id_attr = "PanelElem" + Math.round(Math.random() * 10000).toString(); //random id autogenerated
            this.element_attr.attr('id', this.id_attr);
        }

        //Adds elem style from stylesheet
        this.element_attr.addClass("elem");

    }

    /**
    * Gets the id of PanelElem object.
    * @return {string} - the id of this PanelElem.
    */
    get id(): string {
        return this.id_attr;
    }

    /**
    * Gets element of PanelElem object.
    * @return {JQuery<HTMLElement>} - this element that the PanelElem scopes.
    */
    get element(): JQuery<HTMLElement> {
        return this.element_attr;
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

    element_attr = <JQuery<HTMLElement>>$('<button class="btn"></button>');


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
        this.element_attr.append(svg);
    }

    /**
    * Sets text for the Btn
    * @param {string} txt - the text to be set for the Btn
    */
    set text(txt: string) {
        this.element_attr.html(txt);
        this.element_attr.addClass('text-btn');
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
        this.panel_attr = panel;
    }

    /**
    * Constructs PanelElem object
    * @return {number[]} - topLeft and bottomRight Panel coordinates
    */
    get panelCoords(): number[] {
        return [this.topLeftX_val, this.topLeftY_val, this.bottomRightX_val, this.bottomRightY_val];
    }

    get minPanelCoords(): number[] {
        return [this.minTopLeftX_val, this.minTopLeftY_val, this.minBottomRightY_val, this.minBottomRightY_val]
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
            this.topLeftX_val = topLeftX;
            this.topLeftY_val = topLeftY;
            this.bottomRightX_val = bottomRightX;
            this.bottomRightY_val = bottomRightY;
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
            this.minTopLeftX_val = topLeftX;
            this.minTopLeftY_val = topLeftY;
            this.minBottomRightX_val = bottomRightX;
            this.minBottomRightY_val = bottomRightY;
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
            let minErrorConds = bottomRightX > this.bottomRightX_val || bottomRightY > this.bottomRightY_val || topLeftX < this.topLeftX_val || topLeftY < this.topLeftY_val;
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
        if (!(this.bottomRightX_val < topLeftX || this.bottomRightY_val < topLeftY || this.topLeftX_val > bottomRightX || this.topLeftY_val > bottomRightY)) {

            //if our panel's min doesn't completely avoid enemy panel's min, then our panel can't open
            if (!(this.minBottomRightX_val < minTopLeftX || this.minBottomRightY_val < minTopLeftY || this.minTopLeftX_val > minBottomRightX || this.minTopLeftY_val > minBottomRightY)) {
                throw "Exception: conflicting panels, panels cannot shrink any further to accomodate, panel closing.";
            }
            else {

                let newLeft = this.topLeftX_val;
                let newTop = this.topLeftY_val;
                let newBottom = this.bottomRightY_val;
                let newRight = this.bottomRightX_val;
                let oldMinLeft = this.minTopLeftX_val;
                let oldMinTop = this.minTopLeftY_val;
                let oldMinRight = this.minBottomRightX_val;
                let oldMinBottom = this.minBottomRightY_val;


                //if our min position avoided enemy panel by being on left, decrease right position of this panel to get closer to min
                if (this.minBottomRightX_val < topLeftX && this.bottomRightX_val > this.minBottomRightX_val) {
                    newRight = topLeftX - 1;
                    console.log("Shrinking right!");
                }
                //if enemy min position avoided our panel by being on left, decrease right position of enemy panel to get closer to min
                else if (minBottomRightX < this.topLeftX_val && bottomRightX > minBottomRightX) {
                    bottomRightX = this.topLeftX_val - 1;
                    console.log("Shrinking right!");
                }

                //if min position avoided panel by being on top, decrease bottom position of this panel to get closer to min
                if (this.minBottomRightY_val < topLeftY && this.bottomRightY_val > this.minBottomRightY_val) {
                    newBottom = topLeftY - 1;
                    console.log("Shrinking bottom!");
                }
                //if enemy min position avoided our panel by being on top, decrease bottom position of enemy panel to get closer to min
                else if (minBottomRightY < this.topLeftY_val && bottomRightY > minBottomRightY) {
                    bottomRightY = this.topLeftY_val - 1;
                    console.log("Shrinking bottom!");
                }

                //if min position avoided panel by being on right, increase left position of this panel to get closer to min
                if (this.minTopLeftX_val > bottomRightX && this.topLeftX_val < this.minTopLeftX_val) {
                    newLeft = bottomRightX + 1;
                    console.log("Shrinking left!");
                }
                //if enemy min position avoided our panel by being on right, increase left position of enemy panel to get closer to min
                else if (minTopLeftX > this.bottomRightX_val && topLeftX < minTopLeftX) {
                    topLeftX = this.bottomRightX_val + 1;
                    console.log("Shrinking left!");
                }

                //if min position avoided panel by being on bottom, increase top position of this panel to get closer to min
                if (this.minTopLeftY_val > bottomRightY && this.topLeftY_val < this.minTopLeftY_val) {
                    newTop = bottomRightY + 1;
                    console.log("Shrinking top!");
                }
                //if enemy min position avoided our panel by being on bottom, increase top position of enemy panel to get closer to min
                else if (minTopLeftY > this.bottomRightY_val && topLeftY < minTopLeftY) {
                    topLeftY = this.bottomRightY_val + 1;
                    console.log("Shrinking top!");
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
            if (panel.panelPositions.bottomRightX_val !== panel.panelPositions.minBottomRightX_val || panel.panelPositions.bottomRightY_val !== panel.panelPositions.minBottomRightY_val || panel.panelPositions.topLeftX_val !== panel.panelPositions.minTopLeftX_val || panel.panelPositions.topLeftY_val !== panel.panelPositions.minTopLeftY_val) {

                //how far removed the min topLeft from topLeft?
                minTopX = panel.panelPositions.minTopLeftX_val - panel.panelPositions.topLeftX_val;
                minTopY = panel.panelPositions.minTopLeftY_val - panel.panelPositions.topLeftY_val;

                //how far removed is minBottomRight topLeft?
                minBottomX = panel.panelPositions.minBottomRightX_val - panel.panelPositions.topLeftX_val;
                minBottomY = panel.panelPositions.minBottomRightY_val - panel.panelPositions.topLeftY_val;
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
            if (panelObj.open_attr === true && panelObj !== panel) {

                //panel position will be invalid if the topLeft coordinate of the panel when treated as the bottomRight corner overlaps
                let topLeftX = panelObj.panelPositions.topLeftX_val - width + 1;
                let originalTopLeftX = panelObj.panelPositions.topLeftX_val;
                let topLeftY = panelObj.panelPositions.topLeftY_val - height + 1;
                let originalTopLeftY = panelObj.panelPositions.topLeftY_val;
                let bottomRightX = panelObj.panelPositions.bottomRightX_val;
                let bottomRightY = panelObj.panelPositions.bottomRightY_val;

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

        let parentWidth = <number>$(this.panel_attr.map.innerShell).width();

        if (typeof width === 'number') {

            let topLeftPx = this.topLeftX_val * 0.05 * parentWidth
            let bottomRightPx = this.bottomRightX_val * 0.05 * parentWidth;

            //as long as supplied width is within panel width -> else ignored
            if (topLeftPx + width <= bottomRightPx) {
                return width.toString() + "px";
            }
        }
        else {
            let numWidth = parseInt(width.slice(0, -1)) * 0.01; //convert the percent into a decimal
            //as long as supplied width is within panel width in percents
            if (numWidth >= 0 && numWidth <= 1) {

                let panelWidth = (this.bottomRightX_val - this.topLeftX_val + 1) * 0.05 * parentWidth;
                let newWidth = panelWidth * numWidth;   //converts percent width to pixel width
                let topLeftPx = this.topLeftX_val * 0.05 * parentWidth
                let bottomRightPx = this.bottomRightX_val * 0.05 * parentWidth;

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

        let parentHeight = <number>$(this.panel_attr.map.innerShell).height();

        if (typeof height === 'number') {

            let topLeftPx = this.topLeftY_val * 0.05 * parentHeight;
            let bottomRightPx = this.bottomRightY_val * 0.05 * parentHeight;

            //as long as supplied width is within panel width -> else ignored
            if (topLeftPx + height <= bottomRightPx) {
                return height.toString() + "px";
            }
        }
        else {
            let numHeight = parseInt(height.slice(0, -1)) * 0.01; //convert the percent into a decimal
            //as long as supplied width is within panel width in percents
            if (numHeight >= 0 && numHeight <= 1) {

                let panelHeight = (this.bottomRightY_val - this.topLeftY_val + 1) * 0.05 * parentHeight;
                let newHeight = panelHeight * numHeight;   //converts percent width to pixel width
                let topLeftPx = this.topLeftY_val * 0.05 * parentHeight;
                let bottomRightPx = this.bottomRightY_val * 0.05 * parentHeight;

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

    id_attr: string;

    //Panel items
    content_attr: PanelElem;
    controls_attr: (PanelElem)[];

    //HTML parent Components
    panel_contents: HTMLElement;
    panel_controls: HTMLElement;
    panel_body: HTMLElement;
    document_fragment: DocumentFragment;
    separator: HTMLElement;

    map_width: number | undefined;
    map_height: number | undefined;

    map_object: Map;

    width_attr: number | string | undefined;
    height_attr: number | string | undefined;

    contents_height: number;
    hidden: boolean;

    //subjects initialized for observables that are fired through method calls
    opening_attr: Subject<any>;
    closing_attr: Subject<any>;
    position_changed: Subject<any>;
    width_changed: Subject<any>;
    height_changed: Subject<any>;

    panel_positions: PanelPositions;

    open_attr: boolean; //whether panel is open or closed

    //user accessible observables
    opening: Observable<any>;
    closing: Observable<any>;
    positionChanged: Observable<[number, number]>; //top left, bottom right
    widthChanged: Observable<number>
    heightChanged: Observable<number>
}

interface PanelElem {
    id_attr: string;
    document_fragment: DocumentFragment;
    element_attr: JQuery<HTMLElement>;
}

interface PanelPositions {
    topLeftX_val: number;
    topLeftY_val: number;
    bottomRightX_val: number;
    bottomRightY_val: number;

    minTopLeftX_val: number;
    minTopLeftY_val: number;
    minBottomRightX_val: number;
    minBottomRightY_val: number;

    panel_attr: Panel;
}
