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

    function tocService($timeout, $q, $rootScope, $http, stateManager, geoService) {
        // TODO: remove after switching to the real config
        // jscs:disable maximumLineLength
        const service = {
            // a sample config bit describing layer selector structure; comes from the config file
            data: {
                items: [
                    {
                        type: 'group',
                        name: 'Real Layers',
                        id: 1,
                        expanded: false,
                        items: [

                        ],
                        options: {
                            visibility: {
                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                enabled: true
                            }
                        }
                    },
                    {
                        type: 'group',
                        name: 'Feature Layers',
                        id: 1,
                        expanded: true,
                        items: [
                            {
                                type: 'layer',
                                name: HolderIpsum.words(3, true),
                                layerType: 'esriFeature',
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
                                options: {
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
                                    },
                                    remove: {
                                        enabled: true
                                    }
                                },
                                state: 'default', // error, loading,
                                flags: {
                                    type: {
                                        visible: true,
                                        value: 'esriFeature'
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
                                layerType: 'esriFeature',
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
                                options: {
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
                                    },
                                    remove: {
                                        enabled: true
                                    }
                                },
                                state: 'default', // error, loading,
                                flags: {
                                    type: {
                                        visible: true,
                                        value: 'esriFeature'
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
                                        layerType: 'esriFeature',
                                        id: 3,
                                        symbology: [
                                            {
                                                icon: 'url',
                                                name: 'something'
                                            }
                                        ],
                                        options: {
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
                                            },
                                            remove: {
                                                enabled: true
                                            }
                                        },
                                        state: 'default', // error, loading,
                                        flags: {
                                            type: {
                                                visible: true,
                                                value: 'esriDynamic'
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
                                        layerType: 'esriFeature',
                                        id: 4,
                                        symbology: [
                                            {
                                                icon: 'url',
                                                name: 'something'
                                            }
                                        ],
                                        options: {
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
                                                value: 'esriFeature'
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
                                        layerType: 'esriImage',
                                        id: 5,
                                        symbology: [
                                            {
                                                icon: 'url',
                                                name: 'something'
                                            }
                                        ],
                                        options: {
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
                                            },
                                            remove: {
                                                enabled: true
                                            }
                                        },
                                        state: 'default', // error, loading,
                                        flags: {
                                            type: {
                                                visible: true,
                                                value: 'esriImage'
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
                                options: {
                                    visibility: {
                                        value: 'on', //'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    }
                                }
                            },
                            {
                                type: 'layer',
                                name: HolderIpsum.words(3, true),
                                layerType: 'esriFeature',
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
                                options: {
                                    metadata: {
                                        enabled: true
                                    },
                                    settings: {
                                        enabled: false
                                    },
                                    visibility: {
                                        value: 'off', //'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    },
                                    filters: {
                                        selected: false
                                    },
                                    remove: {
                                        enabled: true
                                    }
                                },
                                state: 'default', // error, loading,
                                flags: {
                                    type: {
                                        visible: true,
                                        value: 'esriFeature'
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
                        options: {
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
                                layerType: 'esriImage',
                                id: 8,
                                symbology: [
                                    {
                                        icon: 'url',
                                        name: 'something'
                                    }
                                ],
                                options: {
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
                                    },
                                    remove: {
                                        enabled: true
                                    }
                                },
                                state: 'default', // error, loading,
                                flags: {
                                    type: {
                                        visible: true,
                                        value: 'esriFeature'
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
                        options: {
                            visibility: {
                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                enabled: true
                            }
                        }
                    },
                    {
                        type: 'group',
                        name: 'Crazy Nested Group',
                        id: 1,
                        expanded: false,
                        items: [
                            {
                                type: 'group',
                                name: 'Nested Level 2',
                                id: 1,
                                expanded: false,
                                items: [
                                    {
                                        type: 'group',
                                        name: 'Nested Level 3',
                                        id: 1,
                                        expanded: false,
                                        items: [
                                            {
                                                type: 'group',
                                                name: 'Nested Level 4',
                                                id: 1,
                                                expanded: false,
                                                items: [
                                                    {
                                                        type: 'group',
                                                        name: 'Nested Level 5',
                                                        id: 1,
                                                        expanded: false,
                                                        items: [
                                                            {
                                                                type: 'group',
                                                                name: 'Nested Level 6',
                                                                id: 1,
                                                                expanded: false,
                                                                items: [
                                                                    {
                                                                        type: 'group',
                                                                        name: 'Nested Level 7',
                                                                        id: 1,
                                                                        expanded: false,
                                                                        items: [
                                                                            {
                                                                                type: 'group',
                                                                                name: 'Nested Level 8',
                                                                                id: 1,
                                                                                expanded: false,
                                                                                items: [
                                                                                    {
                                                                                        type: 'group',
                                                                                        name: 'Nested Level 9',
                                                                                        id: 1,
                                                                                        expanded: false,
                                                                                        items: [
                                                                                            {
                                                                                                type: 'group',
                                                                                                name: 'Nested Level 10',
                                                                                                id: 1,
                                                                                                expanded: false,
                                                                                                items: [
                                                                                                    {
                                                                                                        type: 'layer',
                                                                                                        name: 'Lonely Layer',
                                                                                                        layerType: 'esriImage',
                                                                                                        id: 8,
                                                                                                        symbology: [
                                                                                                            {
                                                                                                                icon: 'url',
                                                                                                                name: 'something'
                                                                                                            }
                                                                                                        ],
                                                                                                        options: {
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
                                                                                                            },
                                                                                                            remove: {
                                                                                                                enabled: true
                                                                                                            }
                                                                                                        },
                                                                                                        state: 'default', // error, loading,
                                                                                                        flags: {
                                                                                                            type: {
                                                                                                                visible: true,
                                                                                                                value: 'esriFeature'
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
                                                                                                ],
                                                                                                options: {
                                                                                                    visibility: {
                                                                                                        value: 'on', //'off', 'zoomIn', 'zoomOut'
                                                                                                        enabled: true
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        ],
                                                                                        options: {
                                                                                            visibility: {
                                                                                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                                                                                enabled: true
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                ],
                                                                                options: {
                                                                                    visibility: {
                                                                                        value: 'on', //'off', 'zoomIn', 'zoomOut'
                                                                                        enabled: true
                                                                                    }
                                                                                }
                                                                            }
                                                                        ],
                                                                        options: {
                                                                            visibility: {
                                                                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                                                                enabled: true
                                                                            }
                                                                        }
                                                                    }
                                                                ],
                                                                options: {
                                                                    visibility: {
                                                                        value: 'on', //'off', 'zoomIn', 'zoomOut'
                                                                        enabled: true
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                        options: {
                                                            visibility: {
                                                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                                                enabled: true
                                                            }
                                                        }
                                                    }
                                                ],
                                                options: {
                                                    visibility: {
                                                        value: 'on', //'off', 'zoomIn', 'zoomOut'
                                                        enabled: true
                                                    }
                                                }
                                            }
                                        ],
                                        options: {
                                            visibility: {
                                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                                enabled: true
                                            }
                                        }
                                    }
                                ],
                                options: {
                                    visibility: {
                                        value: 'on', //'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    }
                                }
                            }
                        ],
                        options: {
                            visibility: {
                                value: 'on', //'off', 'zoomIn', 'zoomOut'
                                enabled: true
                            }
                        }
                    }
                ]
            }, // config and bindable data

            // method called by the options and flags set on the layer item
            actions: {
                toggleLayerGroup,
                toggleLayerFiltersPanel
            }
        };

        // toc preset controls (options and flags displayed on the layer item)
        // TODO: move presets to a constant service
        service.presets = {
            groupOptions: {
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
            options: {
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
                    tooltip: 'Remove',
                    action: removeLayer
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
                        esriFeature: 'community:vector-square',
                        esriDynamic: 'action:settings',
                        ogcWms: 'image:photo',
                        esriImage: 'image:photo'
                    },
                    label: {
                        esriFeature: 'ESRI Feature Layer (<x> <points|polygons|lines>)',
                        esriDynamic: 'ESRI Dynamic Layer (<x> <points|polygons|lines>)',
                        ogcWms: 'OGC WMS Layer',
                        esriImage: 'ESRI Image Layer'
                    },
                    tooltip: {
                        esriFeature: 'ESRI Feature Layer (<x> <points|polygons|lines>)',
                        esriDynamic: 'ESRI Dynamic Layer (<x> <points|polygons|lines>)',
                        ogcWms: 'OGC WMS Layer',
                        esriImage: 'ESRI Image Layer'
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
                query: {
                    icon: 'community:map-marker-off',
                    label: 'query is turned off',
                    tooltip: 'query is turned off'
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

        // jscs:enable maximumLineLength

        // set layer control defaults
        // TODO: should be done when parsing config file
        initLayers(service.data.items);

        // remove
        $timeout(() => {
            service.data.items[0].items = geoService.layerOrder.map(id => {
                // add some fake symbology for now
                geoService.layers[id].state.symbology = [
                    {
                        icon: 'url',
                        name: HolderIpsum.words(3, true)
                    }
                ];
                geoService.layers[id].state.cache = {};
                geoService.layers[id].state.flags.type.value = geoService.layers[id].state.layerType;

                return geoService.layers[id].state;
            });

            //console.log('--->', service.data.items[0]);
        }, 7000); // FIXME: wait for layer to be added to the layer registry; this will not be needed as we are going to bind directly to layer/legend construction from geoservice; this is needed right now to keep the fake layers in the layer selector as well.

        // set state change watches on metadata, settings and filters panel
        watchPanelState('sideMetadata', 'metadata');
        watchPanelState('sideSettings', 'settings');
        watchPanelState('filtersFulldata', 'filters');

        return service;

        // FIXME: updating config layer objects with default values for options and flags
        // this should be done when applying defaults to the config file
        // items is an array
        function initLayers(items) {
            /*jshint forin: false */

            // ^ kills jshint error abour for .. in loop
            for (let item of items) {
                if (item.items === undefined) {
                    // TODO: remove/revise; layer object should have cache created before; or outsource cache to something else
                    // should store cache in layer registry
                    item.cache = item.cache || {};

                } else {
                    initLayers(item.items);
                }
            }
        }

        /**
         * Simple function to remove layers.
         * TODO: needs more work to handle dynamic layer and other crazy stuff
         * @param  {Object} layer layerItem object from the layer selector
         */
        function removeLayer(layer) {
            geoService.removeLayer(layer.id);

            iterateLayers(service.data, (item, index, group) => {
                if (item.id === layer.id) {
                    //console.log(item, index, group);

                    if (index !== -1) {
                        group.items.splice(index, 1);
                    }
                }
            });
        }

        // FIXME: placeholder method for toggling group visibility
        function toggleGroupVisibility(group, value) {
            console.log('I am error', group);

            let control = group.options.visibility;

            // visibility toggle logic goes here
            const toggle = {
                off: 'on',
                on: 'off'
            };

            control.value = value || toggle[control.value];

            for (let item of group.items) {
                console.log('item', item);

                if (item.items !== undefined) {
                    toggleGroupVisibility(item, control.value);
                } else {
                    toggleVisiblity(item, control.value);
                }
            }
        }

        // FIXME: placeholder method for toggling visibility
        // if 'value' is not specified, toggle
        function toggleVisiblity(layer, value) {
            const control = layer.options.visibility;

            // visibility toggle logic goes here
            const toggle = {
                off: 'on',
                on: 'off',
                zoomIn: 'zoomOut',
                zoomOut: 'zoomIn'
            };

            value = value || toggle[control.value];

            geoService.setLayerVisibility(layer.id, value);
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
            const panelToClose = {
                filters: false
            };

            stateManager
                .setActive(panelToClose)
                .then(() => stateManager.toggleDisplayPanel('sideSettings', {}, requester));
        }

        /**
         * Opens filters panel with data from the provided layer object.
         * @param  {Object} layer layer object whose data should be displayed.
         */
        function toggleLayerFiltersPanel(layer) {
            const requester = {
                id: layer.id,
                name: layer.name
            };

            // temporary data loading
            // FIXME: remove default ecogeo data once filters is disabled for layers with no attribs
            const newData = $timeout(() => {
                const attrs = geoService.layers[layer.id] && geoService.layers[layer.id].attribs ?
                    geoService.getFormattedAttributes(layer.id, geoService.layers[layer.id].attribs.indexes[0]) :
                    geoService.getFormattedAttributes('ecogeo', '0');

                return {
                    data: {
                        columns: attrs.columns.slice(0, ((angular.isNumber(layer.id) ? layer.id : 0) + 1) * 5),
                        data: attrs.data.slice(0, ((angular.isNumber(layer.id) ? layer.id : 0) + 1) * 50)
                    },
                    isLoaded: false
                };
            }, 0);

            stateManager.setActive({
                other: false
            });
            stateManager
                .setActive({
                    side: false
                })
                .then(() => stateManager.toggleDisplayPanel('filtersFulldata', newData, requester, 0));
        }

        /**
         * Opens metadata panel with data from the provided layer object.
         * // FIXME: generates some garbage text instead of proper metadata
         * @param  {Object} layer layer object whose data should be displayed.
         */
        function toggleMetadata(layer) {
            const requester = {
                id: layer.id
            };
            const panelToClose = {
                filters: false
            };

            // construct a temp promise which resolves when data is generated or retrieved;
            const dataPromise = $q(fulfill => {
                // check if metadata is cached
                if (layer.cache.metadata) {
                    fulfill(layer.cache.metadata);
                } else {
                    // TODO: generate some metadata to display functionality
                    const mdata = HolderIpsum.paragraphs(2, true);

                    // TODO: remove; simulating delay on retrieving metadata
                    $timeout(() => {
                        layer.cache.metadata = mdata;

                        fulfill(layer.cache.metadata);
                    }, Math.random() * 3000 + 300); // random delay
                }
            });

            stateManager
                .setActive(panelToClose)
                .then(() => stateManager.toggleDisplayPanel('sideMetadata', dataPromise, requester));
        }

        /**
         * Sets a watch on StateManager for layer data panels. When the requester is changed, calls changeContentState to dehighlight layer options and checks the state of the layer item itself (selected / not selected).
         *
         * @param  {String} panelName    name of the panel to watch as specified in the stateManager
         * @param  {String} displayName type of the display data (layer toggle name: 'settings', 'metadata', 'filters')
         */
        function watchPanelState(panelName, displayName) {
            // clear display on metadata, settings, and filters panels when closed
            $rootScope.$on('stateChangeComplete', (event, name, property, value) => {
                //console.log(name, property, value);
                if (property === 'active' && name === panelName && value === false) {
                    stateManager.clearDisplayPanel(panelName);
                }
            });

            $rootScope.$watch(() => stateManager.display[displayName].requester, (newRequester, oldRequester) => {
                if (newRequester !== null) {
                    // deselect layer from the old requester if layer ids don't match
                    if (oldRequester !== null && oldRequester.id !== newRequester.id) {
                        changeContentState(oldRequester.id, displayName, false);
                    }

                    // select the new layer
                    changeContentState(newRequester.id, displayName);
                } else if (oldRequester !== null) {
                    // deselect the old layer since the panel is closed as the newRequester is null
                    changeContentState(oldRequester.id, displayName, false);
                }
            });
        }

        /**
         * Changes the state of the specified layer content (metadata, settings, and filters) to the value provided. If any one of them is selected, the layer is considered selected as well and has a visual indicator of that.
         *
         * @param  {Integer} layerId     id of the layer whose data is displayed
         * @param  {String} displayName  type of the data displayed
         * @param  {Boolean} newValue    indicates whether the `displayName` display data is visible or not
         */
        function changeContentState(layerId, displayName, newValue = true) {
            let layer = findLayer(layerId);

            if (layer) {
                if (newValue) {
                    iterateLayers(service.data, layer => {
                        if (layer.id === layerId) {
                            return;
                        }

                        layer.selected = false;
                        Object.keys(layer.options)
                            .forEach(optionName => {
                                layer.options[optionName].selected = false;
                            });
                    });
                }

                // TODO: revise; maybe also store filters values here or something
                layer.options[displayName].selected = newValue; // select the toggle to stay visible

                // check if any toggle is selected; if so, select the layer
                let layerSelectedValue = Object.keys(layer.options)
                    .some(optionName => layer.options[optionName].selected);
                layer.selected = layerSelectedValue; // newValue; // change layer's selected state
            }
        }

        // sergei helper functions; should be handled by layer registry or something
        // TODO: replace
        function iterateLayers(group, func) {
            group.items.forEach((item, index) => {
                if (item.items === undefined) {
                    func(item, index, group);
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
