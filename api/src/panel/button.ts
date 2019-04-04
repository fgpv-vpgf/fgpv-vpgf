import { Panel } from './';
import Element from './element';

/**
 * The button class handles wrapping the supplied content into a button element.
 */
export default class Button extends Element {
    _btnElem: JQuery<HTMLElement>;
    private elemSet: boolean = false;

    /**
     * Wraps elements in a button prior to being passed to Element.
     *
     * The first time this is called `_btnElem` has not been compiled. Therefore content must not replace an `md-tooltip` element if present. Once compiled `md-tooltip` is moved out of the element by angular and we are free to replace the content without affecting the tooltip. This is also why the tooltip is not changeable after initialization.
     */
    set element(innerButton: string | HTMLElement | JQuery<HTMLElement>) {
        if (!this.elemSet) {
            this._btnElem[0].insertAdjacentHTML("beforeend", (<any>innerButton).prevObject ? (<any>innerButton).first().html() : (<any>innerButton));
            super.elem = this._btnElem;
            this.elemSet = true;
        } else {
            let innerButtonElem = $(innerButton);
            this.panel.api.$compile(innerButtonElem);
            this._btnElem.html(innerButtonElem[0]);
        }
    }

    constructor(panel: Panel, innerButton?: string | HTMLElement | JQuery<HTMLElement>, tooltip?: string) {
        super(panel);

        this._btnElem = $(`<md-button class="primary md-button md-raised" type="button">`);

        if (tooltip) {
            this._btnElem[0].insertAdjacentHTML("afterbegin", `<md-tooltip>${tooltip}</md-tooltip>`);
        }

        if (innerButton) {
            this.element = innerButton;
        }
    }
}
