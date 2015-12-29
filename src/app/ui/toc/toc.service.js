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

    function tocService(stateManager, $timeout, $rootScope) {
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
            },

            presets: null,

            selectedLayer: {},
            layerMetadata: null,
            display: {
                metadata: {
                    isLoading: false, // showing loading indicator in the content pane
                    layerId: -1, // id of the layer which data is being display
                    data: {} // data to display
                },
                settings: {
                    isLoading: false,
                    layerId: -1,
                    data: {}
                },
                filters: {
                    isLoading: false,
                    layerId: -1,
                    data: {}
                }
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
            togglePanelContent('sideSettings', 'settings', layer.id, 'filters');
            setDisplay('settings', layer.id);
        }

        /**
         * Opens filters panel with data from the provided layer object.
         * // FIXME: opens the same filters panel right now.
         * @param  {Object} layer layer object whose data should be displayed.
         */
        function toggleLayerFiltersPanel(layer) {
            // close basemap selector if open
            stateManager.set({
                other: false
            });

            togglePanelContent('filtersFulldata', 'filters', layer.id, 'side');
            setDisplay('filters', layer.id);
        }

        /**
         * Opens metadata panel with data from the provided layer object.
         * // FIXME: generates some garbage text instead of proper metadata
         * @param  {Object} layer layer object whose data should be displayed.
         */
        function toggleMetadata(layer) {
            // cancel previous data retrieval timeout so we don't display old data
            $timeout.cancel(service.display.metadata.handle);

            // if it takes longer than 200 mil to get metadata, kick in the loading screen
            service.display.metadata.handle = $timeout(() => {
                service.display.metadata.isLoading = true;
            }, 100);

            // toggle panels as needed
            togglePanelContent('sideMetadata', 'metadata', layer.id, 'filters');

            // check if metadata is cached
            if (layer.cache.metadata) {
                setDisplay('metadata', layer.id); // display from cache

                $timeout.cancel(service.display.metadata.handle);
            } else { // else, retrieve it;
                // set layerId to check agains when data is retrieved
                service.display.metadata.layerId = layer.id;

                // TODO: generate some metadata to display functionality
                let mdata = HolderIpsum.paragraphs(2, true);

                // TODO: remove; simulating delay on retrieving metadata
                $timeout(() => {
                    layer.cache.metadata = layer.cache.metadata || mdata;

                    // check if the layerId for displayed metadata still matches metadata being retrieved
                    if (service.display.metadata.layerId === layer.id) {
                        setDisplay('metadata', layer.id);

                        // cancel loading indicator timeout
                        $timeout.cancel(service.display.metadata.handle);
                    }
                }, Math.random() * 3000); // random delay
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
         * @param  {String} panelName        panel to open
         * @param  {String} contentName      name of the content
         * @param  {Integer} layerId          id of the layer whose data will be displayed in the opened panel
         * @param  {String} panelNameToClose name of the panel to close before opening the main one if needed
         */
        function togglePanelContent(panelName, contentName, layerId, panelNameToClose) {
            if (!stateManager.get(panelName)) { // panel is not open; open it; close other panels is specified

                // open panel closing anything else specified
                if (panelNameToClose) {
                    let closePanel = {};
                    closePanel[panelNameToClose] = false;
                    stateManager.set(closePanel, panelName);
                } else {
                    stateManager.set(panelName);
                }

            } else if (service.display[contentName].layerId === layerId) { // metadata panel is open and if this layer's metadata is already selected
                stateManager.set(panelName); // just close it
            } else { // panel is open and its content is from a different layer; deselect that layer and select the new one
                // TODO: delay clearing old content to after the transtion ends - prevents a brief flash of null content in the pane
                changeSelectedState(service.display[contentName].layerId, contentName, false); // old layer
                changeSelectedState(layerId, contentName); // new layer
            }
        }

        /**
         * Changes the state of the displayed layer data.
         * If the layerId is provided, then data type is considered to be visible in a panel.
         *
         * @param {String} type    name of the displayed content
         * @param {id} layerId     layer id, defaults to -1
         */
        function setDisplay(type, layerId = -1) {
            if (layerId !== -1) {
                let layer = findLayer(layerId);

                // TODO: decide where to store cached layer data
                service.display[type].data = layer.cache[type];
                service.display[type].layerId = layerId;
            } else {
                service.display[type].layerId = -1;
                service.display[type].data = {};
            }

            service.display[type].isLoading = false;
        }

        /**
         * Sets a watch on StateManager for layer data panels. When the panel is opened/closed, calls changeSelectedState to dehighlight layer toggles and checks the state of the layer item itself (selected / not selected).
         *
         * @param  {String} itemName    name of the panel to watch
         * @param  {String} contentName type of the display data
         */
        function watchPanelState(itemName, contentName) {
            $rootScope.$watch(() => stateManager.get(itemName), newValue => {
                let layerId = service.display[contentName].layerId;
                changeSelectedState(layerId, contentName, newValue);
            });
        }

        /**
         * Sets the selected state of `contentName` layer data type. There options are possible right now: metadata, settings, and filters. If any one of them is selected, the layer is considered selected as well and has a visual indicator of that.
         *
         * @param  {Integer} layerId     id of the layer whose data is displayed
         * @param  {String} contentName type of the data displayed
         * @param  {Boolean} newValue    indicates whether the `contentName` display data is visible or not
         */
        function changeSelectedState(layerId, contentName, newValue = true) {
            let layer = findLayer(layerId);

            if (layer) {
                // TODO: revise; maybe also store filters values here or something
                layer.toggles[contentName].selected = newValue; // select the toggle to stay visible

                // check if any toggle is selected; if so, select the layer
                let layerSelectedValue = Object.keys(layer.toggles)
                    .some(toggleName => layer.toggles[toggleName].selected);
                layer.selected = layerSelectedValue; // newValue; // change layer's selected state

                // if panel closed, set current display to null to prevent previous display from showing up during loading
                if (!newValue) {
                    setDisplay(contentName);
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
