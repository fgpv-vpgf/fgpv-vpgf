import { Panel, Element, CloseButton, ToggleButton } from '.';

/**
 * The upper portion of a panel (optional) that contains:
 * - an optional title
 * - zero or more control buttons (like a close button)
 *
 * Note: only one header instance is allowed per panel.
 */
export default class Header extends Element {
    _header: JQuery<HTMLElement>;
    _closeButton: CloseButton;
    _toggleButton: ToggleButton;

    append(element: Element) {
        this._header.append(element.elem);
    }

    prepend(element: Element) {
        this._header.prepend(element.elem);
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

    set title(title: string) {
        this._header.find('h3').first().removeClass('hidden').text(title);
    }

    get hasCloseButton() {
        return !!this._closeButton;
    }

    get closeButton() {
        this._closeButton = this._closeButton ? this._closeButton : new CloseButton(this._panel);
        this._header.append(this._closeButton.elem);

        this.panel.api.$compile(this._header);
        return this._closeButton.elem;
    }

    get toggleButton() {
        this._toggleButton = this._toggleButton ? this._toggleButton : new ToggleButton(this._panel);
        this._header.append(this._toggleButton.elem);

        this.panel.api.$compile(this._header);
        return this._toggleButton.elem;
    }

    constructor(panel: Panel) {
        super(panel);
        this.placeHeader();
    }
}