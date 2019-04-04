import { Panel } from '.';

/**
 * This class forms the foundation of any panel element, including header buttons and the panel body. It standardizes an element for panel consumption by ensuring things like id are set, and that  the appropriate class(es) are set.
 *
 * It also automatically triggers the angular compiler for the user.
 */
export default class Element {
    _element: JQuery<HTMLElement>;
    _panel: Panel;
    _digest: boolean;

    /**
     * Returns the panel instance this element is bound to.
     */
    get panel() {
        return this._panel;
    }

    /**
     * Returns the element id.
     */
    get id(): string {
        return this.elem.attr('id');
    }

    /**
     * Returns the JQuery<HTMLElement> instance
     */
    get elem(): JQuery<HTMLElement> {
        return this._element;
    }

    /**
     * Alias for `elem`.
     */
    get $(): JQuery<HTMLElement> {
        return this._element;
    }

    /**
     * Sets the element content. Use this if `elementBody` was undefined when initalizing this class.
     */
    set elem(element: JQuery<HTMLElement>) {

        if (this._element) {
            this._element.html(element.html());
        } else {
            this._element = element;
        }
        this.elem.attr('id', this.elem.attr('id') || 'PanelElem' + Math.round(Math.random() * 100000000).toString());
        this.elem.addClass("elem");

        if (this.panel) {
            try {
                this.panel.api.$compile(this.elem).$digest();
            } catch {
                // if digest fails do nothing since the template is already compiled
            }
        }
    }

    constructor(panel: Panel, elementBody?: string | HTMLElement | JQuery<HTMLElement>) {
        this._panel = panel;

        if (elementBody) {
            this.elem = $(elementBody);
        }
    }
}
