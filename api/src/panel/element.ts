import { Panel } from '.';

export default class Element {
    _element: JQuery<HTMLElement>;
    _panel: Panel;

    set panel(panel: Panel) {
        this._panel = panel;

        if (this.elem && !this.elem.hasClass('ng-scope')) {
            panel.api.$compile(this.elem[0]); // run through angular compiler now that we have api access
        }
    }

    get panel() {
        return this._panel;
    }

    get id(): string {
        console.error(this.elem, this._element, this);
        return this.elem.attr('id');
    }

    get elem(): JQuery<HTMLElement> {
        return this._element;
    }

    get $(): JQuery<HTMLElement> {
        return this._element;
    }

    set elem(element: JQuery<HTMLElement>) {

        if (this._element) {
            this._element.html(element.html());
        } else {
            this._element = element;
        }

        this.elem.attr('id', this.elem.attr('id') || 'PanelElem' + Math.round(Math.random() * 10000).toString());
        this.elem.addClass("elem");

        if (this.panel) {
            this.panel.api.$compile(this.elem[0]);
        }
    }

    constructor(panel: Panel, elementBody?: string | HTMLElement | JQuery<HTMLElement>) {
        this.panel = panel;
        if (elementBody) {
            this.elem = $(elementBody);
        }
    }
}