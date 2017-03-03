(() => {
    'use strict';

    /**
     * @module uiStateService
     * @memberof app.ui
     * @description
     *
     * The `uiStateService` factory handles the capture and serialization of UI state, as well as the deserialize and restoration of ui state.
     */
    angular
        .module('app.ui.common')
        .factory('uiStateService', uiStateService);

    function uiStateService(stateManager, $rootScope, configService, geoService, filterService, tocService) {
        const service = {
            setIdentify,
            setDetails,
            state,
            restore,
            serializedState
        };

        let detailObj; // used for storing detail object
        let identify; // used for storing details object on identify

        return service;

        /**
         * Given a json string, it deserializes it and passes it along to the various restore helper functions.
         *
         * @function restore
         * @param   {String}    jsonState     Serialized string to restore
         */
        function restore(jsonState) {
            const uiState = JSON.parse(jsonState);

            restoreMainPanel(uiState.mainPanel);
            restoreSidePanel(uiState.sidePanel);
            restoreFilterPanel(uiState.filterPanel);
            restoreOverviewMap(uiState.overviewMap);
        }

        /**
         * Records the detail object created by filters-default.directive.js. Replaces the layer record with its layer id
         * since we cannot serialize layer records (circular dependencies).
         *
         * @function setDetails
         * @param   {Object}    detail     a details object containing a data key with one layer record
         */
        function setDetails(detail) {
            // deep copy details object so it remains unchanged
            detailObj = $.extend(true, {}, detail);
            // remove layerRec object and replace with layerId. We cannot serialize the object since
            // it contains circular dependencies
            detailObj.data[0].requester.layerRec = detailObj.data[0].requester.layerRec.layerId;
        }

        /**
         * Records the details object created by identify.service.js. Replaces all layer records with their layer id
         * since we cannot serialize layer records (circular dependencies).
         *
         * @function setIdentify
         * @param   {Object}    details     a details object containing data key with all layer records
         */
        function setIdentify(details) {
            identify = $.extend(true, {}, details);
            identify.data.forEach(d => d.requester.layerRec = d.requester.layerRec.layerId);
        }

        /**
         * Returns a serialized version of the UI state.
         *
         * @function serializedState
         * @return   {String}    a JSON string representing the UI state object
         */
        function serializedState() {
            // remove the quotation marks, they make the parser angry
            return JSON.stringify(state()).replace(/\\"/g, '');
        }

        /**
         * Creates a complete UI state object with the following properties:
         *
         * mainPanel:   {...see mainPanelState function docs for more information},
         * sidePanel:   {...see sidePanelState function docs for more information},
         * filterPanel: {...see filterPanelState function docs for more information},
         * overviewMap: {
         *   expanded: Boolean (indicates if the overview map is expanded or minimized)
         * }
         *
         * @function state
         * @return   {Object}    a UI state object
         */
        function state() {
            return Object.assign(
                mainPanelState(),
                sidePanelState(),
                filterPanelState(),
                {
                    overviewMap: {
                        expanded: $rootScope.overviewActive
                    }
                }
            );
        }

        /**
         * Restores functionality to anything related to the main panel
         *
         * @function restoreMainPanel
         * @private
         * @param   {Object}    state     state object for main panel
         */
        function restoreMainPanel(state) {
            if (typeof state === 'undefined') {
                stateManager.setActive({ mainToc: false });

            } else if (state.type === 'toc') {
                stateManager.setActive({ mainToc: true });

            } else if (state.type === 'details') {
                // restore layerRec which only contains the ID to the full layer record object
                state.details.data[0].requester.layerRec = geoService.layers[state.details.data[0].requester.layerRec];
                // open the details panel
                stateManager.toggleDisplayPanel('mainDetails', state.details, {}, 0);

            // FIXME: I'm broken :( I throw SVG errors and fail to load detail information (the spinner keeps spinning)
            } else if (state.type === 'identify') {
                // restore all layerRec which currently only contains the ID to the full layer record object
                state.identify.data.forEach(d => d.requester.layerRec = geoService.layers[d.requester.layerRec]);
                stateManager.toggleDisplayPanel('mainDetails', state.identify, {}, 0);
            }
        }

        /**
         * Restores functionality to anything related to the side panel
         *
         * @function restoreSidePanel
         * @private
         * @param   {Object}    state     state object for the side panel
         */
        function restoreSidePanel(state) {
            if (state && state.type === 'settings') {
                tocService.actions.toggleSettings(geoService.layers[state.layerId]._legendEntry);
            } else if (state && state.type === 'metadata') {
                tocService.actions.toggleMetadata(geoService.layers[state.layerId]._legendEntry);
            }
        }

        /**
         * Restores functionality to the data table
         *
         * @function restoreFilterPanel
         * @private
         * @param   {Object}    state     state object for the filter panel
         */
        function restoreFilterPanel(state) {
            if (typeof state !== 'undefined') {
                tocService.actions.toggleLayerFiltersPanel(geoService.layers[state.layerId]._legendEntry)
                    .then(() => stateManager.setMorph('filters', state.type));
            }
        }

        /**
         * Restores functionality to the overview map
         *
         * @function restoreOverviewMap
         * @private
         * @param   {Object}    state     state object for the overview map
         */
        function restoreOverviewMap(state) {
            if (typeof state !== 'undefined') {
                $rootScope.overviewActive = state.expanded;
            }
        }

        /**
         * Creates a state object for the datatable panel, with the following properties:
         *
         * filterPanel: {
         *   type:       "default" | "full"
         *   layerId:    String
         * }
         *
         * If the filterPanel is not open, an empty object is returned instead.
         *
         * @function filterPanelState
         * @private
         * @return   {Object}    a filterPanel state object (see above) if open, an empty object otherwise
         */
        function filterPanelState() {
            if (stateManager.state.filters.active) {
                return {
                    filterPanel: {
                        type: stateManager.state.filters.morph,
                        layerId: stateManager.display.filters.requester.layerId
                    }
                };
            }

            return {};
        }

        /**
         * Creates a state object for the mainPanel, with the following properties:
         *
         * mainPanel: {
         *   type:       "toc" | "details" | "identify"
         *   details:    Object (optional - only for details type)
         *   identify:   Object (optional - only for identify type)
         * }
         *
         * If the mainPanel is not open, an empty object is returned instead.
         *
         * @function mainPanelState
         * @private
         * @return   {Object}    a mainPanel state object (see above) if open, an empty object otherwise
         */
        function mainPanelState() {
            const mainPanel = {};

            if (stateManager.state.mainToc.active) {
                mainPanel.type = 'toc';

            } else if (stateManager.state.mainDetails.active) {
                const details = stateManager.display.details;
                if (details.data.length === 1) { // detail view since there is only one data item
                    mainPanel.type = 'details';
                    mainPanel.details = detailObj;

                } else {
                    mainPanel.type = 'identify';
                    mainPanel.identify = identify;
                }
            }

            return Object.keys(mainPanel).length === 0 ? {} : { mainPanel };
        }

        /**
         * Creates a state object for the side panel, with the following properties:
         *
         * sidePanel: {
         *   type:       "metadata" | "settings"
         *   layerId:    String
         * }
         *
         * If the sidePanel is not open, an empty object is returned instead.
         *
         * @function sidePanelState
         * @private
         * @return   {Object}    a sidePanel state object (see above) if open, an empty object otherwise
         */
        function sidePanelState() {
            const sidePanel = {};

            if (stateManager.display.metadata.data) {
                sidePanel.type =  'metadata';
                sidePanel.layerId = stateManager.display.metadata.requester.id;

            } else if (stateManager.display.settings.data) {
                sidePanel.type =  'settings';
                sidePanel.layerId = stateManager.display.settings.requester.id;
            }

            return Object.keys(sidePanel).length === 0 ? {} : { sidePanel };
        }
    }
})();
