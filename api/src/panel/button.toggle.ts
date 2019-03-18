import { Panel } from '.';
import Button from './button';

export default class ToggleButton extends Button {
    _isOpen: boolean = true;

    get isExpanded() {
        return (<any>this.panel.element).height() >= 50;
    }

    constructor(panel: Panel) {
        super(panel, `<md-icon md-svg-src="navigation:expand_less"></md-icon>`, `{{ 'api.panel.toggle' | translate }}`);
        this.elem
            .addClass('md-icon-button')
            .removeClass('md-raised');

        this.elem.on('click', () => {
            // if user wants to expand panel
            if (this._isOpen) {
                panel.element.css('height', '49px');
                this.element = '<md-icon md-svg-src="navigation:expand_more"></md-icon>';
            } else {
                panel.element.css('height', '');
                this.element = '<md-icon md-svg-src="navigation:expand_less"></md-icon>';
            }

            this._isOpen = !this._isOpen;
        });

    }
}
