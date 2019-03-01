import { Panel } from '.';
import Button from './button';

export default class ToggleButton extends Button {

    set panel(panel: Panel) {
        super.panel = panel;

        $(panel.element).on('click', `#${this.id}`, () => {
            // if user wants to expand panel
            if (panel.body.css('display') === 'none') {
                panel.body.css('display', 'block');
                this.element = $('<md-icon md-svg-src="content:remove"></md-icon>');
            } else {
                panel.body.css('display', 'none');
                this.element = $('<md-icon md-svg-src="content:add"></md-icon>');
            }
        });
    }


    constructor(panel?: Panel) {
        super(`<md-icon md-svg-src="content:remove"></md-icon>`);

        if (panel) {
            this.panel = panel;
        }

        this.elem.addClass('md-icon-button primary md-button');
    }
}