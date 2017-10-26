import { Observable } from 'rxjs/Rx';
import * as $ from "jquery";
import { MouseEvent, esriMouseEvent } from 'api/event/MouseEvent';

export default class Map {
    mapDiv: JQuery<HTMLElement>;
    opts: Object | JSON | string;

    /**
     * Emits when a user clicks anywhere on the map.
     *
     * It **does not** emit for clicks on overlaying panels or map controls.
     * @event click
    */
    click: Observable<MouseEvent>;

    /**
     * Emits when a user double clicks anywhere on the map.
     *
     * It **does not** emit for double clicks on overlaying panels or map controls.
     * @event doubleClick
    */
    doubleClick: Observable<MouseEvent>;

    /**
     * Emits whenever a users mouse moves over the map.
     *
     * It **does not** emit for mouse movements over overlaying panels or map controls.
     *
     * This observable emits a considerable amount of data, be mindful of performance implications.
     * @event mouseMove
    */
    mouseMove: Observable<MouseEvent>;

    /**
     * Emits whenever a user left clicks down.
     *
     * It **does not** emit for down left clicks on overlaying panels or map controls.
     * @event mouseDown
    */
    mouseDown: Observable<MouseEvent>;

    /**
     * Emits whenever a user lifts a previous down left click.
     *
     * It **will emit** for mouse lifts **on overlaying panels or map controls**.
     * @event mouseUp
    */
    mouseUp: Observable<MouseEvent>;

    /**
     * Creates a new map inside of the given HTML container, which is typically a DIV element. If opts is a string then it is considered to be
     * a url to a json config snippet of a map.
    */
    constructor(mapDiv: HTMLElement, opts?: Object | JSON | string) {
        this.mapDiv = $(mapDiv);
        this.opts = opts || {};

        const clickStream = Observable.fromEvent(this.mapDiv.find('.rv-esri-map')[0], 'click');

        this.click = generateMouseClickObservable(clickStream, true);
        this.doubleClick = generateMouseClickObservable(clickStream, false);
    }
}

function generateMouseClickObservable(clickStream: Observable<{}>, singleClick: boolean) {
    return clickStream
        .buffer(clickStream.debounceTime(250))
        .filter(list => list.length === (singleClick ? 1 : 2))
        .map(evt => new MouseEvent(<esriMouseEvent>evt[0]));
}