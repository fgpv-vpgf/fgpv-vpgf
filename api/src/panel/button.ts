import { Panel } from './';
import Element from './element';

export default class Button extends Element {
    constructor(panel: Panel, innerButton: string | HTMLElement | JQuery<HTMLElement>) {
        super(panel);
        this.element = $(innerButton);
    }

    /**
     * Wraps elements in a button prior to being passed to Element.
     */
    set element(innerButton: JQuery<HTMLElement>) {
        const button = $(`<button class="" type="button">`);
        button.html(innerButton[0]);

        super.elem = button;
    }
}