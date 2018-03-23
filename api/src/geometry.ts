/**
 *               __
 *              /    \
 *             | STOP |
 *              \ __ /
 *                ||
 *                ||
 *                ||
 *                ||
 *                ||
 *              ~~~~~~~
 * THE CODE HEREIN IS A WORK IN PROGRESS - DO NOT USE, BREAKING CHANGES WILL OCCUR FREQUENTLY.
 *
 * THIS API IS NOT SUPPORTED.
 */


import { Subject } from 'rxjs/Subject';

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

        x = x <= 180 && x >= -180 ? x : 360 % Math.abs(x) * (x < 0 ? 1 : -1);

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
        const proj = (<any>window).RZ.GAPI.proj;

        let zoomPoint = proj.localProjectPoint(4326, targetProjection, [this.x, this.y]);
        return proj.Point(zoomPoint[0], zoomPoint[1], {wkid: targetProjection});
    }

    /** Returns a projection Point */
    projectFromPoint(sourceProjection: number, x?: number, y?: number) {
        const proj = (<any>window).RZ.GAPI.proj;

        let point = proj.localProjectPoint(sourceProjection, 4326, [this.x || x, this.y || y]);
        return proj.Point(point[0], point[1], {wkid: sourceProjection});
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
    };

    /**
     * Returns a string of the form `y,x` for the current values of x and y, rounded to 6 decimal places.
     */
    toString(): string {
        return this.urlValue();
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
 * const ne = new RV.GEO.XY(150, 65);
 * const sw = new RV.GEO.XY(100, 30);
 *
 * const b1 = new RV.GEO.XYBounds(ne, sw);
 * const b2 = new RV.GEO.XYBounds([170, 35], [90, -60]); // an [x, y] tuple works too
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
            const xy = (<any>window).RZ.GAPI.proj.localProjectExtent(northEast, 4326);
            this.northEast = new XY(xy.x1, xy.y1);
            this.southWest = new XY(xy.x0, xy.y0);
        } else {
            if (isXYLiteral(southWest)) {
                this.southWest = new XY(southWest[0], southWest[1]);
            } else if (typeof southWest === 'undefined') {
                throw new Error("southWest parameter is required if northEast is not an extent");
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
        return (<any>window).RZ.GAPI.Map.getExtentFromJson(extentObj);
    }

    /** Returns true if the given XY point is contained within this boundary. */
    contains(xy: XY): boolean {
        return xy.x >= this.southWest.x && xy.x <= this.northEast.x && xy.y >= this.southWest.y && xy.y <= this.northEast.y;
    }

    /** Returns true if this boundary is equal geographically to the other XYBounds provided. */
    equals(otherXYBounds: XYBounds): boolean {
        return this.northEast.x === otherXYBounds.northEast.x &&
            this.northEast.y === otherXYBounds.northEast.y &&
            this.southWest.x === otherXYBounds.southWest.x &&
            this.southWest.y === otherXYBounds.southWest.y;
    }

    /** Returns true if this boundary intersects with the other XYBounds provided. */
    intersects(otherXYBounds: XYBounds): boolean {
        return !(this.southWest.x > otherXYBounds.northEast.x ||
            this.northEast.x < otherXYBounds.southWest.x ||
            this.southWest.y > otherXYBounds.northEast.y ||
            this.northEast.y < otherXYBounds.southWest.y);
    }

    /**
     * Returns the bounds in the form "x_lo,y_lo,x_hi,y_hi".
     */
    toString(): string {
        return `${this.southWest.x},${this.southWest.y},${this.northEast.x},${this.northEast.y}`;
    }
}

/** A hoverpoint to be displayed when a SimpleLayer geometry is moused onto. */
export class HoverPoint {
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

    /** Returns the hoverpoint id. */
    get id(): string {
        return this._id;
    }

    /** Returns the contents of the hoverpoint. */
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

    /** Returns the string 'HoverPoint'. */
    get type(): string {
        return 'HoverPoint';
    }
}

/**
 * All geometry types must derive from this class. Not intented to be instantiated on its own.
 */
export class BaseGeometry {
    /** @ignore */
    _id: string;
    /** @ignore */
    _hoverpoint: HoverPoint | null = null;
    /** @ignore */
    _hoverpointRemoved: Subject<string> = new Subject();

    /** Sets the geometry id. */
    constructor(id: string) {
        this._id = id;
    }

    /**
     * Returns the type of the geometry object. Possibilities are 'Point', 'MultiPoint', 'LineString'.
     * TODO: 'MultiLineString'.
     * Function implementation in subclasses.
     */
    get type(): string { return ''; }

    /** Returns the geometry id. */
    get id(): string { return this._id; }

    /** Returns the hoverpoint for the geometry, if any. */
    get hoverpoint(): HoverPoint | null { return this._hoverpoint; }

    /** Adds a hoverpoint to the geometry. If one already exists, replace it. */
    addHoverpoint(hoverpoint: HoverPoint) {
        if (this._hoverpoint && this._hoverpoint.id !== hoverpoint.id) {
            this._hoverpointRemoved.next(this._id);
        }

        this._hoverpoint = hoverpoint;
    }

    /** Removes the hoverpoint from the geometry if it exists. TODO: modify if necessary for multigeometries. */
    removeHoverpoint() {
        if (this._hoverpoint) {
            this._hoverpointRemoved.next(this._id);
            this._hoverpoint = null;
        }
    }
}

/** A Point geometry containing a single XY. */
export class Point extends BaseGeometry {
    /** @ignore */
    _xy: XY;
    /** @ignore */
    _icon: string;
    /** @ignore */
    _size: Array<number> = [16.5, 16.5];

    /** Constructs a Point from the given XY or XYLiteral. */
    constructor(id: string | number, icon: string, xy: XY | XYLiteral) {
        super(id.toString());

        this._icon = icon;

        if (isXYLiteral(xy)) {
            this._xy = new XY(xy[0], xy[1]);
        } else {
            this._xy = xy;
        }

        // TODO (maybe): add in an option to specify size (width/height) of point
    }

    /** Returns the URL or SVG path of icon displayed on the map. */
    get icon(): string {
        return this._icon;
    }

    /** Returns the contained XY. */
    get xy(): XY {
        return this._xy;
    }

    /** Returns the size of the point in the following format: [width, height]. */
    get size(): Array<number> {
        return this._size;
    }

    /** Returns the string 'Point'. */
    get type(): string {
        return 'Point';
    }
}

/** A MultiPoint geometry contains a number of Points. */
export class MultiPoint extends BaseGeometry {
    /** @ignore */
    _pointArray: Array<Point> = [];
    /** @ignore */
    _icon: string;

    /** Constructs a MultiPoint from the given Points, XYs or XYLiterals. */
    constructor(id: string | number, icon: string, elements: Array<Point | XY | XYLiteral>) {
        super(id.toString());

        this._icon = icon;
        let counter = 0;

        elements.forEach(elem => {
            const subId = (counter < 10) ? '0' + counter : counter;
            const newId = id + '-' + subId;

            if (isPointInstance(elem)) {
                this._pointArray.push(new Point(newId, icon, elem.xy));
            } else {
                this._pointArray.push(new Point(newId, icon, elem));
            }

            counter++;
        });
    }

    /** Returns the data / image URL or SVG path of icon displayed on the map. */
    get icon(): string {
        return this._icon;
    }

    /** Returns an array of the contained points. A new array is returned each time this is called. */
    get pointArray(): Array<Point> {
        return [ ...this._pointArray ];
    }

    /** Returns the n-th contained point. */
    getAt(n: number): Point {
        return this._pointArray[n];
    }

    /** Returns the number of contained points. */
    get length(): number {
        return this._pointArray.length;
    }

    /** Returns the string 'MultiPoint'. */
    get type(): string {
        return 'MultiPoint';
    }
}

/** A LineString geometry contains a number of XYs. */
export class LineString extends MultiPoint {
    /** Constructs a LineString from the given XYs or XYLiterals. */
    constructor(id: string | number, elements: Array<XY | XYLiteral>) {
        super(id, '', elements);
    }

    /** Returns the string 'LineString'. */
    get type(): string {
        return 'LineString';
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
    xmin: number,
    xmax: number,
    ymax: number,
    ymin: number,
    spatialReference: { wkid: number },
    getCenter: Function
}

export interface XYLiteral {
    0: number,
    1: number
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