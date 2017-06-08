window.rvPlugins = {add: []};

export default class BasePlugin {
    set translations (t) { this._private.translations = t; }
    get translations () { return this._private.translations; }

    wrapForTranslation (value) {
        return 'plugin.' + this.plugin.id + '.' + value;
    }

    constructor (API) {
        this._private = {};
        Object.assign(this, API);
    }
}
