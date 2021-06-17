import { XY } from 'api/geometry';
import Map from 'api/map';
import { Observable, Subject } from 'rxjs';

/** Provides screen and geographic point information for most observable mouse actions. */
export class MouseEvent {
    /** Geographic point information from esri event */
    xy: XY | undefined;
    screenY: number | undefined;
    screenX: number | undefined;
    pageX: number | undefined;
    pageY: number | undefined;
    offsetX: number | undefined;
    offsetY: number | undefined;

    equals(otherMouseEvent: MouseEvent) {
        return this.screenX === otherMouseEvent.screenX && this.screenY === otherMouseEvent.screenY;
    }

    constructor(event: esriMouseEvent | MouseEvent, mapInstance: Map) {
        if (isEsriMouseEvent(event)) {
            const sr = event.mapPoint.spatialReference;
            this.xy = new XY(event.mapPoint.x, event.mapPoint.y, sr.wkid || sr.wkt);
        } else {
            // need to use screen point to convert to the map point used in creating the XY
            // however, screenX/Y output the wrong map point value which is why layerX/Y needs to be used
            const mapPoint = mapInstance.mapI.toMap({ x: (<any>event).layerX, y: (<any>event).layerY });
            const sr = mapPoint.spatialReference;
            this.xy = new XY(mapPoint.x, mapPoint.y, sr.wkid || sr.wkt);
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
 * RAMP.mapInstances[0].click.subscribe(a => {
 *     a.features.subscribe(featureList => {...});
 * });
 * ```
 */
export class MapClickEvent extends MouseEvent {
    /** @ignore */
    _featureSubject: Subject<Object>;

    /**
     * A stream of features as they become available once a map click has occurred.
     */
    features: Observable<Object>;

    /**
     * Indicates whether this map click event was triggered programmatically via the API. If true, some properties like the screen position of the click will be undefined.
     */
    apiInitiated: false;

    constructor(event: esriMouseEvent, mapInstance: Map) {
        super(event, mapInstance);
        this._featureSubject = new Subject();
        this.features = this._featureSubject.asObservable();
    }
}

export class PanelEvent {
    /** @ignore */
    _name: string;
    /** @ignore */
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
        y: number;
        x: number;
        spatialReference: {
            wkid: number;
            latestWkid: number;
            wkt: string;
        };
    };
}

function isEsriMouseEvent(event: esriMouseEvent | MouseEvent): event is esriMouseEvent {
    return !!(<esriMouseEvent>event).mapPoint;
}
