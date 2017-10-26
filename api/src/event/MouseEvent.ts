import XY from 'api/geometry/XY';

/** Provides screen and geographic point information for most observable mouse actions. */
export class MouseEvent {
    /** Geographic point information */
    xy: XY;
    /** The number of pixels from the top of the viewport. */
    pageY: number;
    /** The number of pixels from the left edge of the viewport. */
    pageX: number;

    constructor(event: esriMouseEvent) {
        this.xy = new XY(event.mapPoint.y, event.mapPoint.x);
        this.pageY = event.pageY;
        this.pageX = event.pageX;
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