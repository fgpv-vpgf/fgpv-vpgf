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



import { XY } from 'api/geometry';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';

/** Provides screen and geographic point information for most observable mouse actions. */
export class MouseEvent {
    /** Geographic point information */
    xy: XY | null;
    /** The number of pixels from the top of the viewport. */
    screenY: number;
    /** The number of pixels from the left edge of the viewport. */
    screenX: number;

    equals(otherMouseEvent: MouseEvent) {
        return this.screenX === otherMouseEvent.screenX && this.screenY === otherMouseEvent.screenY;
    }

    constructor(event: esriMouseEvent) {
        // mapPoint is specific to esri and is not available for all event types
        try {
            this.xy = new XY(event.mapPoint.x, event.mapPoint.y);
        } catch (e) {
            this.xy = null;
        }
        this.screenY = event.screenY;
        this.screenX = event.screenX;
    }
}

/**
 * Adds a `features` Observable to map clicks for supporting identify through the API
 * 
 * @example #### Subscribe to feature list
 * 
 * ```js
 * RZ.mapInstances[0].click.subscribe(a => {
 *     a.features.subscribe(featureList => {...});
 * });
 * ```
 */
export class MapClickEvent extends MouseEvent {
    /** @ignore */
    _featureSubject: Subject<Object>;
    features: Observable<Object>;

    constructor(event: esriMouseEvent) {
        super(event);
        this._featureSubject = new Subject();
        this.features = this._featureSubject.asObservable();
    }
}

export class PanelEvent {
    _name: string;
    _content: Node;

    constructor(name: string, node: Node) {
        this._name = name;
        this._content = node;
    }

    get name(): string {
        return this._name;
    }

    get content(): Node {
        return this._content;
    }
}

/** ESRI wraps the standard mouse event with spatial data that we want to preserve. */
export interface esriMouseEvent extends MouseEvent {
    /** Decimal degrees in y,x form */
    mapPoint: {
        y: number,
        x: number
    };
}