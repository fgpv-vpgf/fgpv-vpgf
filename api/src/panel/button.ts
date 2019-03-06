import { Panel } from './';
import Element from './element';

export default class Button extends Element {
    constructor(panel: Panel, innerButton: string | HTMLElement | JQuery<HTMLElement>) {
        super(panel);
        this.element = innerButton;
    }

    /**
     * Wraps elements in a button prior to being passed to Element.
     */
    set element(innerButton: string | HTMLElement | JQuery<HTMLElement>) {
        const button = $(`<button class="primary md-button md-raised" type="button">`);
        button.html((<any>innerButton).prevObject ? (<any>innerButton)[0] : (<any>innerButton));
        super.elem = button;
    }
}