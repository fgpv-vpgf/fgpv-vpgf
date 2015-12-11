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
     * __Some hardcoded sample config data.__
     *
     */
    angular
        .module('app.ui.toc')
        .factory('tocService', tocService);

    function tocService(stateManager, $mdDialog) {
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
                                name: 'Layer Name 1 Layer Name 1 Layer Name 1 Layer Name 1',
                                layerType: 'feature',
                                id: 0,
                                legend: [
                                    {
                                        icon: 'url',
                                        name: 'something'
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
                                legend: [
                                    {
                                        icon: 'url',
                                        name: 'something'
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
                                        legend: [
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
                                        legend: [
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
                                        legend: [
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
                                name: 'Layer Name 3',
                                layerType: 'feature',
                                id: 7,
                                legend: [
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
                                legend: [
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

            presets: null
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

        // FIXME: placeholder method for toggling settings panel
        function toggleSettings() {
            stateManager.set({ filters: false }, 'sideSettings');
        }

        // FIXME: placeholder method for toggling metadata panel
        function toggleMetadata() {
            stateManager.set({ filters: false }, 'sideMetadata');
        }

        // temp function to open layer groups
        function toggleLayerGroup(group) {
            console.log('toggle layer group', group.name);
            group.expanded = !group.expanded;
        }

        // temp function to "open" filters panel
        function toggleLayerFiltersPanel(layer) {
            console.log('toggle layer filter panel', layer.name);

            // TODO: open filters panel with this layer's data

            // fancy alert box for now
            $mdDialog.show(
                $mdDialog.alert()

                //.parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title('Imagine it\'s a "Filters panel"')
                .textContent('Here goes data from the ' + layer.name)
                .ariaLabel('Alert Dialog Demo')
                .ok('Got it!')
            );
        }
    }
})();
