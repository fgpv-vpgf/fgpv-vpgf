/* global HolderIpsum */

(() => {
    'use strict';

    /**
     * @ngdoc service
     * @name tocService
     * @module app.ui.toc
     *
     * @description
     * The `tocService` service provides bindable layer data to the `TocController`'s template.
     *
     * __Lots of hardcoded sample config data.__
     *
     */
    angular
        .module('app.ui.toc')
        .factory('tocService', tocService);

    function tocService(stateManager, $timeout, $rootScope, $http, geoService) {
        const service = {
            // a sample config bit describing layer selector structure; comes from the config file
            data: {
                items: [
                    {
                        type: 'group',
                        name: 'Feature Layers',
                        id: 1,
                        expanded: true,
                        items: [
                            {
                                type: 'layer',
                                name: HolderIpsum.words(3, true),
                                layerType: 'feature',
                                id: 0,
                                symbology: [
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    }
                                ],

                                // FIXME: these should be mostly filled by config default values
                                toggles: {
                                    metadata: {
                                        enabled: true
                                    },
                                    settings: {
                                        enabled: true
                                    },
                                    visibility: {
                                        value: 'on', //'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    },
                                    filters: { // an invisible toggle for filters panel; stores filters configuration
                                        selected: false
                                    }
                                },
                                state: 'default', // error, loading,
                                flags: {
                                    type: {
                                        visible: true,
                                        value: 'feature'
                                    },
                                    data: {
                                        visible: true,
                                        value: 'table'
                                    },
                                    user: {
                                        visible: true
                                    },
                                    scale: {
                                        visible: true
                                    }
                                }
                            },
                            {
                                type: 'layer',
                                name: 'Layer Name 2',
                                layerType: 'feature',
                                id: 1,
                                symbology: [
                                    {
                                        icon: 'url',
                                        name: 'something'
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    }
                                ],
                                toggles: {
                                    metadata: {
                                        enabled: false
                                    },
                                    settings: {
                                        enabled: true
                                    },
                                    visibility: {
                                        value: 'zoomIn', //'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    },
                                    filters: {
                                        selected: false
                                    }
                                },
                                state: 'default', // error, loading,
                                flags: {
                                    type: {
                                        visible: true,
                                        value: 'feature'
                                    },
                                    data: {
                                        visible: false,
                                        value: 'table'
                                    },
                                    user: {
                                        visible: false
                                    },
                                    scale: {
                                        visible: true
                                    }
                                }
                            },
                            {
                                type: 'group',
                                name: 'Sample Subgroup',
                                id: 1,
                                expanded: false,
                                items: [
                                    {
                                        type: 'layer',
                                        name: 'Layer Name 2 Layer Name 2 Layer Name 2 Layer Name 2',
                                        layerType: 'feature',
                                        id: 3,
                                        symbology: [
                                            {
                                                icon: 'url',
                                                name: 'something'
                                            }
                                        ],
                                        toggles: {
                                            metadata: {
                                                enabled: true
                                            },
                                            settings: {
                                                enabled: true
                                            },
                                            visibility: {
                                                value: 'zoomIn', //'off', 'zoomIn', 'zoomOut'
                                                enabled: true
                                            },
                                            filters: {
                                                selected: false
                                            }
                                        },
                                        state: 'default', // error, loading,
                                        flags: {
                                            type: {
                                                visible: true,
                                                value: 'dynamic'
                                            },
                                            data: {
                                                visible: true,
                                                value: 'filter'
                                            },
                                            user: {
                                                visible: false
                                            },
                                            scale: {
                                                visible: false
                                            }
                                        }
                                    },
                                    {
                                        type: 'layer',
                                        name: 'Subgroup Layer Name 2',
                                        layerType: 'feature',
                                        id: 4,
                                        symbology: [
                                            {
                                                icon: 'url',
                                                name: 'something'
                                            }
                                        ],
                                        toggles: {
                                            metadata: {
                                                enabled: true
                                            },
                                            settings: {
                                                enabled: true
                                            },
                                            visibility: {
                                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                                enabled: true
                                            },
                                            remove: {
                                                enabled: true
                                            },
                                            reload: {
                                                enabled: true
                                            },
                                            filters: {
                                                selected: false
                                            }
                                        },
                                        state: 'error', // error, loading,
                                        flags: {
                                            type: {
                                                visible: true,
                                                value: 'feature'
                                            },
                                            data: {
                                                visible: true,
                                                value: 'table'
                                            },
                                            user: {
                                                visible: true
                                            },
                                            scale: {
                                                visible: true
                                            }
                                        }
                                    },
                                    {
                                        type: 'layer',
                                        name: 'Subgroup Layer 3',
                                        layerType: 'image',
                                        id: 5,
                                        symbology: [
                                            {
                                                icon: 'url',
                                                name: 'something'
                                            }
                                        ],
                                        toggles: {
                                            metadata: {
                                                enabled: true
                                            },
                                            settings: {
                                                enabled: true
                                            },
                                            visibility: {
                                                value: 'off', //'off', 'zoomIn', 'zoomOut'
                                                enabled: true
                                            },
                                            filters: {
                                                selected: false
                                            }
                                        },
                                        state: 'default', // error, loading,
                                        flags: {
                                            type: {
                                                visible: true,
                                                value: 'image'
                                            },
                                            data: {
                                                visible: false,
                                                value: 'table'
                                            },
                                            user: {
                                                visible: true
                                            },
                                            scale: {
                                                visible: false
                                            }
                                        }
                                    }
                                ],
                                toggles: {
                                    visibility: {
                                        value: 'on', //'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    }
                                }
                            },
                            {
                                type: 'layer',
                                name: HolderIpsum.words(3, true),
                                layerType: 'feature',
                                id: 7,
                                symbology: [
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    },
                                    {
                                        icon: 'url',
                                        name: HolderIpsum.words(3, true)
                                    }
                                ],
                                toggles: {
                                    metadata: {
                                        enabled: true
                                    },
                                    settings: {
                                        enabled: true
                                    },
                                    visibility: {
                                        value: 'off', //'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    },
                                    filters: {
                                        selected: false
                                    }
                                },
                                state: 'default', // error, loading,
                                flags: {
                                    type: {
                                        visible: true,
                                        value: 'feature'
                                    },
                                    data: {
                                        visible: false,
                                        value: 'filter'
                                    },
                                    user: {
                                        visible: false
                                    },
                                    scale: {
                                        visible: false
                                    }
                                }
                            }
                        ],
                        toggles: {
                            visibility: {
                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                enabled: true
                            }
                        }
                    },
                    {
                        type: 'group',
                        name: 'Image Layers',
                        id: 1,
                        expanded: false,
                        items: [
                            {
                                type: 'layer',
                                name: 'Group 2 Layer Name 1',
                                layerType: 'image',
                                id: 8,
                                symbology: [
                                    {
                                        icon: 'url',
                                        name: 'something'
                                    }
                                ],
                                toggles: {
                                    metadata: {
                                        enabled: true
                                    },
                                    settings: {
                                        enabled: true
                                    },
                                    visibility: {
                                        value: 'on', //'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    },
                                    filters: {
                                        selected: false
                                    }
                                },
                                state: 'default', // error, loading,
                                flags: {
                                    type: {
                                        visible: true,
                                        value: 'feature'
                                    },
                                    data: {
                                        visible: true,
                                        value: 'filter'
                                    },
                                    user: {
                                        visible: false
                                    },
                                    scale: {
                                        visible: false
                                    }
                                }
                            }
                        ],
                        toggles: {
                            visibility: {
                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                enabled: true
                            }
                        }
                    }
                ]
            }, // config and bindable data

            // method called by the toggles and flags set on the layer item
            actions: {
                toggleLayerGroup,
                toggleLayerFiltersPanel
            }
        };

        // toc preset controls (toggles and flags displayed on the layer item)
        service.presets = {
            groupToggles: {
                visibility: {
                    action: toggleGroupVisibility,
                    icon: {
                        on: 'action:visibility',
                        off: 'action:visibility_off',
                        zoomIn: 'action:zoom_in',
                        zoomOut: 'action:zoom_out'
                    },
                    label: 'Toggle group visibility',
                    tooltip: 'Group visibility tooltip'
                }
            },
            toggles: {
                extra: {
                    icon: 'navigation:more_horiz',
                    label: 'Extra',
                    tooltip: 'Extra'
                },
                metadata: {
                    icon: 'action:description',
                    label: 'Metadata',
                    tooltip: 'Metadata',
                    action: toggleMetadata
                },
                query: {
                    icon: 'communication:location_on',
                    label: 'Toggle query',
                    tooltip: 'query tooltip'
                },
                settings: {
                    icon: 'image:tune',
                    label: 'Settings',
                    tooltip: 'Settings',
                    action: toggleSettings
                },
                visibility: {
                    icon: {
                        on: 'action:visibility',
                        off: 'action:visibility_off',
                        zoomIn: 'action:zoom_in',
                        zoomOut: 'action:zoom_out'
                    },
                    label: {
                        off: 'Show layer',
                        on: 'Hide layer',
                        zoomIn: 'Zoom In to details',
                        zoomOut: 'Zoom out to details'
                    },
                    tooltip: {
                        off: 'Show layer',
                        on: 'Hide layer',
                        zoomIn: 'Zoom In to details',
                        zoomOut: 'Zoom out to details'
                    },
                    action: toggleVisiblity
                },
                reload: {
                    icon: 'navigation:refresh',
                    label: 'Reload',
                    tooltip: 'Reload'
                },
                remove: {
                    icon: 'action:delete',
                    label: 'Remove',
                    tooltip: 'Remove'
                },
                filters: {
                    icon: '',
                    label: '',
                    tooltip: ''
                }
            },
            flags: {
                type: {
                    icon: {
                        feature: 'community:vector-square',
                        image: 'image:photo',
                        dynamic: 'action:settings'
                    },
                    label: {
                        feature: 'Feature layer with <x> <points|polygons|lines>',
                        image: 'Image layer',
                        dynamic: 'Dynamic layer with <x> <points|polygons|lines>'
                    },
                    tooltip: {
                        feature: 'Feature layer with <x> <points|polygons|lines>',
                        image: 'Image layer',
                        dynamic: 'Dynamic layer with <x> <points|polygons|lines>'
                    }
                },
                scale: {
                    icon: 'action:info',
                    label: 'Toggle scale',
                    tooltip: 'scale tooltip'
                },
                data: {
                    icon: {
                        table: 'community:table-large',
                        filter: 'community:filter'
                    },
                    label: {
                        table: 'Layer has viewable data',
                        filter: 'Layer data is filtered'
                    },
                    tooltip: {
                        table: 'Layer has viewable data',
                        filter: 'Layer data is filtered'
                    }
                },
                user: {
                    icon: 'social:person',
                    label: 'Toggle user',
                    tooltip: 'user tooltip'
                }
            },
            state: {
                icon: {
                    error: 'alert:error',
                    reloading: 'navigation:refresh'
                },
                label: {
                    error: 'I am Erorr',
                    reloading: 'Updating'
                },
                tooltip: {
                    error: 'I am Erorr',
                    reloading: 'Updating'
                }
            }
        };

        // TODO: move requestId counter to stateManager
        let requestIdCounter = 1;

        // set layer control defaults
        // TODO: should be done when parsing config file
        initLayers(service.data.items);

        // set state change watches on metadata, settings and filters panel
        watchPanelState('sideMetadata', 'metadata');
        watchPanelState('sideSettings', 'settings');
        watchPanelState('filtersFulldata', 'filters');

        return service;

        /**
         * Temporary helper function to set values on layer toggle and flag objects.
         */
        function setLayerControlValues(control, template) {
            control.icon = template.icon[control.value] || template.icon;
            control.tooltip = template.tooltip[control.value] || template.tooltip;
            control.label = template.label[control.value] || template.label;
        }

        // FIXME: updating config layer objects with default values for toggles and flags
        // this should be done when applying defaults to the config file
        // items is an array
        function initLayers(items) {
            /*jshint forin: false */

            // ^ kills jshint error abour for .. in loop
            for (let item of items) {
                if (item.type === 'layer') {

                    // loop through layer toggles
                    for (let name in item.toggles) {
                        let template = service.presets.toggles[name];
                        let control = item.toggles[name];

                        setLayerControlValues(control, template);
                    }

                    // loop through layer flags
                    for (let name in item.flags) {
                        let template = service.presets.flags[name];
                        let control = item.flags[name];

                        setLayerControlValues(control, template);
                    }

                    // TODO: remove/revise; layer object should have cache created before; or outsource cache to something else
                    // should store cache in layer registry
                    item.cache = item.cache || {};

                } else if (item.type === 'group') {
                    // loop through layer toggles
                    for (let name in item.toggles) {

                        let template = service.presets.groupToggles[name];
                        let control = item.toggles[name];

                        setLayerControlValues(control, template);
                    }

                    initLayers(item.items);
                }
            }
        }

        // FIXME: placeholder method for toggling group visibility
        function toggleGroupVisibility(group, value) {
            console.log('I am error', group);
            let template = service.presets.groupToggles.visibility;
            let control = group.toggles.visibility;

            // visibility toggle logic goes here
            const toggle = {
                off: 'on',
                on: 'off'
            };

            control.value = value || toggle[control.value];
            setLayerControlValues(control, template);

            for (let item of group.items) {
                console.log('item', item);

                if (item.type === 'group') {
                    toggleGroupVisibility(item, control.value);
                } else if (item.type === 'layer') {
                    toggleVisiblity(item, control.value);
                }
            }
        }

        // FIXME: placeholder method for toggling visibility
        // if 'value' is not specified, toggle
        function toggleVisiblity(layer, value) {
            let template = service.presets.toggles.visibility;
            let control = layer.toggles.visibility;

            // visibility toggle logic goes here
            const toggle = {
                off: 'on',
                on: 'off',
                zoomIn: 'zoomOut',
                zoomOut: 'zoomIn'
            };

            control.value = value || toggle[control.value];

            // FIXME: this should be done when applying defaults to the config file
            setLayerControlValues(control, template);
        }

        // temp function to open layer groups
        function toggleLayerGroup(group) {
            console.log('toggle layer group', group.name);
            group.expanded = !group.expanded;
        }

        /**
         * Opens settings panel with settings from the provided layer object.
         * // FIXME: opens the same settings right now.
         * @param  {Object} layer layer object whose settings should be opened.
         */
        function toggleSettings(layer) {
            const requester = {
                id: layer.id
            };
            const requestId = togglePanelContent('sideSettings', 'settings', requester, 'filters');

            if (requestId === -1) {
                return;
            }

            updateDisplayedData('settings', requestId, {}, true);
        }

        /**
         * Opens filters panel with data from the provided layer object.
         * // FIXME: opens the same filters panel right now.
         * @param  {Object} layer layer object whose data should be displayed.
         */
        function toggleLayerFiltersPanel(layer) {
            stateManager.display.filters.isLoading = true;

            // close basemap selector if open
            stateManager.setActive({
                other: false
            });

            const requester = {
                id: layer.id,
                name: layer.name
            };
            const requestId = togglePanelContent('filtersFulldata', 'filters', requester, 'side');

            if (requestId === -1) {
                return;
            }

            // temporary data loading
            // TODO: replace ecogeo with layerid
            const newData = geoService.getFormattedAttributes('ecogeo', '0');
                        updateDisplayedData('filters', requestId, newData, false);
        }

        /**
         * Opens metadata panel with data from the provided layer object.
         * // FIXME: generates some garbage text instead of proper metadata
         * @param  {Object} layer layer object whose data should be displayed.
         */
        function toggleMetadata(layer) {
            // toggle panels as needed
            const requester = {
                id: layer.id
            };
            const requestId = togglePanelContent('sideMetadata', 'metadata', requester, 'filters');

            if (requestId === -1) {
                return;
            }

            // check if metadata is cached
            if (layer.cache.metadata) {
                updateDisplayedData('metadata', requestId, layer.cache.metadata, true);
            } else { // else, retrieve it;
                // TODO: generate some metadata to display functionality
                const mdata = HolderIpsum.paragraphs(2, true);

                // TODO: remove; simulating delay on retrieving metadata
                $timeout(() => {
                    layer.cache.metadata = mdata;

                    updateDisplayedData('metadata', requestId, layer.cache.metadata, true);
                }, Math.random() * 3000 + 300); // random delay
            }
        }

        /**
         * Toggles panel specified with following logic:
         * The requested panel can be open or closed;
         *     open:
         *         the content alredy in the panel can belong to a differen layer
         *             same layer:
         *                 -> close panel
         *             different layer:
         *                 -> dehighlight the the old layer; highlihgt the new one
         *     closed:
         *         -> open panel
         *
         * TODO: this ought to be moved to stateManager
         * @param  {String} panelName        panel to open
         * @param  {String} contentName      name of the content
         * @param  {Object} requester        object requesting display change; must have `id` attribute
         * @param  {String} panelNameToClose name of the panel to close before opening the main one if needed
         * @return {Number} return a data requestId; if equals -1, the panel will be closed, no further actions needed; otherwise, the panel will be opened
         */
        function togglePanelContent(panelName, contentName, requester, panelNameToClose) {
            // if specified panel is open and the requester matches
            if (stateManager.state[panelName].active &&
                stateManager.display[contentName].requester.id === requester.id) {
                //stateManager.display[contentName].layerId === layerId) {
                stateManager.setActive(panelName); // just close the panel

                return -1;
            } else {
                // cancel previous data retrieval timeout so we don't display old data
                $timeout.cancel(stateManager.display[contentName].loadingTimeout);

                // if it takes longer than 100 ms to get metadata, kick in the loading screen
                // this is fast enough for people to perceive it as instantaneous
                stateManager.display[contentName].loadingTimeout = $timeout(() => {
                    stateManager.display[contentName].isLoading = true;
                }, 100);

                if (!stateManager.state[panelName].active) { // panel is not open; open it; close other panels is specified
                    // open panel closing anything else specified
                    if (panelNameToClose) {
                        let closePanel = {};
                        closePanel[panelNameToClose] = false;
                        stateManager.setActive(closePanel, panelName);
                    } else {
                        stateManager.setActive(panelName);
                    }
                } else { // panel is open and its content is from a different layer; deselect that layer and select the new one
                    // TODO: delay clearing old content to after the transtion ends - prevents a brief flash of null content in the pane
                    changeContentState(stateManager.display[contentName].requester.id, contentName, false); // old layer
                    changeContentState(requester.id, contentName); // new layer
                }

                // update requestId and the requester object
                stateManager.display[contentName].requester = requester;
                stateManager.display[contentName].requestId = ++requestIdCounter;

                return requestIdCounter;
            }
        }

        /**
         * Updates displayed data for a specific content like layer metadata in the metadata panel.
         * TODO: ought to be moved to stateManager
         *
         * @param {String} contentName    name of the displayed content
         * @param {Number} requestId     request id
         * @param {Object} data          data to be displayed
         * @param {Boolean} isLoaded     flag to remove loading indicator from the panel
         */
        function updateDisplayedData(contentName, requestId, data, isLoaded) {
            // check if the layerId for displayed data still matches data being retrieved
            // this prevents old request which complete after the newer ones to update display with old data
            if (stateManager.display[contentName].requestId === requestId) {
                console.log('Displaying', contentName, 'data for request id', requestId);
                stateManager.display[contentName].data = data;

                // in some cases you might not want to turn off the loading indicator from tocService toggle function
                // with the filters panel for example: fetching data for the table takes time, but generating the actual table also takes time; so you want to turn off the loading indicator from filters panel
                if (isLoaded === true) {
                    stateManager.display[contentName].isLoading = false;

                    // cancel loading indicator timeout if any
                    $timeout.cancel(stateManager.display[contentName].loadingTimeout);
                }
            } else {
                console.log(contentName, 'Data rejected for request id ', requestId, '; loading in progress');
            }
        }

        /**
         * Sets a watch on StateManager for layer data panels. When the panel is opened/closed, calls changeContentState to dehighlight layer toggles and checks the state of the layer item itself (selected / not selected).
         *
         * @param  {String} panelName    name of the panel to watch as specified in the stateManager
         * @param  {String} contentName type of the display data (layer toggle name: 'settings', 'metadata', 'filters')
         */
        function watchPanelState(panelName, contentName) {
            $rootScope.$watch(() => stateManager.state[panelName].active, newValue => {
                if (!stateManager.display[contentName].requester) {
                    return;
                }
                let layerId = stateManager.display[contentName].requester.id;

                //console.log('TocService:', 'panel state change', panelName, contentName, newValue, layerId);
                changeContentState(layerId, contentName, newValue);
            });
        }

        /**
         * Changes the state of the specified layer content (metadata, settings, and filters) to the value provided. If any one of them is selected, the layer is considered selected as well and has a visual indicator of that.
         *
         * @param  {Integer} layerId     id of the layer whose data is displayed
         * @param  {String} contentName type of the data displayed
         * @param  {Boolean} newValue    indicates whether the `contentName` display data is visible or not
         */
        function changeContentState(layerId, contentName, newValue = true) {
            let layer = findLayer(layerId);

            if (layer) {
                // TODO: revise; maybe also store filters values here or something
                layer.toggles[contentName].selected = newValue; // select the toggle to stay visible

                // check if any toggle is selected; if so, select the layer
                let layerSelectedValue = Object.keys(layer.toggles)
                    .some(toggleName => layer.toggles[toggleName].selected);
                layer.selected = layerSelectedValue; // newValue; // change layer's selected state

                // if panel is closed, set current display to null to prevent previous display from showing up during loading
                if (!newValue) {
                    //updateDisplayedData(contentName);
                    // TODO: some of this ought to be moved to stateManager
                    stateManager.display[contentName].data = null;
                    stateManager.display[contentName].requester = null;
                    stateManager.display[contentName].requestId = -1;
                }
            }
        }

        // sergei helper functions; should be handled by layer registry or something
        // TODO: replace
        function iterateLayers(group, func) {
            group.items.forEach(item => {
                if (item.type === 'layer') {
                    func(item);
                } else {
                    iterateLayers(item, func);
                }
            });
        }

        // another one
        // TODO: replace
        function findLayer(id) {
            let layer;

            iterateLayers(service.data, item => {
                if (item.id === id) {
                    layer = item;
                }
            });

            return layer;
        }
    }
})();
