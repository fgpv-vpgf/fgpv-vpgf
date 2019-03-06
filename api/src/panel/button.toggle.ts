import { Panel } from '.';
import Button from './button';

export default class ToggleButton extends Button {
    _isOpen: boolean = true;

    constructor(panel: Panel) {
        super(panel, `<md-icon md-svg-src="content:remove"></md-icon>`);
        this.elem.addClass('md-icon-button');
        this.elem.removeClass('md-raised');

        this.elem.on('click', () => {
            // if user wants to expand panel
            if (this._isOpen) {
                panel.element.css('height', '50px');
                this.element = $('<md-icon md-svg-src="content:add"></md-icon>');
            } else {
                panel.element.css('height', '');
                this.element = $('<md-icon md-svg-src="content:remove"></md-icon>');
            }

            this._isOpen = !this._isOpen;
        });

    }
}