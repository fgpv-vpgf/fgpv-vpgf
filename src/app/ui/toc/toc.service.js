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

    function tocService() {
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
                                name: 'Layer Name 1',
                                layerType: 'feature',
                                id: 0,
                                legend: [
                                    {
                                        icon: 'url',
                                        name: 'something'
                                    }
                                ],
                                toggles: [
                                    'extra',
                                    'settings',
                                    'visibility',
                                ],
                                state: 'default',
                                flags: [
                                    'type',
                                    'table'
                                ]
                            },
                            {
                                type: 'layer',
                                name: 'Layer Name 2',
                                layerType: 'feature',
                                id: 3,
                                legend: [
                                    {
                                        icon: 'url',
                                        name: 'something'
                                    }
                                ],
                                toggles: [
                                    'extra',
                                    'settings',
                                    'visibility',
                                ],
                                state: 'default',
                                flags: [
                                    'type',
                                    'table'
                                ]
                            },
                            {
                                type: 'group',
                                name: 'Sample Subgroup',
                                id: 1,
                                expanded: true,
                                items: [
                                    {
                                        type: 'layer',
                                        name: 'Subgroup Layer Name 1',
                                        layerType: 'feature',
                                        id: 2,
                                        legend: [
                                            {
                                                icon: 'url',
                                                name: 'something'
                                            }
                                        ],
                                        toggles: [
                                            'extra',
                                            'settings',
                                            'visibility',
                                        ],
                                        state: 'default',
                                        flags: [
                                            'type',
                                            'table'
                                        ]
                                    }
                                ],
                                toggles: []
                            }
                        ],
                        toggles: [
                            'visibility'
                        ]
                    },
                    {
                        type: 'group',
                        name: 'Image Layers',
                        id: 1,
                        expanded: true,
                        items: [
                            {
                                type: 'layer',
                                name: 'Image Name 1',
                                layerType: 'feature',
                                id: 2,
                                legend: [
                                    {
                                        icon: 'url',
                                        name: 'something'
                                    }
                                ],
                                toggles: [
                                    'extra',
                                    'settings',
                                    'visibility',
                                ],
                                state: 'default',
                                flags: [
                                    'type',
                                    'table'
                                ]
                            }
                        ],
                        toggles: [
                            'visibility'
                        ]
                    }
                ]
            }, // config and bindable data

            // method called by the toggles and flags set on the layer item
            actions: {
                toggleGroupVisibility: toggleGroupVisibility
            },

            presets: null
        };

        // toc preset controls (toggles and flags displayed on the layer item)
        service.presets = {
            groupToggles: {
                visibility: {
                    action: service.actions.toggleGroupVisibility,
                    icon: 'visibility',
                    label: 'Toggle visibility',
                    tooltip: 'Group visibility tooltip'
                }
            },
            toggles: {
                metadata: {
                    icon: 'metadata',
                    label: 'Metadata',
                    tooltip: 'Metadata tooltip'
                },
                query: {
                    icon: 'query',
                    label: 'Toggle query',
                    tooltip: 'query tooltip'
                },
                settings: {
                    icon: 'settings',
                    label: 'Toggle settings',
                    tooltip: 'settings tooltip'
                },
                visibility: {
                    icon: 'visibility',
                    label: 'Toggle visibility',
                    tooltip: 'visibility tooltip'
                },
                zoom: {
                    icon: 'zoom',
                    label: 'Toggle zoom',
                    tooltip: 'zoom tooltip'
                },
                reload: {
                    icon: 'reload',
                    label: 'Toggle reload',
                    tooltip: 'reload tooltip'
                },
                remove: {
                    icon: 'remove',
                    label: 'Toggle remove',
                    tooltip: 'remove tooltip'
                }
            },
            flags: {
                type: {
                    icon: 'type',
                    label: 'Toggle type',
                    tooltip: 'type tooltip' // FIXME: change to function to generate tooltip
                },
                scale: {
                    icon: 'scale',
                    label: 'Toggle scale',
                    tooltip: 'scale tooltip'
                },
                table: {
                    icon: 'table',
                    label: 'Toggle table',
                    tooltip: 'table tooltip'
                },
                filter: {
                    icon: 'filter',
                    label: 'Toggle filter',
                    tooltip: 'filter tooltip'
                },
                user: {
                    icon: 'user',
                    label: 'Toggle user',
                    tooltip: 'user tooltip'
                }
            }
        };

        return service;

        /**
         * Toggles visibility of a group of layers.
         */
        function toggleGroupVisibility() {

        }
    }
})();
