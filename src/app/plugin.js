/* global RV */
(() => {
    class BasePlugin {
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
        get type () { return this._type; }
        set type (t) { this._type = t; }
        get name () { return this._name; }
        set name (n) { this.setTranslatableProp('_name', n); }
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
            this.type = 'link';
        }
    }

    RV.Plugin = {
        MenuItem,
        BasePlugin
    };
})();
