import { Panel } from '.';

import BasePanel from './base.panel';

export default class Element extends BasePanel {
    _element: JQuery<HTMLElement>;

    set panel(panel: Panel) {
        super.panel = panel;
        panel.api.$compile(this.elem[0]); // run through angular compiler now that we have api access
    }

    get id(): string {
        return this.elem.attr('id');
    }

    get elem(): JQuery<HTMLElement> {
        return this._element;
    }

    set elem(element: JQuery<HTMLElement>) {
        this._element = element;
        this.elem.attr('id', this.elem.attr('id') || 'PanelElem' + Math.round(Math.random() * 10000).toString());
        this.elem.addClass("elem");

        if (this.panel) {
            this.panel.api.$compile(this.elem[0]);
        }
    }

    append(element: JQuery<HTMLElement>) {

    }

    constructor(elementBody?: string | HTMLElement | JQuery<HTMLElement>, panel?: Panel) {
        super();

        if (elementBody) {
            this.elem = $(elementBody);
        }
    }
}