import { Panel, BasePanel } from './';

/**
 * The upper portion of a panel (optional) that contains:
 * - an optional title
 * - zero or more control buttons (like a close button)
 *
 * Note: only one header instance is allowed per panel.
 */
export default class Header extends BasePanel {
    _title: string;

    set panel(panel: Panel) {
        super.panel = panel;
    }

    /**
     * Sets a title for the panel, aligned to the left side of the header.
     */
    set title(title: string) {
        this._title = title;
    }

    /**
     * Gets the currently set title for the panel.
     */
    get title() {
        return this._title;
    }

    add() {

    }

    remove() {

    }

    find() {

    }
}