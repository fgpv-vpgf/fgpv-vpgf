import { Subject } from 'rxjs';

/**
 * Represents a geographical point in decimal degrees.
 */
export class XY {
    /** Longitude in decimal degrees, bounded by ±360° */
    x: number;
    /** Latitude in decimal degrees, bounded by ±90° */
    y: number;

    constructor(x: number, y: number, wkid?: number) {
        if (wkid) {
            const normalizePoints = this.projectFromPoint(wkid, x, y);
            x = normalizePoints.x;
            y = normalizePoints.y;
        }

        x = x <= 180 && x >= -180 ? x : (360 % Math.abs(x)) * (x < 0 ? 1 : -1);

        if (typeof x !== 'number' || x > 180 || x < -180) {
            throw new Error(`Longitude (x) provided is bounded to ±180°, ${x} given.`);
        } else if (typeof y !== 'number' || y > 90 || y < -90) {
            throw new Error(`Latitude (y) provided is bounded to ±90°, ${y} given.`);
        }

        this.x = x;
        this.y = y;
    }

    /** Returns a projection Point */
    projectToPoint(targetProjection: number) {
        const proj = (<any>window).RAMP.GAPI.proj;

        let zoomPoint = proj.localProjectPoint(4326, targetProjection, [this.x, this.y]);
        return new proj.Point(zoomPoint[0], zoomPoint[1], new proj.SpatialReference(targetProjection));
    }

    /** Returns a projection Point */
    projectFromPoint(sourceProjection: number, x?: number, y?: number) {
        const proj = (<any>window).RAMP.GAPI.proj;

        let point = proj.localProjectPoint(sourceProjection, 4326, [this.x || x, this.y || y]);
        return new proj.Point(point[0], point[1], new proj.SpatialReference(sourceProjection));
    }

    /**
     * Returns true if both this and the provided `XY` instance have identical x` and `y` values.
     *
     * @param otherXY - Another `XY` instance for comparison
     */
    equals(otherXY: XY): boolean {
        return this.x === otherXY.x && this.y === otherXY.y;
    }

    /**
     * Returns a string of the form `y,x` for the current values of x and y.
     *
     * @param precision - The amount of decimal places for rounding
     */
    urlValue(precision: number = 6): string {
        return `${this.y.toFixed(precision)},${this.x.toFixed(precision)}`;
    }

    /**
     * Returns a string of the form `y,x` for the current values of x and y, rounded to 6 decimal places.
     */
    toString(): string {
        return this.urlValue();
    }

    /**
     * Returns a 2-element array with values x and y (i.e. [x, y])
     */
    toArray(): Array<number> {
        return [this.x, this.y];
    }
}

/** Represents a rectangular geographical area with a north-east and south-west boundary definition (x, y) in decimal degrees.
 *
 * ```text
 * +--------NE
 * |         |
 * |         |
 * |         |
 * SW--------+
 * ```
 *
 * @example #### Check if two `XYBounds` intersect
 *
 * ```js
 * const ne = new RAMP.GEO.XY(150, 65);
 * const sw = new RAMP.GEO.XY(100, 30);
 *
 * const b1 = new RAMP.GEO.XYBounds(ne, sw);
 * const b2 = new RAMP.GEO.XYBounds([170, 35], [90, -60]); // an [x, y] tuple works too
 *
 * console.log(b1.intersects(b2)); // true
 * ```
 *
 */
export class XYBounds {
    center: XY;
    northEast: XY;
    southWest: XY;

    constructor(northEast: XY | XYLiteral | Extent, southWest?: XY | XYLiteral | undefined) {
        if (isExtent(northEast)) {
            const xy = (<any>window).RAMP.GAPI.proj.localProjectExtent(northEast, 4326);
            this.northEast = new XY(xy.x1, xy.y1);
            this.southWest = new XY(xy.x0, xy.y0);
        } else {
            if (isXYLiteral(southWest)) {
                this.southWest = new XY(southWest[0], southWest[1]);
            } else if (typeof southWest === 'undefined') {
                throw new Error('southWest parameter is required if northEast is not an extent');
            } else {
                this.southWest = southWest;
            }

            if (isXYLiteral(northEast)) {
                this.northEast = new XY(northEast[0], northEast[1]);
            } else {
                this.northEast = northEast;
            }
        }

        const centerPoint = this.extent.getCenter();
        this.center = new XY(centerPoint.x, centerPoint.y);
    }

    get extent(): Extent {
        const extentObj = {
            xmin: this.southWest.x,
            xmax: this.northEast.x,
            ymax: this.southWest.y,
            ymin: this.northEast.y,
            spatialReference: { wkid: 4326 }
        };
        return (<any>window).RAMP.GAPI.Map.getExtentFromJson(extentObj);
    }

    /** Returns true if the given XY point is contained within this boundary. */
    contains(xy: XY): boolean {
        return (
            xy.x >= this.southWest.x && xy.x <= this.northEast.x && xy.y >= this.southWest.y && xy.y <= this.northEast.y
        );
    }

    /** Returns true if this boundary is equal geographically to the other XYBounds provided. */
    equals(otherXYBounds: XYBounds): boolean {
        return (
            this.northEast.x === otherXYBounds.northEast.x &&
            this.northEast.y === otherXYBounds.northEast.y &&
            this.southWest.x === otherXYBounds.southWest.x &&
            this.southWest.y === otherXYBounds.southWest.y
        );
    }

    /** Returns true if this boundary intersects with the other XYBounds provided. */
    intersects(otherXYBounds: XYBounds): boolean {
        return !(
            this.southWest.x > otherXYBounds.northEast.x ||
            this.northEast.x < otherXYBounds.southWest.x ||
            this.southWest.y > otherXYBounds.northEast.y ||
            this.northEast.y < otherXYBounds.southWest.y
        );
    }

    /**
     * Returns the bounds in the form "x_lo,y_lo,x_hi,y_hi".
     */
    toString(): string {
        return `${this.southWest.x},${this.southWest.y},${this.northEast.x},${this.northEast.y}`;
    }
}

/**
 * A hovertip to be displayed when a SimpleLayer geometry is moused onto.
 *
 * @example Create hovertips using different settings and add to points
 *
 * ```js
 * var hoverA = new RAMP.GEO.Hover(0, 'my annotation', { position: 'right' });
 * pointA.hover = hoverA;
 *
 * var hoverB = new RAMP.GEO.Hover(1, '<a href="https://www.w3schools.com/html/">Visit our HTML tutorial</a>', { keepOpen: true, position: 'left' });
 * pointB.hover = hoverB;
 * ```
 */
export class Hover {
    /** @ignore */
    _id: string;
    /** @ignore */
    _text: string;
    /** @ignore */
    _keepOpen: boolean = false;
    /** @ignore */
    _position: string = 'top';
    /** @ignore */
    _xOffset: number = 0;
    /** @ignore */
    _yOffset: number = 0;
    /** @ignore */
    _followCursor: boolean = false;

    /**
     * Set the id and hovertip text. Also set any of the optional hovertip options if provided.
     *
     * The different options and values available are the following:
     * <ul>
     *     <li>keepOpen:        true or false. default is false.
     *     <li>position:        'top', 'bottom', 'left' or 'right'. default is 'top'. (if followCursor is true, position value will be ignored.)
     *     <li>xOffset:         any number. default is 0.
     *     <li>yOffset:         any number. default is 0.
     *     <li>followCursor:    true or false. default is false. (if keepOpen is true, followCursor value will be ignored.)
     * </ul>
     *
     * TODO: add option for position 'center' specifically used for polygons.
     */
    constructor(id: string | number, text: string, opts?: HovertipOptions) {
        this._id = id.toString();
        this._text = text;
        if (opts) {
            if (opts.keepOpen !== undefined) {
                this._keepOpen = opts.keepOpen;
            }
            if (opts.position !== undefined) {
                this._position = opts.position;
            }
            if (opts.xOffset !== undefined) {
                this._xOffset = opts.xOffset;
            }
            if (opts.yOffset !== undefined) {
                this._yOffset = opts.yOffset;
            }
            if (opts.followCursor !== undefined) {
                this._followCursor = opts.followCursor;
            }
        }
    }

    /** Returns the hovertip id. */
    get id(): string {
        return this._id;
    }

    /** Returns the contents of the hovertip. */
    get text(): string {
        return this._text;
    }

    /** Returns true if the hovertip is meant to remain open. */
    get keepOpen(): boolean {
        return this._keepOpen;
    }

    /** Returns the default position of the hovertip. */
    get position(): string {
        return this._position;
    }

    /** Returns the pixel offset on x of the hovertip. */
    get xOffset(): number {
        return this._xOffset;
    }

    /** Returns the pixel offset on y of the hovertip. */
    get yOffset(): number {
        return this._yOffset;
    }

    /** Returns true if the hovertip is meant to follow the cursor movement. */
    get followCursor(): boolean {
        return this._followCursor;
    }

    /** Returns the string 'Hover'. */
    get type(): string {
        return 'Hover';
    }
}

/**
 * All geometry types must derive from this class. Not intented to be instantiated on its own.
 */
export class BaseGeometry {
    /** @ignore */
    _id: string;
    /** @ignore */
    _hover: Hover | null = null;
    /** @ignore */
    _hoverRemoved: Subject<string> = new Subject();

    /** Sets the geometry id. */
    constructor(id: string) {
        this._id = id;
    }

    /**
     * Returns the type of the geometry object.
     * Possibilities are 'Point', 'MultiPoint', 'LineString', 'Polygon', 'MultiLineString', 'MultiPolygon'.
     * Function implementation in subclasses.
     */
    get type(): string {
        return '';
    }

    /** Returns the geometry id. */
    get id(): string {
        return this._id;
    }

    /** Returns the hovertip for the geometry, if any. */
    get hover(): Hover | null {
        return this._hover;
    }

    /** Adds a hovertip to the geometry. If one already exists, replace it. */
    set hover(hover: Hover | null) {
        if (hover && this._hover && this._hover.id !== hover.id) {
            this._hoverRemoved.next(this._id);
        }

        this._hover = hover;
    }

    /** Removes the hovertip from the geometry if it exists. TODO: modify if necessary for multigeometries. */
    removeHover() {
        if (this._hover) {
            this._hoverRemoved.next(this._id);
            this._hover = null;
        }
    }
}

/**
 * A Point geometry containing a single XY.
 *
 * @example Create points using different icons and add to map
 *
 * ```js
 * // image / data URL as icon
 * var pointA = new RAMP.GEO.Point(0, [-79, 43], {icon: 'https://image.flaticon.com/icons/svg/17/17799.svg'});
 *
 * // svg path as icon
 * var pointB = new RAMP.GEO.Point(1, [79, 32], {icon: 'M24.0,2.199C11.9595,2.199,2.199,11.9595,2.199,24.0c0.0,12.0405,9.7605,21.801,21.801'});
 *
 * // default icon
 * var pointC = new RAMP.GEO.Point(2, [79, 43]);
 *
 * RAMP.mapById('<mapID>').simpleLayer.addGeometry([pointA, pointB, pointC]);
 * ```
 */
export class Point extends BaseGeometry {
    /** @ignore */
    _xy: XY;
    /** @ignore */
    _styleOptions: PointStyleOptions;

    /** Constructs a Point from the given XY or XYLiteral.
     *
     * The different style options and values available are the following:
     * <ul>
     *     <li>width:          number in pixels. default is `16.5`.
     *     <li>height:         number in pixels. default is `16.5`.
     *     <li>xOffset:        number in pixels. default is `0`.
     *     <li>yOffset:        number in pixels. default is `0`.
     *     <li>colour:         colour as string or array of numbers. default is `[0, 0, 0]`.
     *     <li>icon:           string path of point icon. default is `''`.
     *     <li>style:          string style of point. default is `CIRCLE`.<br/>
     *     &emsp;&emsp;&nbsp;  one of: `CIRCLE, CROSS, DIAMOND, SQUARE, X, TRIANGLE, ICON`
     * </ul>
     */
    constructor(id: string | number, xy: XY | XYLiteral, opts = {}) {
        super(id.toString());

        if (isXYLiteral(xy)) {
            this._xy = new XY(xy[0], xy[1]);
        } else {
            this._xy = xy;
        }

        this._styleOptions = new PointStyleOptions(opts);
    }

    /** Returns the contained XY. */
    get xy(): XY {
        return this._xy;
    }

    /** Returns the style options for the point */
    get styleOptions(): PointStyleOptions {
        return this._styleOptions;
    }
    /** Returns the string 'Point'. */
    get type(): string {
        return 'Point';
    }

    /**
     * Returns a 2-element array with values x and y (i.e. [x, y])
     */
    toArray(): Array<number> {
        return this.xy.toArray();
    }
}

/**
 * A MultiPoint geometry containing a number of Points.
 *
 * @example Create a multipoint using default icon and add to map
 *
 * ```js
 * // same icon options as Point
 *
 * var pointA = new RAMP.GEO.Point(0, [-79, 43], {icon: 'https://image.flaticon.com/icons/svg/17/17799.svg'});
 * var pointB = new RAMP.GEO.Point(1, [79, 32]);
 *
 * // any existing point icons are ignored and the same icon (taken from multipoint) is used for all points
 * var multipointA = new RAMP.GEO.MultiPoint(10, [pointA, pointB, [79, 43], [-79, 32]]);
 *
 * RAMP.mapById('<mapID>').simpleLayer.addGeometry(multipointA);
 * ```
 */
export class MultiPoint extends BaseGeometry {
    /** @ignore */
    _pointArray: Array<Point> = [];
    /** @ignore */
    _styleOptions: StyleOptions;

    /** Constructs a MultiPoint from the given Points, XYs or XYLiterals.
     *
     * The different style options and values available are the following:
     * <ul>
     *     <li>width:          number in pixels. default is `16.5`.
     *     <li>height:         number in pixels. default is `16.5`.
     *     <li>xOffset:        number in pixels. default is `0`.
     *     <li>yOffset:        number in pixels. default is `0`.
     *     <li>colour:         colour as string or array of numbers. default is `[0, 0, 0]`.
     *     <li>icon:           string path of point icon. default is `''`.
     *     <li>style:          string style of point. default is `CIRCLE`.<br/>
     *     &emsp;&emsp;&nbsp;  one of: `CIRCLE, CROSS, DIAMOND, SQUARE, X, TRIANGLE, ICON`
     * </ul>
     *
     * Style applies to all points and overrides any styling they may have
     */
    constructor(id: string | number, elements: Array<Point | XY | XYLiteral>, opts = {}) {
        super(id.toString());

        this._styleOptions = new PointStyleOptions(opts);

        elements.forEach((elem, index) => {
            const subId = index < 10 ? '0' + index : index;
            const newId = id + '-' + subId;

            if (isPointInstance(elem)) {
                this._pointArray.push(new Point(newId, elem.xy, opts));
            } else {
                this._pointArray.push(new Point(newId, elem, opts));
            }
        });
    }

    /** Returns an array of the contained points. A new array is returned each time this is called. */
    get pointArray(): Array<Point> {
        return [...this._pointArray];
    }

    /** Returns the n-th contained point. */
    getAt(n: number): Point {
        return this._pointArray[n];
    }

    /** Returns the number of contained points. */
    get length(): number {
        return this._pointArray.length;
    }

    /** Returns the style options for the points */
    get styleOptions(): StyleOptions {
        return this._styleOptions;
    }

    /** Returns the string 'MultiPoint'. */
    get type(): string {
        return 'MultiPoint';
    }

    /**
     * Returns an array of point arrays (e.g. [[x1, y1], [x2, y2]] )
     */
    toArray(): Array<Array<number>> {
        // using private underscore property to avoid copying the array
        return this._pointArray.map(p => p.toArray());
    }
}

/**
 * A LineString geometry containing a number of Points.
 *
 * @example Create a linestring and add to map
 *
 * ```js
 * var pointA = new RAMP.GEO.Point(0, [-79, 43], {icon: 'https://image.flaticon.com/icons/svg/17/17799.svg'});
 * var pointB = new RAMP.GEO.Point(1, [79, 32]);
 * var lineA = new RAMP.GEO.LineString(100, [pointA, pointB]);
 *
 * RAMP.mapById('<mapID>').simpleLayer.addGeometry(lineA);
 * ```
 */
export class LineString extends MultiPoint {
    /** Constructs a LineString from the given Points, XYs or XYLiterals.
     *
     * The different style options and values available are the following:
     * <ul>
     *     <li>width:          number in pixels. default is `2`.
     *     <li>colour:         colour as string or array of numbers. default is `[0, 0, 0]`.
     *     <li>style:          string style of line. default is `SOLID`.<br/>
     *     &emsp;&emsp;&nbsp;  one of: `DASH, DASHDOT, DASHDOTDOT, DOT, NULL, SOLID`
     * </ul>
     */
    constructor(id: string | number, elements: Array<Point | XY | XYLiteral>, opts = {}) {
        super(id, elements, opts);

        this._styleOptions = new LineStyleOptions(opts);
    }

    /** Returns the string 'LineString'. */
    get type(): string {
        return 'LineString';
    }
}

/**
 * A MultiLineString geometry containing a number of LineStrings.
 *
 * @example Create a multilinestring and add to map
 *
 * ```js
 * var pointA = new RAMP.GEO.Point(0, [-79, 43], {icon: 'https://image.flaticon.com/icons/svg/17/17799.svg'});
 * var pointB = new RAMP.GEO.Point(1, [79, 32]);
 * var lineA = new RAMP.GEO.LineString(100, [pointA, pointB]);
 * var multilineA = new RAMP.GEO.MultiLineString(1000, [lineA, [[-70, 45], [-70, 57], [-55, 57], [-55, 45]], [[-10, 45], [-10, 57], [-20, 57], [-20, 45]]]);
 *
 * RAMP.mapById('<mapID>').simpleLayer.addGeometry(multilineA);
 * ```
 */
export class MultiLineString extends BaseGeometry {
    /** @ignore */
    _lineArray: Array<LineString> = [];
    /** @ignore */
    _styleOptions: LineStyleOptions;

    /** Constructs a MultiLineString from the given LineStrings or arrays of positions.
     *
     * The different style options and values available are the following:
     * <ul>
     *     <li>width:          number in pixels. default is `2`.
     *     <li>colour:         colour as string or array of numbers. default is `[0, 0, 0]`.
     *     <li>style:          string style of line. default is `SOLID`.<br/>
     *     &emsp;&emsp;&nbsp;  one of: `DASH, DASHDOT, DASHDOTDOT, DOT, NULL, SOLID`
     * </ul>
     *
     * Style applies to all lines and overrides any styling they may have
     */
    constructor(id: string | number, elements: Array<LineString | Array<Point | XY | XYLiteral>>, opts = {}) {
        super(id.toString());

        this._styleOptions = new LineStyleOptions(opts);

        elements.forEach((elem, index) => {
            const subId = index < 10 ? '0' + index : index;
            const newId = id + '-' + subId;

            if (isLineInstance(elem)) {
                this._lineArray.push(new LineString(newId, elem.pointArray, opts));
            } else {
                this._lineArray.push(new LineString(newId, elem, opts));
            }
        });
    }

    /** Returns an array of the contained lines. A new array is returned each time this is called. */
    get lineArray(): Array<LineString> {
        return [...this._lineArray];
    }

    /** Returns the n-th contained line. */
    getAt(n: number): LineString {
        return this._lineArray[n];
    }

    /** Returns the number of contained lines. */
    get length(): number {
        return this._lineArray.length;
    }

    /** Returns the style options for the points */
    get styleOptions(): LineStyleOptions {
        return this._styleOptions;
    }

    /** Returns the string 'MultiLineString'. */
    get type(): string {
        return 'MultiLineString';
    }

    /**
     * Returns an array of line arrays (e.g. [[[x1, y1], [x2, y2]], [[x3, y3], [x4, y4]]] )
     */
    toArray(): Array<Array<Array<number>>> {
        // using private underscore property to avoid copying the array
        return this._lineArray.map(l => l.toArray());
    }
}

/**
 * A Polygon geometry containing a number of LinearRings.
 *
 * @example Create polygons using different styles and add to map
 *
 * ```js
 * var pointA = new RAMP.GEO.Point(0, [-79, 43]);
 * var pointB = new RAMP.GEO.Point(1, [-49, 70]);
 *
 * // default settings - only the outline ring, no fill for polygon
 * var polygonA = new RAMP.GEO.Polygon(10000, [[pointA, [-79, 70], pointB, [-49, 43]], [[-70, 45], [-70, 57], [-55, 57], [-55, 45]]]);
 * // custom settings - just the fill for the polygon, no outline ring
 * var polygonB = new RAMP.GEO.Polygon(10001, [[-10, 45], [-10, 57], [-20, 57], [-20, 45]], { outlineWidth: 0, fillColor: '#000000', fillOpacity: 1 });
 *
 * RAMP.mapById('<mapID>').simpleLayer.addGeometry([polygonA, polygonB]);
 * ```
 */
export class Polygon extends BaseGeometry {
    /**
     * A LinearRing geometry containing a number of x,y decimal degrees, representing a closed LineString.
     * There is no need to make the first x,y equal to the last x,y. The LinearRing is closed implicitly.
     *
     * @example Create a linearring and add to polygon
     *
     * ```js
     * var linearRingA = new polygonB.LinearRing([[-10, 45], [-10, 57], [-20, 57], [-20, 45]]);
     * polygonA.addLinearRings([linearRingA]);  // add linear ring after creating the polygon
     * ```
     */
    get LinearRing() {
        let outerClass = this;
        return class LinearRing {
            /** @ignore */
            _id: string;
            /** @ignore */
            _pointArray: Array<Point> = [];

            /** Constructs a LinearRing from the given Points, XYs or XYLiterals. */
            constructor(elements: Array<Point | XY | XYLiteral>) {
                const ringCounter = outerClass._ringArray.length;
                const subId = ringCounter < 10 ? '0' + ringCounter : ringCounter;
                this._id = outerClass.id + '-' + subId;

                elements.forEach((elem, index) => {
                    const subId = index < 10 ? '0' + index : index;
                    const newId = this._id + '-' + subId;

                    if (isPointInstance(elem)) {
                        this._pointArray.push(new Point(newId, elem.xy));
                    } else {
                        this._pointArray.push(new Point(newId, elem));
                    }
                });

                // add the first point to the end of the array to 'close' the ring (if it wasn't already closed)
                const firstPoint = this._pointArray[0].xy;
                const lastPoint = this._pointArray[this._pointArray.length - 1].xy;
                if (firstPoint.x !== lastPoint.x || firstPoint.y !== lastPoint.y) {
                    this._pointArray.push(this._pointArray[0]);
                }
            }

            /** Returns the geometry id. */
            get id(): string {
                return this._id;
            }

            /** Returns an array of the contained points. A new array is returned each time this is called. */
            get pointArray(): Array<Point> {
                return [...this._pointArray];
            }

            /**
             * Returns an array of point arrays (e.g. [[x1, y1], [x2, y2]] )
             */
            toArray(): Array<Array<number>> {
                // using private underscore property to avoid copying the array
                return this._pointArray.map(p => p.toArray());
            }
        };
    }

    /** @ignore */
    _ringArray: Array<any> = []; // type should be 'LinearRing', but that is not available any more
    /** @ignore */
    _styleOptions: PolygonStyleOptions;

    /**
     * Constructs a Polygon from the given array of points or ring coordinates.
     *
     * The different style options and values available are the following:
     * <ul>
     *     <li>outlineColor:        colour as string or array of numbers. default is `[0, 0, 0]`.
     *     <li>outlineWidth:        number in pixels. default is 2.
     *     <li>outlineStyle:        string line style. default is `SOLID`.<br/>
     *                              &emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;
     *                              one of: `CIRCLE, CROSS, DIAMOND, SQUARE, X, TRIANGLE, ICON`
     *     <li>fillColor:           colour as string or array of numbers. default is `[0, 0, 0]`.
     *     <li>fillOpacity:         number between 0 and 1. default is 0.
     *     <li>fillStyle:           string hex code. default is `SOLID`.<br/>
     *                              &emsp;&emsp;&emsp;&nbsp;
     *                              one of: `BDIAG, CROSS, DIAG_CROSS, FDIAG, HORIZONTAL, NULL, SOLID, VERTICAL`
     * </ul>
     *
     * NOTE: if linear rings are added to a polygon after it has been added to the map, it will not redraw
     * TODO: add option for polygon icon fill.
     */
    constructor(
        id: string | number,
        elements: Array<Point | XY | XYLiteral | Array<Point | XY | XYLiteral>>,
        opts = {}
    ) {
        super(id.toString());

        this._styleOptions = new PolygonStyleOptions(opts);

        if (elements[0] !== undefined && elements[0] instanceof Array && !isXYLiteral(elements[0])) {
            // single ring added
            elements.forEach(element => {
                this._ringArray.push(new this.LinearRing(<Array<Point | XY | XYLiteral>>element));
            });
        } else if (elements[0] !== undefined) {
            // multiple rings added
            this._ringArray.push(new this.LinearRing(<Array<Point | XY | XYLiteral>>elements));
        }
    }

    addLinearRings(linearRings: Array<any>): void {
        // type should be 'LinearRing', but that is not available any more
        this._ringArray.push(...linearRings);
    }

    /** Returns an array of the contained rings. A new array is returned each time this is called. */
    get ringArray(): Array<any> {
        // type should be 'LinearRing', but that is not available any more
        return [...this._ringArray];
    }

    /** Returns style options object for the polygon */
    get styleOptions(): PolygonStyleOptions {
        return this._styleOptions;
    }

    /** Returns the string 'Polygon'. */
    get type(): string {
        return 'Polygon';
    }

    /**
     * Returns an array of ring arrays (e.g. [[[x1, y1], [x2, y2], [x3, y3], [x1, y1]], [<another ring>]] )
     */
    toArray(): Array<Array<Array<number>>> {
        // using private underscore property to avoid copying the array
        return this._ringArray.map(r => r.toArray());
    }
}

/**
 * A MultiPolygon geometry containing a number of Polygons.
 *
 * @example Create a multipolygon and add to map
 *
 * ```js
 * var pointA = new RAMP.GEO.Point(0, [-79, 43]);
 * var pointB = new RAMP.GEO.Point(1, [-49, 70]);
 *
 * // default settings - only the outline ring, no fill for polygon
 * var polygonA = new RAMP.GEO.Polygon(100, [[pointA, [-79, 70], pointB, [-49, 43]], [[-70, 45], [-70, 57], [-55, 57], [-55, 45]]]);
 * // custom settings - just the fill for the polygon, no outline ring
 * var polygonB = new RAMP.GEO.Polygon(101, [], { outlineWidth: 0, fillColor: '#000000', fillOpacity: 1 });
 *
 * var linearRingC = new polygonB.LinearRing([[-10, 45], [-10, 57], [-20, 57], [-20, 45]]);
 * polygonB.addLinearRings([linearRingC]);
 * var multiPolygonA = new RAMP.GEO.MultiPolygon(1000, [polygonA, polygonB]);
 *
 * RAMP.mapById('<mapID>').simpleLayer.addGeometry(multiPolygonA);
 * ```
 */
export class MultiPolygon extends BaseGeometry {
    /** @ignore */
    _polygonArray: Array<Polygon> = [];
    /** @ignore */
    _styleOptions: PolygonStyleOptions;

    /**
     * Constructs a MultiPolygon from the given array of Polygons.
     *
     * The different style options and values available are the following:
     * <ul>
     *     <li>outlineColor:        colour as string or array of numbers. default is `[0, 0, 0]`.
     *     <li>outlineWidth:        number in pixels. default is 2.
     *     <li>outlineStyle:        string line style. default is `SOLID`.<br/>
     *                              &emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;
     *                              one of: `CIRCLE, CROSS, DIAMOND, SQUARE, X, TRIANGLE, ICON`
     *     <li>fillColor:           colour as string or array of numbers. default is `[0, 0, 0]`.
     *     <li>fillOpacity:         number between 0 and 1. default is 0.
     *     <li>fillStyle:           string hex code. default is `SOLID`.<br/>
     *                              &emsp;&emsp;&emsp;&nbsp;
     *                              one of: `BDIAG, CROSS, DIAG_CROSS, FDIAG, HORIZONTAL, NULL, SOLID, VERTICAL`
     * </ul>
     *
     * Style applies to all polygons and overrides any styling they may have
     *
     * TODO: add option for multipolygon icon fill.
     */
    constructor(id: string | number, polygons: Array<Polygon>, opts = {}) {
        super(id.toString());

        this._styleOptions = new PolygonStyleOptions(opts);

        polygons.forEach((polygon, index) => {
            const subId = index < 10 ? '0' + index : index;
            const newId = id + '-' + subId;

            const points = polygon.ringArray.map(ring => ring.pointArray);
            this._polygonArray.push(new Polygon(newId, points, opts));
        });
    }

    /** Returns an array of the contained polygons. A new array is returned each time this is called. */
    get polygonArray(): Array<Polygon> {
        return [...this._polygonArray];
    }

    /** Returns style options object for the polygons */
    get styleOptions(): PolygonStyleOptions {
        return this._styleOptions;
    }

    /** Returns the string 'MultiPolygon'. */
    get type(): string {
        return 'MultiPolygon';
    }

    /**
     * Returns an array of polygon arrays (e.g. [[[[x1, y1], [x2, y2], [x3, y3], [x1, y1]], [<another ring>]], <another polygon>] )
     */
    toArray(): Array<Array<Array<Array<number>>>> {
        // using private underscore property to avoid copying the array
        return this._polygonArray.map(p => p.toArray());
    }
}

// Style Classes -----------------------

class StyleOptions {
    /** @ignore */
    _width: number;
    /** @ignore */
    _colour: Array<number> | string;
    /** @ignore */
    _style: string;

    constructor(opts?: any) {
        opts = opts || {}; // If opts is undefined set it to an empty obj

        // if an attribute is not defined set it to a default
        this._style = opts.style;
        this._colour = opts.colour || [0, 0, 0];
        this._width = opts.width;
    }

    /** Returns the specified width */
    get width(): number {
        return this._width;
    }

    /** Returns the specified colour */
    get colour(): Array<number> | string {
        return this._colour;
    }

    /** Returns the specified style */
    get style(): string {
        return this._style;
    }
}

class PointStyleOptions extends StyleOptions {
    /** @ignore */
    _height: number;
    /** @ignore */
    _xOffset: number;
    /** @ignore */
    _yOffset: number;
    /** @ignore */
    _icon: string;

    constructor(opts?: any) {
        super(opts);

        opts = opts || {};

        this._icon = opts.icon || '';
        this._style = opts.icon ? 'ICON' : this._style || 'CIRCLE';
        this._height = opts.height || 16.5;
        this._width = opts.width || 16.5;
        this._xOffset = opts.xOffset || 0;
        this._yOffset = opts.yOffset || 0;
    }

    /** Returns the specified height */
    get height(): number {
        return this._height;
    }

    /** Returns the specified x offset */
    get xOffset(): number {
        return this._xOffset;
    }

    /** Returns the specified y offset */
    get yOffset(): number {
        return this._yOffset;
    }

    /** Returns the specified icon */
    get icon(): string {
        return this._icon;
    }
}

class LineStyleOptions extends StyleOptions {
    constructor(opts?: any) {
        super(opts);

        opts = opts || {};

        this._style = this._style || 'SOLID';
        this._width = opts.width || 2;
    }
}

class PolygonStyleOptions extends StyleOptions {
    /** @ignore */
    _outlineColor: Array<number> | string;
    /** @ignore */
    _outlineWidth: number;
    /** @ignore */
    _outlineStyle: string;
    /** @ignore */
    _fillColor: Array<number> | string;
    /** @ignore */
    _fillOpacity: number;
    /** @ignore */
    _fillStyle: string;

    constructor(opts?: any) {
        super(opts);

        opts = opts || {};

        this._outlineColor = opts.outlineColor || this._colour;
        this._outlineWidth = opts.outlineWidth || 2;
        this._outlineStyle = opts.outlineStyle || 'SOLID';

        this._fillColor = opts.fillColor || this._colour;
        this._fillOpacity = opts.fillOpacity || 0;
        this._fillStyle = opts.fillStyle || 'SOLID';
    }

    get outlineColor(): Array<number> | string {
        return this._outlineColor;
    }

    get outlineWidth(): number {
        return this._outlineWidth;
    }

    get outlineStyle(): string {
        return this._outlineStyle;
    }

    get fillColor(): Array<number> | string {
        return this._fillColor;
    }

    get fillOpacity(): number {
        return this._fillOpacity;
    }

    get fillStyle(): string {
        return this._fillStyle;
    }
}

// Descriptors -----------------------

/** Guarantees functions with a parameter of type `XY | XYLiteral` to be of type XY. */
export function XYLiteral(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod = descriptor.value;
    descriptor.value = function(maybeXY: XY | XYLiteral): XY {
        return originalMethod.apply(this, [isXYLiteral(maybeXY) ? new XY(maybeXY[0], maybeXY[1]) : maybeXY]);
    };
    return descriptor;
}

// Interfaces -------------------------
export interface Extent {
    xmin: number;
    xmax: number;
    ymax: number;
    ymin: number;
    spatialReference: { wkid: number };
    getCenter: Function;
}

export interface XYLiteral {
    0: number;
    1: number;
}

interface HovertipOptions {
    keepOpen: boolean;
    position: string;
    xOffset: number;
    yOffset: number;
    followCursor: boolean;
}

// Type guards ------------------------
export function isExtent(x: any): x is Extent {
    return !!x.spatialReference;
}

export function isXYLiteral(x: any): x is XYLiteral {
    return x.length === 2;
}

function isPointInstance(xyOrPoint: Point | XY | XYLiteral): xyOrPoint is Point {
    return xyOrPoint instanceof Point;
}

function isLineInstance(pointOrLine: LineString | Array<Point | XY | XYLiteral>): pointOrLine is LineString {
    return pointOrLine instanceof LineString;
}
