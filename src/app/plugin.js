/* global RV */
(() => {
    class BasePlugin {
        get type () { throw new Error('Plugin must implement getter for type property'); }
        get name () { return this._name; }
        set name (n) { this.setTranslatableProp('_name', n); }
        get id () { return this._id; }
        set id (id) { this._id = id; }

        translations (t) {
            this.translations = t;
            return this;
        }

        setTranslatableProp (name, value) {
            this[name] = 'plugin.' + this.id + '.' + value;
        }
    }

    class MenuItem extends BasePlugin {
        get type () { return 'link'; }
        get action () { return this._action; }

        setAction (a) {
            this._action = a;
            return this;
        }

        setName (n) {
            this.name = n;
            return this;
        }

        constructor (pluginID) {
            super();
            this.id = pluginID;
        }
    }

    RV.Plugin = {};
    RV.Plugin.MenuItem = MenuItem;
})();
