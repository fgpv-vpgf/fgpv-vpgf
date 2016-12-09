/* global RV */
(() => {
    const evtBindings = {
        onCreate: {}
    };

    let pluginNum = 0;

    class BasePlugin {
        constructor (translations) {
            this.translations = translations;
            this.id = 'plugin-' + pluginNum;
            pluginNum += 1;

            Object.keys(this.translations).forEach(lang =>
                this.translations[lang] = { [this.id]: this.translations[lang] }
            );
        }

        translationKey (key) {
            return this.id + '.' + key;
        }

        static onCreate (appID, pType, cb) {
            if (!evtBindings.onCreate[pType][appID]) {
                evtBindings.onCreate[pType][appID] = [];
            }

            evtBindings.onCreate[pType][appID].push(cb);
        }
    }

    class MenuItem extends BasePlugin {
        constructor (name, actionCB, translations) {
            super(translations);
            this.name = this.translationKey(name);
            this.type = 'link';
            this.action = actionCB;

            if (!evtBindings.onCreate[this.constructor.name]) {
                evtBindings.onCreate[this.constructor.name] = [];
            }
        }
    }

    RV.Plugin = {
        BasePlugin,
        MenuItem
    };

    RV.evtBindings = evtBindings;
})();
