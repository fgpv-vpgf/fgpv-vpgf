export default class Map {
    mapDiv: HTMLElement;
    opts: Object | JSON | string;


    constructor(mapDiv: HTMLElement, opts?: Object | JSON | string) {
        this.mapDiv = mapDiv;
        this.opts = opts || {};
    }
}
