import { Panel, CLOSING_CODES } from '.';
import Button from './button';

export default class CloseButton extends Button {

    constructor(panel: Panel, digest: boolean) {
        super(panel, digest, `<md-icon md-svg-src="navigation:close"></md-icon>`, `{{ 'api.panel.close' | translate }}`);
        this.elem.addClass('md-icon-button');
        this.elem.removeClass('md-raised');

        // close the panel when a user clicks on the button
        this.elem.on('click', () => {
            panel.close({ closingCode: CLOSING_CODES.CLOSEBTN });
        });
    }
}
