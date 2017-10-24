import YX from 'api/geometry/YX';

export default class MouseEvent {
    private _yx: YX;
    private _pageY: number;
    private _pageX: number;


    constructor(event: any) {
        this._yx = new YX(event.mapPoint.y, event.mapPoint.x);
        this._pageY = event.pageY;
        this._pageX = event.pageX;
    }

    get YX(): YX { return this._yx; }
}