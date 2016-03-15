/* global HolderIpsum */

(() => {
    'use strict';

    // mapping between layer option names and content display names
    const DISPLAY_SWITCH = {
        metadata: 'metadata',
        settings: 'settings',
        filters: 'data'
    };

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

    function tocService($timeout, $q, $rootScope, $mdToast, layoutService, stateManager,
        geoService, metadataService) {
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
                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                enabled: true
                            }
                        }
                    },
                    {
                        type: 'group',
                        name: 'Feature Layers',
                        id: 2,
                        expanded: true,
                        items: [
                            {
                                type: 'layer',
                                name: HolderIpsum.words(3, true),
                                layerType: 'esriFeature',
                                id: 3,
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
                                        value: 'on', // 'off', 'zoomIn', 'zoomOut'
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
                                id: 4,
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
                                        value: 'zoomIn', // 'off', 'zoomIn', 'zoomOut'
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
                                id: 5,
                                expanded: false,
                                items: [
                                    {
                                        type: 'layer',
                                        name: 'Layer Name 2 Layer Name 2 Layer Name 2 Layer Name 2',
                                        layerType: 'esriFeature',
                                        id: 6,
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
                                                value: 'zoomIn', // 'off', 'zoomIn', 'zoomOut'
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
                                        id: 7,
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
                                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
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
                                                value: 'off', // 'off', 'zoomIn', 'zoomOut'
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
                                        value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    }
                                }
                            },
                            {
                                type: 'layer',
                                name: HolderIpsum.words(3, true),
                                layerType: 'esriFeature',
                                id: 9,
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
                                        value: 'off', // 'off', 'zoomIn', 'zoomOut'
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
                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                enabled: true
                            }
                        }
                    },
                    {
                        type: 'group',
                        name: 'Image Layers',
                        id: 10,
                        expanded: false,
                        items: [
                            {
                                type: 'layer',
                                name: 'Survey of Radioactivity in Richmond Hill',
                                layerType: 'esriImage',
                                id: 11,
                                symbology: [
                                    {
                                        icon: 'url',
                                        name: 'Test Conducted'
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
                                        value: 'on', // 'off', 'zoomIn', 'zoomOut'
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
                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                enabled: true
                            }
                        }
                    },
                    {
                        type: 'group',
                        name: 'Crazy Nested Group',
                        id: 12,
                        expanded: false,
                        items: [
                            {
                                type: 'group',
                                name: 'Nested Level 2',
                                id: 13,
                                expanded: false,
                                items: [
                                    {
                                        type: 'group',
                                        name: 'Nested Level 3',
                                        id: 14,
                                        expanded: false,
                                        items: [
                                            {
                                                type: 'group',
                                                name: 'Nested Level 4',
                                                id: 15,
                                                expanded: false,
                                                items: [
                                                    {
                                                        type: 'group',
                                                        name: 'Nested Level 5',
                                                        id: 16,
                                                        expanded: false,
                                                        items: [
                                                            {
                                                                type: 'group',
                                                                name: 'Nested Level 6',
                                                                id: 17,
                                                                expanded: false,
                                                                items: [
                                                                    {
                                                                        type: 'group',
                                                                        name: 'Nested Level 7',
                                                                        id: 18,
                                                                        expanded: false,
                                                                        items: [
                                                                            {
                                                                                type: 'group',
                                                                                name: 'Nested Level 8',
                                                                                id: 19,
                                                                                expanded: false,
                                                                                items: [
                                                                                    {
                                                                                        type: 'group',
                                                                                        name: 'Nested Level 9',
                                                                                        id: 20,
                                                                                        expanded: false,
                                                                                        items: [
                                                                                            {
                                                                                                type: 'group',
                                                                                                name: 'Nested Level 10',
                                                                                                id: 21,
                                                                                                expanded: false,
                                                                                                items: [
                                                                                                    {
                                                                                                        type: 'layer',
                                                                                                        name: 'Lonely Layer',
                                                                                                        layerType: 'esriImage',
                                                                                                        id: 22,
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
                                                                                                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
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
                                                                                                        value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                                                                                        enabled: true
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        ],
                                                                                        options: {
                                                                                            visibility: {
                                                                                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                                                                                enabled: true
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                ],
                                                                                options: {
                                                                                    visibility: {
                                                                                        value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                                                                        enabled: true
                                                                                    }
                                                                                }
                                                                            }
                                                                        ],
                                                                        options: {
                                                                            visibility: {
                                                                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                                                                enabled: true
                                                                            }
                                                                        }
                                                                    }
                                                                ],
                                                                options: {
                                                                    visibility: {
                                                                        value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                                                        enabled: true
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                        options: {
                                                            visibility: {
                                                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                                                enabled: true
                                                            }
                                                        }
                                                    }
                                                ],
                                                options: {
                                                    visibility: {
                                                        value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                                        enabled: true
                                                    }
                                                }
                                            }
                                        ],
                                        options: {
                                            visibility: {
                                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                                enabled: true
                                            }
                                        }
                                    }
                                ],
                                options: {
                                    visibility: {
                                        value: 'on', // 'off', 'zoomIn', 'zoomOut'
                                        enabled: true
                                    }
                                }
                            }
                        ],
                        options: {
                            visibility: {
                                value: 'on', // 'off', 'zoomIn', 'zoomOut'
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
                    label: 'toc.label.toggleGroupViz',
                    tooltip: 'toc.tooltip.toggleGroupViz'
                }
            },
            options: {
                extra: {
                    icon: 'navigation:more_horiz',
                    label: 'toc.label.extraMenu',
                    tooltip: 'toc.tooltip.extraMenu'
                },
                metadata: {
                    icon: 'action:description',
                    label: 'toc.label.metadata',
                    tooltip: 'toc.tooltip.metadata',
                    action: toggleMetadata
                },
                query: {
                    icon: 'communication:location_on',
                    label: 'toc.label.query',
                    tooltip: 'toc.tooltip.query'
                },
                settings: {
                    icon: 'image:tune',
                    label: 'toc.label.settings',
                    tooltip: 'toc.tooltip.settings',
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
                        off: 'toc.label.visibility.off',
                        on: 'toc.label.visibility.on',
                        zoomIn: 'toc.label.visibility.zoomIn',
                        zoomOut: 'toc.label.visibility.zoomOut'
                    },
                    tooltip: {
                        off: 'toc.tooltip.visibility.off',
                        on: 'toc.tooltip.visibility.on',
                        zoomIn: 'toc.tooltip.visibility.zoomIn',
                        zoomOut: 'toc.tooltip.visibility.zoomOut'
                    },
                    action: toggleVisiblity
                },
                reload: {
                    icon: 'navigation:refresh',
                    label: 'toc.label.reload',
                    tooltip: 'toc.tooltip.reload'
                },
                remove: {
                    icon: 'action:delete',
                    label: 'toc.label.remove',
                    tooltip: 'toc.tooltip.remove',
                    action: removeLayer
                },
                filters: {
                    icon: '',
                    label: 'toc.label.filters',
                    tooltip: 'toc.tooltip.filters'
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
                        esriFeature: 'toc.label.flag.feature',
                        esriDynamic: 'toc.label.flag.dynamic',
                        ogcWms: 'toc.label.flag.wms',
                        esriImage: 'toc.label.flag.image'
                    },
                    tooltip: {
                        esriFeature: 'toc.tooltip.flag.feature',
                        esriDynamic: 'toc.tooltip.flag.dynamic',
                        ogcWms: 'toc.tooltip.flag.wms',
                        esriImage: 'toc.tooltip.flag.image'
                    }
                },
                scale: {
                    icon: 'action:info',
                    label: 'toc.label.flag.scale',
                    tooltip: 'toc.tooltip.flag.scale'
                },
                data: {
                    icon: {
                        table: 'community:table-large',
                        filter: 'community:filter'
                    },
                    label: {
                        table: 'toc.label.flag.data.table',
                        filter: 'toc.label.flag.data.filter'
                    },
                    tooltip: {
                        table: 'toc.tooltip.flag.data.table',
                        filter: 'toc.tooltip.flag.data.filter'
                    }
                },
                query: {
                    icon: 'community:map-marker-off',
                    label: 'toc.label.flag.query',
                    tooltip: 'toc.tooltip.flag.query'
                },
                user: {
                    icon: 'social:person',
                    label: 'toc.label.flag.user',
                    tooltip: 'toc.tooltip.flag.user'
                }
            },
            state: {
                icon: {
                    error: 'alert:error',
                    reloading: 'navigation:refresh'
                },
                label: {
                    error: 'toc.label.state.error',
                    reloading: 'toc.label.state.loading'
                },
                tooltip: {
                    error: 'toc.tooltip.state.error',
                    reloading: 'toc.tooltip.state.loading'
                }
            }
        };

        // jscs:enable maximumLineLength

        // set layer control defaults
        // TODO: should be done when parsing config file
        // initLayers(service.data.items);

        // remove
        /* $timeout(() => {
            console.info(geoService);
            service.data.items[0].items = geoService.legend.map(id => {
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

            // console.log('--->', service.data.items[0]);
        }, 7000); // FIXME: wait for layer to be added to the layer registry; this will not be needed as we are going to bind directly to layer/legend construction from geoService; this is needed right now to keep the fake layers in the layer selector as well.
        */

        // set state change watches on metadata, settings and filters panel
        watchPanelState('sideMetadata', 'metadata');
        watchPanelState('sideSettings', 'settings');
        watchPanelState('filtersFulldata', 'filters');

        return service;

        // FIXME: updating config layer objects with default values for options and flags
        // this should be done when applying defaults to the config file
        // items is an array
        /*function initLayers(items) {
            // jshint forin: false /

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
        }*/

        /**
         * Simple function to remove layers.
         * TODO: needs more work to handle dynamic layer and other crazy stuff
         * TODO: need to consider what happens when removing the only layer in the group; remove the group as well? etc.
         * Hides the layer data and removes the node from the layer selector; removes the layer from
         * @param  {Object} layer layerItem object from the layer selector
         */
        function removeLayer(layer) {
            let layerGroup;
            let layerIndex;
            let layerOriginalVisibility = layer.options.visibility.value;

            // find where the layer is in layer selector
            iterateLayers(geoService.legend, (item, index, group) => {
                if (item.id === layer.id && index !== -1) {
                    layerGroup = group;
                    layerIndex = index;
                }
            });

            // console.log(layerGroup, layerIndex);

            // pretend we removed the layer by setting it's visibility to off and remove it from the layer selector
            layerGroup.items.splice(layerIndex, 1);
            toggleVisiblity(layer, 'off');

            // create notification toast
            const undoToast = $mdToast.simple()
                .textContent('Layer removed') // TODO: translate
                .action('undo') // TODO: translate
                .highlightAction(true)
                .parent(layoutService.panes.toc)
                .position('bottom rv-flex');

            $mdToast.show(undoToast)
                .then(response => {
                    if (response === 'ok') { // promise resolves with 'ok' when user clicks 'undo'
                        // restore layer visibility on undo; and add it back to layer selector
                        layerGroup.items.splice(layerIndex, 0, layer);

                        // restore original visibility, so if he removed and restored already invisible layer,
                        // it is restored also invisible
                        toggleVisiblity(layer, layerOriginalVisibility);
                    } else {
                        // remove layer for real now
                        geoService.removeLayer(layer.id);
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
        // TODO: rename to something like `setVisibility` to make it clearer what this does
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

            // wait for attributes to be loaded, then process them into grid format
            const dataPromise = geoService.layers[layer.id].attribs.then(attribBundle => {
                let layerId = layer.id;
                let layerIdx;

                // FIXME: remove default ecogeo data once filters is disabled for layers with no attribs.
                //        can get rid of the layerId and layerIdx vars to (they are used to support the hack)
                if (attribBundle.indexes.length === 0) {
                    layerId = 'ecogeo';
                    layerIdx = '0';
                } else {
                    // FIXME once the TOC has layer indexes assigned to its elements, and available to
                    //       the button that triggers the grid view, we should be using that.  for now,
                    //       hack by grabbing the first index available (.indexes[0])
                    layerIdx = attribBundle.indexes[0];
                }

                return geoService.getFormattedAttributes(layerId, layerIdx);
            }).then(attrs => {
                return {
                    data: {
                        // TODO remove .isNumber stuff once proper table support is completed
                        columns: attrs.columns.slice(0, ((angular.isNumber(layer.id) ? layer.id : 0) + 1) *
                            5),
                        data: attrs.data.slice(0, ((angular.isNumber(layer.id) ? layer.id : 0) + 1) * 50),

                        // FIXME: this after dynamic layer index gets refactored to proper separate layers
                        featureIndex: '0'
                    },
                    isLoaded: false
                };
            });

            stateManager.setActive({
                other: false
            });
            stateManager
                .setActive({
                    side: false
                })
                .then(() => stateManager.toggleDisplayPanel('filtersFulldata', dataPromise, requester, 0));
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

                    if (layer.metadataUrl) {
                        const xmlUrl = layer.metadataUrl;

                        // TODO: xsl should come from service constant? or is this layer specific
                        // following is a test xsl from RAMP, should be updated for FGPV
                        const xslUrl = 'http://ramp-pcar.github.io/demos/NRSTC/v5.4.2/ramp-pcar/' +
                            'assets/metadata/xstyle_default_en.xsl';

                        // transform xml
                        metadataService.transformXML(xmlUrl, xslUrl).then(mdata => {

                            // result is wrapped in an array due to previous setup
                            // TODO: chagee the following when changing associated directive service
                            layer.cache.metadata = [mdata[0].innerText];
                            fulfill(layer.cache.metadata);
                        });
                    } else {
                        // TODO: generate some metadata to display functionality
                        const mdata = HolderIpsum.paragraphs(2, true);

                        // TODO: remove; simulating delay on retrieving metadata
                        $timeout(() => {
                            layer.cache.metadata = mdata;

                            fulfill(layer.cache.metadata);
                        }, Math.random() * 3000 + 300); // random delay
                    }

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
                // console.log(name, property, value);
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
            const layer = findLayer(layerId);
            const optionName = DISPLAY_SWITCH[displayName];

            if (layer) {
                if (newValue) {
                    iterateLayers(service.data, layer => {
                        if (layer.id === layerId) {
                            return;
                        }

                        layer.selected = false;

                        Object.entries(DISPLAY_SWITCH).forEach(([key, value]) => layer.options[value].selected = false);
                    });
                }

                // TODO: revise; maybe also store filters values here or something
                layer.options[optionName].selected = newValue; // select the toggle to stay visible

                // check if any toggle is selected; if so, select the layer
                let layerSelectedValue = Object.keys(DISPLAY_SWITCH)
                    .some(key => {
                        const value = DISPLAY_SWITCH[key];
                        return layer.options[value].selected;
                    });

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
