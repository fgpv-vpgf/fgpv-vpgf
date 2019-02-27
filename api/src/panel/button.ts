import { Panel, Element } from './';

export default class Button extends Element {
    constructor(innerButton: string | HTMLElement | JQuery<HTMLElement>) {
        super();
        this.element = $(innerButton);
    }

    /**
     * Wraps elements in a button prior to being passed to Element.
     */
    set element(innerButton: JQuery<HTMLElement>) {
        const button = $(`<button class="" type="button">`);
        button.html(innerButton[0]);

        super.element = button;
    }
}