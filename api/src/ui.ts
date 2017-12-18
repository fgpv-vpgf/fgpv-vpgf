import { Observable } from 'rxjs/Rx';

export class Panel {

    /**
     * Emits when a user clicks anywhere on the map.
     *
     * It **does not** emit for clicks on overlaying panels or map controls.
     * @event click
    */
    click: Observable<MouseEvent>;
}