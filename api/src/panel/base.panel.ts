import { Panel } from '.';

export default class BasePanel {
    _panel: Panel;

    set panel(panel: Panel) {
        this._panel = panel;
    }

    get panel() {
        return this._panel;
    }

    constructor(panel?: Panel) {
        if (panel) {
            this.panel = panel;
        }
    }
}