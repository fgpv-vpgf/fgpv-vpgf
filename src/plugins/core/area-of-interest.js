/* global RV */
(() => {
    // define english/french translations for use inside plugin
    const translations = {
        'en-CA': {
            bookButtonLabel: 'Areas of Interest',
            title: 'Areas of Interest'
        },

        'fr-CA': {
            bookButtonLabel: 'Zones d\'intérêt',
            title: 'Zones d\'intérêt'
        }
    };

    let self;
    let dialogWindow;
    let addStyle = false;
    const zones = [];
    class AreaOfInterest extends RV.BasePlugins.MenuItem {

        /**
         * Returns a function to be executed when the link is clicked.
         * @return  {Function}    Callback to be executed when link is clicked
         */
        onMenuItemClick () {
            return () => {
                this.api.toggleSideNav('close');

                // creates bookmark links
                let zoneList = '';
                for (let zone of zones) {
                    zoneList +=
                        `<li style="height: 40px; opacity: 1;">
                            <button class="rv-body-button rv-button-square md-button md-ink-ripple"
                                type="button" aria-label="bookmark" ng-click="self.setExtent(${zone.xmin}, ${zone.xmax}, ${zone.ymin}, ${zone.ymax})">
                                <span>${zone.title}</span>
                                <div class="md-ripple-container" style=""></div>
                            </button>
                        </li>`;
                }

                // set controller locals
                const trans = translations[self.getCurrentLang()].plugin.areaOfInterest;
                const items = {
                    title: trans.title,
                    setExtent
                };

                // set controller template
                const template = `<md-dialog class="side-nav-plugin">
                        <rv-content-pane close-panel="self.close()" title-style="title" title-value="{{ self.title }}">
                            <ul class="rv-list rv-list-item-body rv-legend-list">${zoneList}</ul>
                        </rv-content-pane>
                    </md-dialog>`;

                // set style
                if (!addStyle) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    style.innerHTML = '.side-nav-plugin { height: 80%; width: 40%; border-radius: 0; }';
                    document.getElementsByTagName('head')[0].appendChild(style);
                    addStyle = true;
                }

                // open info
                dialogWindow = self.openDialogInfo({ items, template });
            };
        }

        init (template) {
            self = this.api;

            // get list of areas of interest on load
            const zoneList = this.api.getConfig('map').components.areaOfInterest._source;
            for (let zone of zoneList) {
                zones.push(zone);
            }

            this.name = 'bookButtonLabel';
            this.translations = translations;
            this.action = this.onMenuItemClick();
        }
    }

    /**
     *  Set map extent from selected area of interest
     *
     * @function    setExtent
     * @param {Number} xmin              The xmin coord value (lower left corner)
     * @param {Number} xmax              The xmax coord value (upper right corner)
     * @param {Number} ymin              The ymin coord value (lower left corner)
     * @param {Number} ymax              The ymax coord value (upper right corner)
     */
    function setExtent(xmin, xmax, ymin, ymax) {
        const zone = {
            xmin,
            xmax,
            ymin,
            ymax,
            spatialReference: { wkid: 4326 }
        };

        // set extent then close window
        self.setExtent(zone);
        dialogWindow.hide();
    }

    // Register this plugin with global plugins namespace
    RV.Plugins.AreaOfInterest = AreaOfInterest;
})();
