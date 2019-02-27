import { Panel } from './';

export default class BasePanel {
    _panel: Panel;

    set panel(panel: Panel) {
        if (this._panel && this._panel !== panel) {
            throw new Error(`API(panels): cannot place a panel element on a panel instance more than once.`);
        }

        this._panel = panel;
    }

    get panel() {
        return this._panel;
    }
}