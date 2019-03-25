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
    _controls: JQuery<HTMLElement>;
    _closeButton: CloseButton;
    _toggleButton: ToggleButton;

    /**
     * Appends the provided element to the end of the controls section in the header. The controls section is to the right of the title.
     *
     * @param element the element to append to the header
     */
    append(element: Element | string | HTMLElement | JQuery<HTMLElement>) {
        this._controls.append((<Element>element).elem ? (<any>element).elem : $((<any>element)));
    }

    /**
     * Prepends the provided element to the front of the controls section in the header. The controls section is to the right of the title.
     *
     * @param element the element to prepend to the header
     */
    prepend(element: Element) {
        this._controls.prepend((<Element>element).elem ? (<any>element).elem : $((<any>element)));
    }

    /**
     * Returns the element which stores all controls.
     */
    get controls() {
        return this._controls;
    }

    /**
     * Sets the panel title.
     */
    setTitle(title: string, digest: boolean = false) {
        const titleElem = this._header.find('header > h3').first();
        titleElem
            .css('display', '')
            .text(title);

        if (digest === true) {
            this.panel.api.$compile(titleElem[0]).$digest();
        } else {
            this.panel.api.$compile(titleElem[0]);
        }
    }

    /**
     * Sets the panel subtitle.
     */
    setSubtitle(subtitle: string, digest: boolean = false) {
        const subtitleElem = this._header.find('header > p').first();
        subtitleElem
            .css('display', '')
            .text(subtitle);

        if (digest === true) {
            this.panel.api.$compile(subtitleElem[0]).$digest();
        } else {
            this.panel.api.$compile(subtitleElem[0]);
        }

    }

    /**
     * Returns true iff the panel has a close button that was created through `panel.header.closeButton`.
     */
    get hasCloseButton() {
        return !!this._closeButton;
    }

    /**
     * Adds a close button to the header controls.
     */
    getCloseButton(digest: boolean = false) {
        if (!this._closeButton) {
            this._closeButton = new CloseButton(this._panel, digest );
            this.append(this._closeButton.elem);
        }

        return this._closeButton.elem;
    }

    /**
     * Adds a toggle button to the header controls.
     */
    getToggleButton(digest: boolean = false) {
        if (!this._toggleButton) {
            this._toggleButton = new ToggleButton(this._panel, digest);
            this.append(this._toggleButton.elem);
        }

        return this._toggleButton.elem;
    }

    private makeHeader() {
        this._header = $(document.createElement('div'));
        this._controls = $('<span class="rv-header-controls"></span>');
        this._header.addClass('rv-header');
        this._header.html(`
          <div class="rv-header-content layout-column" layout="column">
            <header>
                <h3 class="md-title" style="display:none;"></h3>
                <p class="tagline" style="display:none;"></p>
            </header>
          </div>

          <span flex="" class="rv-spacer flex"></span>
        `);
        this._header.append(this._controls);
    }

    private placeHeader() {
        this.makeHeader();
        this._panel.element.prepend(this._header);
    }

    constructor(panel: Panel, digest: boolean = false) {
        super(panel, digest);
        this.placeHeader();
    }
}
