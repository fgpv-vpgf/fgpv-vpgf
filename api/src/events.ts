import { XY } from 'api/geometry';
import { Observable } from 'rxjs/Rx';

/** Provides screen and geographic point information for most observable mouse actions. */
export class MouseEvent {
    /** Geographic point information */
    xy: XY | null;
    /** The number of pixels from the top of the viewport. */
    screenY: number;
    /** The number of pixels from the left edge of the viewport. */
    screenX: number;

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
 * @TODO: finish once supported by ESRI
 */
export class StoppableEvent {
    /**
     * Prevents this event from propagating further, and in some case preventing viewer action.
     * @event stop
    */
    stop(): void {
        // @TODO
    }
}

export class PanelEvent extends StoppableEvent {
    _name: string;
    _content: Node;

    constructor(name: string, node: Node) {
        super();

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