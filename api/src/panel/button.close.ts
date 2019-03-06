import { Panel } from '.';
import Button from './button';

export default class CloseButton extends Button {

    constructor(panel: Panel) {
        super(panel, `<md-icon md-svg-src="navigation:close"><md-tooltip>{{ 'contentPane.tooltip.close' | translate }}</md-tooltip></md-icon>`);
        this.elem.addClass('md-icon-button');
        this.elem.removeClass('md-raised');

        // close the panel when a user clicks on the button
        this.elem.on('click', () => {
            panel.close();
        });
    }
}