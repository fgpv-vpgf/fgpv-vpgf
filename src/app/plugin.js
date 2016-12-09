/* global RV */
(() => {
    const evtBindings = {
        onCreate: {}
    };

    class BasePlugin {
        get id () { return this._id; }

        set id (id) {
            this._id = id;
            this.translateProperties.forEach(bundle => {
                this[bundle.name] = 'plugin.' + this._id + '.' + bundle.value;
            });
        }

        translateProperty (propName, value) {
            this.translateProperties.push({
                name: propName,
                value: value
            });
        }

        static onCreate (appID, pType, cb) {
            if (!evtBindings.onCreate[pType][appID]) {
                evtBindings.onCreate[pType][appID] = [];
            }

            evtBindings.onCreate[pType][appID].push(cb);
        }

        static eventBindings () {
            return evtBindings;
        }

        constructor (translations) {
            this.translations = translations;
            this.translateProperties = [];
        }
    }

    class MenuItem extends BasePlugin {
        get type () { return this._type; }

        constructor (name, actionCB, translations) {
            super(translations);
            this.translateProperty('name', name);
            this._type = 'link';
            this.action = actionCB;

            if (!evtBindings.onCreate[this.constructor.name]) {
                evtBindings.onCreate[this.constructor.name] = [];
            }
        }

        static onCreate (appID, cb) {
            super.onCreate(appID, 'MenuItem', cb);
        }
    }

    RV.Plugin = {
        MenuItem
    };
})();
