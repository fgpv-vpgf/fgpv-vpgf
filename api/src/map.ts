///<reference path="index.d.ts"/>
import { MVCObject } from './MVCObject';

export default class Map extends MVCObject {
    mapDiv: HTMLElement;
    opts: Object | JSON | string;


    constructor(mapDiv: HTMLElement, opts?: Object | JSON | string) {
        super();
        this.mapDiv = mapDiv;
        this.opts = opts;
    }
}
