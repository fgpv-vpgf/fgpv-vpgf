import { Panel, CloseButton } from '.';

/**
 * The upper portion of a panel (optional) that contains:
 * - an optional title
 * - zero or more control buttons (like a close button)
 *
 * Note: only one header instance is allowed per panel.
 */
export default class Header {
    _header: JQuery<HTMLElement>;
    _closeButton: CloseButton;
    _panel: Panel;

    get panel() {
        return this._panel;
    }

    makeHeader() {
        this._header = $(document.createElement('div'));
        this._header.addClass('rv-header');
        this._header.html(`
          <div class="rv-header-content layout-column" layout="column">
            <h3 class="md-title hidden"></h3>
          </div>

          <span flex="" class="rv-spacer flex"></span>
        `);
    }

    placeHeader() {
        this.makeHeader();
        this._panel.element.prepend(this._header);
    }

    set panel(panel: Panel) {
        this._panel = panel;
        if (!this._header) {
            this.placeHeader();
        }
    }

    set title(title: string) {
        this._header.find('h3').first().removeClass('hidden').text(title);
    }

    get closeButton() {
        this._closeButton = this._closeButton ? this._closeButton : new CloseButton(this._panel);
        this._header.append(this._closeButton.elem);

        this.panel.api.$compile(this._header);
        return this._closeButton.elem;
    }

    constructor(panel?: Panel) {
        if (panel) {
            this.panel = panel;
        }
    }
}