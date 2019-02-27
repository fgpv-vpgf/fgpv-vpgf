import { Panel, Button } from './';

export default class CloseButton extends Button {

    set panel(panel: Panel) {
        super.panel = panel;

        // close the panel when a user clicks on the button
        $(panel.panelContents).on('click', `#${this.id}`, () => {
            panel.close();
        });
    }


    constructor() {
        super(`<md-icon md-svg-src="navigation:close"><md-tooltip>{{ 'contentPane.tooltip.close' | translate }}</md-tooltip></md-icon>`);
    }
}