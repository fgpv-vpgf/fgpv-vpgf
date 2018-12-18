/**
 * Version 3 of RAMP introduced a new panel framework available through the api. It allows the programmatic creation of panels, open / close functionality, 
 * content updates, and subscribing to panel events. Some legacy panels will take time to port to the new system. This wrapper service aims to provide a unified 
 * way to interact with both new and legacy panels through the api. 
 * 
 * Legacy panels supported for v3:
 * details      - Identify / details results (part of main panel)
 * settings     - Layer setting (part of side panel)
 * meta         - Layer metadata (part of side panel)
 * toc          - Legend (main panel)
 * geo          - Geosearch results (part of main panel)
 * file         - Import file based layer (part of main panel)
 * service      - Import service based layer (part of main panel)
 * 
 * We accomplish this by creating a new api panel then overload key methods like open/close
 */

angular
    .module('app.ui')
    .factory('panelWrapperService', panelWrapperService);

// translates state manager panel names to our wrapped panel instance names
const panelToWrapper = {
    mainDetails: 'detailPanel',
    sideSettings: 'settingsPanel',
    sideMetadata: 'metaPanel',
    mainToc: 'tocPanel',
    mainGeosearch: 'geoPanel',
    mainLoaderFile: 'filePanel',
    mainLoaderService: 'servicePanel'
};

function panelWrapperService(events, detailService, $rootScope, stateManager) {
    const self = this;

    events.$on(events.rvApiMapAdded, (_, mapi) => {
        self.mApi = mapi;

        /**
         * Each panel has a separate wrapper as legacy panels can have differing open/close logic. It's also
         * possible to enhance these wrappers so that panels like details can be opened through the api with the appropriate data.
         */
        detailsPanelWrapper();
        settingsPanelWrapper();
        metaPanelWrapper();
        tocPanelWrapper();
        geosearchPanelWrapper();
        fileLoaderPanelWrapper();
        serviceLoaderPanelWrapper();

        // Listen for the state manager closing event and push to panel api stream
        events.$on('panelClosing', (_, panelName) => {
            panelSubject(panelName, false);
        });

        // Listen for the state manager opening event and push to panel api stream
        events.$on('panelOpening', (_, panelName) => {
            panelSubject(panelName, true);
        });

        function panelSubject(panelName, open) {
            if (!panelToWrapper[panelName]) {
                return;
            }

            const panel = self[panelToWrapper[panelName]];
            panel[open ? 'openingSubject' : 'closingSubject'].next();
        }
    });

    return {};

    function detailsPanelWrapper() {
        self.detailPanel = self.mApi.createPanel('details');

        wrapper(self.detailPanel, 'close', () => {
            detailService.closeDetails();
        });

        self.detailPanel.open = function() {
            console.warn('This panel cannot be opened without a details object.');
        }
    }

    function settingsPanelWrapper() {
        self.settingsPanel = self.mApi.createPanel('settings');

        wrapper(self.settingsPanel, 'close', () => {
            stateManager.setActive({ sideSettings: false });
        });

        self.settingsPanel.open = function() {
            console.warn('This panel cannot be opened via the API.');
        }
    }

    function metaPanelWrapper() {
        self.metaPanel = self.mApi.createPanel('meta');

        wrapper(self.metaPanel, 'close', () => {
            stateManager.setActive({ sideMetadata: false });
        });

        self.metaPanel.open = function() {
            console.warn('This panel cannot be opened via the API.');
        }
    }

    function tocPanelWrapper() {
        self.tocPanel = self.mApi.createPanel('toc');

        wrapper(self.tocPanel, 'close', () => {
            stateManager.setActive({ mainToc: false });
        });

        self.tocPanel.open = function() {
            stateManager.setActive({ mainToc: true });
        }
    }

    function geosearchPanelWrapper() {
        self.geoPanel = self.mApi.createPanel('geo');

        wrapper(self.geoPanel, 'close', () => {
            stateManager.setActive({ mainGeosearch: false });
        });

        self.geoPanel.open = function() {
            stateManager.setActive({ mainGeosearch: true });
        }
    }

    function fileLoaderPanelWrapper() {
        self.filePanel = self.mApi.createPanel('file');

        wrapper(self.filePanel, 'close', () => {
            stateManager.setActive({ main: true, mainLoaderFile: false });
        });

        self.filePanel.open = function() {
            stateManager.setActive({ mainLoaderFile: true });
        }
    }

    function serviceLoaderPanelWrapper() {
        self.servicePanel = self.mApi.createPanel('service');

        wrapper(self.servicePanel, 'close', () => {
            stateManager.setActive({ main: true, mainLoaderService: false });
        });

        self.servicePanel.open = function() {
            stateManager.setActive({ mainLoaderService: true });
        }
    }

    function wrapper(panel, funcName, func) {
        const oldFunc = panel[funcName].bind(panel);
        panel[funcName] = function() {
            func();
            oldFunc();
            $rootScope.$applyAsync();
        };
    }



}