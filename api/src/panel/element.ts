import { Panel, BasePanel } from './';

export default class Element extends BasePanel {
    _element: JQuery<HTMLElement>;

    set panel(panel: Panel) {
        super.panel = panel;
        panel.api.$compile(this.element[0]); // run through angular compiler now that we have api access
    }

    get id(): string {
        return this.element.attr('id');
    }

    get element(): JQuery<HTMLElement> {
        return this._element;
    }

    set element(element: JQuery<HTMLElement>) {
        this._element = element;

        this.element.attr('id', this.element.attr('id') || 'PanelElem' + Math.round(Math.random() * 10000).toString());
        this.element.addClass("elem");

        if (this.panel) {
            this.panel.api.$compile(this.element[0]);
        }
    }

    constructor(elementBody?: string | HTMLElement | JQuery<HTMLElement>) {
        super();
        this.element = $(elementBody || '');
    }
}