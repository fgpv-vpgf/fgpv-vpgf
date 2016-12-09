/* global RV */
(() => {
    const evtBindings = {
        onCreate: {}
    };

    class BasePlugin {
        constructor (elemEvts) {
            this.elemEvts = elemEvts ? [elemEvts] : [];
        }

        static onCreate (pType, cb) {
            RV.plugins.forEach(plugin => {
                if (plugin instanceof pType) {
                    cb(plugin);
                    evtBindings.onCreate[plugin.constructor.name].push(cb);
                }
            });
        }

        register () {
            RV.plugins.push(this);
            evtBindings.onCreate[this.constructor.name].forEach(cb => cb(this));
        }

        on (evt, func) {
            this.elemEvts.push([evt, func]);
            this.attachEvents();
            return this;
        }

        bindElement (elem) {
            this.element = $(elem);
            this.attachEvents();
            return this;
        }

        attachEvents () {
            while (this.element && this.elemEvts.length > 0) {
                this.element.on(...this.elemEvts.pop());
            }
        }
    }

    class MenuItem extends BasePlugin {
        constructor (name, elemEvts) {
            super(elemEvts);
            this.name = name ? name : '';
            this.type = 'link';

            if (!evtBindings.onCreate[this.constructor.name]) {
                evtBindings.onCreate[this.constructor.name] = [];
            }
        }
    }

    RV.plugins = [];

    RV.Plugin = {
        BasePlugin,
        MenuItem
    };
})();
