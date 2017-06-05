import BasePlugin from './base';

export default class MenuItem extends BasePlugin {
    get onClick () { throw new Error('onClick not implemented by plugin extending MenuItem.'); }
    set onClick (x) { throw new Error('onClick cannot be set on MenuItem.'); }

    set buttonLabel (btnLbl) { this._private.buttonLabel = this.wrapForTranslation(btnLbl); }
    get buttonLabel () { return this._private.buttonLabel; }
}
