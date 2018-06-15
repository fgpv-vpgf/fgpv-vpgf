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
import Map from 'api/map';
import { Observable, Subject } from 'rxjs';

/** Provides screen and geographic point information for most observable mouse actions. */
export class MouseEvent {
    /** Geographic point information from esri event */
    xy: XY | undefined;
    screenY: number;
    screenX: number;
    pageX: number;
    pageY: number;
    offsetX: number;
    offsetY: number;

    equals(otherMouseEvent: MouseEvent) {
        return this.screenX === otherMouseEvent.screenX && this.screenY === otherMouseEvent.screenY;
    }

    constructor(event: esriMouseEvent | MouseEvent, mapInstance: Map) {
        if (isEsriMouseEvent(event)) {
            this.xy = new XY(event.mapPoint.x, event.mapPoint.y, event.mapPoint.spatialReference.wkid);
        } else {
            // need to use screen point to convert to the map point used in creating the XY
            // however, screenX/Y output the wrong map point value which is why layerX/Y needs to be used
            const mapPoint = mapInstance.mapI.toMap({ x: (<any>event).layerX, y: (<any>event).layerY});
            this.xy = new XY(mapPoint.x, mapPoint.y, mapPoint.spatialReference.wkid);
        }

        this.screenY = event.screenY;
        this.screenX = event.screenX;
        this.pageX = event.pageX;
        this.pageY = event.pageY;
        this.offsetX = event.offsetX;
        this.offsetY = event.offsetY;
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

    constructor(event: esriMouseEvent, mapInstance: Map) {
        super(event, mapInstance);
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

/** ESRI wraps the standard mouse event with spatial data that we want to preserve. Spatial reference equals maps wkid */
export interface esriMouseEvent extends MouseEvent {
    /** Decimal degrees in y,x form */
    mapPoint: {
        y: number,
        x: number
        spatialReference: { wkid: number }
    };

}

function isEsriMouseEvent(event: esriMouseEvent | MouseEvent): event is esriMouseEvent {
    return !!(<esriMouseEvent>event).mapPoint;
}