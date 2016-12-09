/* global RV */
(() => {
    const evtBindings = {
        onCreate: {}
    };

    class BasePlugin {
        constructor (translations) {
            this.translations = translations;
            this.translateProperties = [];
        }

        setID (id) {
            this.id = id;
            this.translateProperties.forEach(bundle => {
                this[bundle.name] = this.id + '.' + bundle.value;
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
    }

    class MenuItem extends BasePlugin {
        constructor (name, actionCB, translations) {
            super(translations);
            this.translateProperty('name', name);
            this.type = 'link';
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
