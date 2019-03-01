import { Panel } from '.';
import Button from './button';

export default class CloseButton extends Button {

    set panel(panel: Panel) {
        super.panel = panel;

        // close the panel when a user clicks on the button
        $(panel.element).on('click', `#${this.id}`, () => {
            panel.close();
        });
    }

    constructor(panel?: Panel) {
        super(`<md-icon md-svg-src="navigation:close"><md-tooltip>{{ 'contentPane.tooltip.close' | translate }}</md-tooltip></md-icon>`);

        if (panel) {
            this.panel = panel;
        }

        this.elem.addClass('md-icon-button primary md-button');
    }
}