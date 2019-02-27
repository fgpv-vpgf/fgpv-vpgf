import { Panel, Button } from './';

export default class ToggleButton extends Button {

    set panel(panel: Panel) {
        super.panel = panel;

        $(panel.panelContents).on('click', `#${this.id}`, () => {
            // if user wants to expand panel
            if (panel.panelBody.css('display') === 'none') {
                panel.panelBody.css('display', 'block');
                this.element = $('<md-icon md-svg-src="content:remove"></md-icon>');
            } else {
                panel.panelBody.css('display', 'none');
                this.element = $('<md-icon md-svg-src="content:add"></md-icon>');
            }
        });
    }


    constructor() {
        super(`<md-icon md-svg-src="content:remove"></md-icon>`);
    }
}