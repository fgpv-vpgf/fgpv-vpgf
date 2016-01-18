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

    function tocService(stateManager, $timeout, $rootScope, $http) {
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
            const isOpen = togglePanelContent('sideSettings', 'settings', layer.id, 'filters');

            if (!isOpen) {
                return;
            }

            updateDisplayedLayerData('settings', layer.id, {}, true);
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

            const isOpen = togglePanelContent('filtersFulldata', 'filters', layer.id, 'side');

            if (!isOpen) {
                return;
            }

            // TODO: remove
            // get fake data
            $http
                .get('content/fake_data.json')
                .then(function (data) {
                    // shuffle fake data
                    let newData = shuffle(data.data.aaData);
                    newData.splice(Math.floor(Math.random() * (newData.length - 20) + 20));
                    newData.forEach((row, index) => row[0] = index + 1);
                    newData = {
                        columns: [
                            {
                                title: 'ID'
                            },
                            {
                                title: 'First Name'
                            },
                            {
                                title: 'Last Name'
                            },
                            {
                                title: 'ZIP'
                            },
                            {
                                title: 'Country'
                            }
                        ],
                        data: newData
                    };

                    // simulate delay to show loading splash
                    return $timeout(function () {
                        updateDisplayedLayerData('filters', layer.id, newData, false);

                        //console.log(stateManager.display.filters.data);
                    }, 2000);
                })
                .catch(function (error) {
                    console.log('failed to load fake data:', error);
                });

            // helper to shuffle array
            // TODO: remove
            function shuffle(array) {
                let counter = array.length;
                let temp;
                let index;

                // While there are elements in the array
                while (counter > 0) {
                    // Pick a random index
                    index = Math.floor(Math.random() * counter);

                    // Decrease counter by 1
                    counter--;

                    // And swap the last element with it
                    temp = array[counter];
                    array[counter] = array[index];
                    array[index] = temp;
                }

                return array;
            }
        }

        /**
         * Opens metadata panel with data from the provided layer object.
         * // FIXME: generates some garbage text instead of proper metadata
         * @param  {Object} layer layer object whose data should be displayed.
         */
        function toggleMetadata(layer) {
            // toggle panels as needed
            const isOpen = togglePanelContent('sideMetadata', 'metadata', layer.id, 'filters');

            if (!isOpen) {
                return;
            }

            // check if metadata is cached
            if (layer.cache.metadata) {
                updateDisplayedLayerData('metadata', layer.id, layer.cache.metadata, true);
            } else { // else, retrieve it;
                // TODO: generate some metadata to display functionality
                const mdata = HolderIpsum.paragraphs(2, true);

                // TODO: remove; simulating delay on retrieving metadata
                $timeout(() => {
                    layer.cache.metadata = mdata;

                    updateDisplayedLayerData('metadata', layer.id, layer.cache.metadata, true);
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
         * @param  {String} panelName        panel to open
         * @param  {String} contentName      name of the content
         * @param  {Integer} layerId          id of the layer whose data will be displayed in the opened panel
         * @param  {String} panelNameToClose name of the panel to close before opening the main one if needed
         * @return {Boolean} a flag inidicating whether the panel will be opened or closed
         */
        function togglePanelContent(panelName, contentName, layerId, panelNameToClose) {
            // metadata panel is open and if this layer's metadata is already selected
            if (stateManager.state[panelName].active &&
                stateManager.display[contentName].layerId === layerId) {
                stateManager.setActive(panelName);

                return false;
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
                    changeContentState(stateManager.display[contentName].layerId, contentName, false); // old layer
                    changeContentState(layerId, contentName); // new layer
                }

                // update id to the layer whose data is being displayed
                stateManager.display[contentName].layerId = layerId;

                return true;
            }
        }

        /**
         * Updates displayed data for a specific layer content like layer metadata in the metadata panel.
         *
         * @param {String} contentName    name of the displayed content
         * @param {Number} layerId     layer id, defaults to -1
         * @param {Object} data     data to be displayed, defaults to {}
         * @param {Boolean} isLoaded     flag to remove loading indicator from the panel
         */
        function updateDisplayedLayerData(contentName, layerId, data, isLoaded) {
            // check if the layerId for displayed data still matches data being retrieved
            // this prevents old request which complete after the newer ones to update display with old data
            if (stateManager.display[contentName].layerId === layerId) {
                console.log('Displaying', contentName, 'data for ', layerId);
                stateManager.display[contentName].data = data;

                // in some cases you might not want to turn off the loading indicator from tocService toggle function
                // with the filters panel for example: fetching data for the table takes time, but generating the actual table also takes time; so you want to turn off the loading indicator from filters panel
                if (isLoaded === true) {
                    stateManager.display[contentName].isLoading = false;

                    // cancel loading indicator timeout if any
                    $timeout.cancel(stateManager.display[contentName].loadingTimeout);
                }
            } else {
                console.log(contentName, 'Data rejected for ', layerId, '; loading in progress');
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
                let layerId = stateManager.display[contentName].layerId;

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

                //console.log('layer.toggles', layer.toggles);

                // check if any toggle is selected; if so, select the layer
                let layerSelectedValue = Object.keys(layer.toggles)
                    .some(toggleName => layer.toggles[toggleName].selected);
                layer.selected = layerSelectedValue; // newValue; // change layer's selected state

                // if panel is closed, set current display to null to prevent previous display from showing up during loading
                if (!newValue) {
                    //updateDisplayedLayerData(contentName);
                    stateManager.display[contentName].data = {};
                    stateManager.display[contentName].layerId = -1;
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
