/* global RV */
(() => {
    'use strict';

    /**
     * @module tocService
     * @memberof app.ui
     *
     * @description
     * The `tocService` service provides bindable layer data to the `TocController`'s template.
     *
     *
     */
    angular
        .module('app.ui.toc')
        .factory('tocService', tocService);

    // jshint maxparams:14
    function tocService($q, $rootScope, $mdToast, $translate, layoutService, stateManager,
        geoService, metadataService, errorService, debounceService, $timeout, LegendBlock, configService) {

        const service = {
            // method called by the options and flags set on the layer item
            actions: {
                toggleLayerGroup,
                toggleLayerFiltersPanel
            },

            toggleSettings,
            toggleMetadata,
            toggleLayerFiltersPanel
        };

        // toc preset controls (options and flags displayed on the layer item)
        // TODO: move presets to a constant service
        service.presets = {
            groupOptions: {
                visibility: {
                    action: null,
                    icon: vis => `action:visibility${vis ? '' : '_off'}`,
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
                    icon: vis => `action:visibility${vis ? '' : '_off'}`,
                    label: vis => `toc.label.visibility.${vis ? 'on' : 'off'}`,
                    tooltip: vis => `toc.tooltip.visibility.${vis ? 'on' : 'off'}`,
                    action: toggleVisiblity
                },
                offscale: {
                    icon: zoom => `action:zoom_${zoom ? 'in' : 'out'}`,
                    label: zoom => `toc.label.visibility.zoom${zoom ? 'In' : 'Out'}`,
                    tooltip: zoom => `toc.tooltip.visibility.zoom${zoom ? 'In' : 'Out'}`,
                    action: zoomLayerScale
                },
                reload: {
                    icon: 'navigation:refresh',
                    label: 'toc.label.reload',
                    tooltip: 'toc.tooltip.reload',
                    action: entry => geoService.reloadLayer(entry)
                },
                boundaryZoom: {
                    icon: `action:zoom_in`,
                    label: 'toc.label.boundaryZoom',
                    tooltip: 'toc.tooltip.boundaryZoom',
                    action: zoomToBoundary
                },
                data: {
                    icon: `community:table-large`,
                    label: 'toc.label.dataTable',
                    tooltip: 'toc.label.dataTable',
                    action: service.actions.toggleLayerFiltersPanel
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
                },
                reorder: {
                    icon: 'editor:drag_handle',
                    label: 'toc.tooltip.reorder',
                    tooltip: 'toc.tooltip.reorder'
                },
                symbologyStack: {
                    icon: 'maps:layers',
                    label: 'toc.menu.symbology',
                    tooltip: 'toc.menu.symbology',
                    action: entry => {
                        entry.toggleSymbology();
                        entry.wiggleSymbology();
                    }
                }
            },
            flags: {
                type: {
                    icon: {
                        esriFeature: type => ({
                            esriGeometryPoint: 'community:vector-point',
                            esriGeometryPolygon: 'community:vector-polygon',
                            esriGeometryPolyline: 'community:vector-polyline'
                        }[type]),
                        esriDynamic: 'action:settings',
                        esriDynamicLayerEntry: 'image:photo',
                        ogcWms: 'image:photo',
                        ogcWmsLayerEntry: 'image:photo',
                        esriImage: 'image:photo',
                        esriTile: 'image:photo'
                    },
                    label: {
                        esriFeature: 'toc.label.flag.feature',
                        esriDynamic: 'toc.label.flag.dynamic',
                        esriDynamicLayerEntry: 'toc.label.flag.dynamic',
                        ogcWms: 'toc.label.flag.wms',
                        ogcWmsLayerEntry: 'toc.label.flag.wms',
                        esriImage: 'toc.label.flag.image',
                        esriTile: 'toc.label.flag.tile'
                    },
                    tooltip: {
                        esriFeature: 'toc.tooltip.flag.feature',
                        esriDynamic: 'toc.tooltip.flag.dynamic',
                        esriDynamicLayerEntry: 'toc.tooltip.flag.dynamic',
                        ogcWms: 'toc.tooltip.flag.wms',
                        ogcWmsLayerEntry: 'toc.tooltip.flag.wms',
                        esriImage: 'toc.tooltip.flag.image',
                        esriTile: 'toc.label.flag.tile'
                    }
                },
                scale: {
                    icon: 'maps:layers_clear',
                    label: 'toc.label.flag.scale',
                    tooltip: 'toc.tooltip.flag.scale'
                },
                data: {
                    icon: 'community:table-large',
                    label: 'toc.label.flag.data.table',
                    tooltip: 'toc.tooltip.flag.data.table'
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
                },
                filter: {
                    icon: 'community:filter',
                    label: 'toc.label.flag.filter',
                    tooltip: 'toc.tooltip.flag.filter'
                },
                wrongprojection: {
                    icon: 'alert:warning',
                    label: 'toc.label.flag.wrongprojection',
                    tooltip: 'toc.tooltip.flag.wrongprojection'
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

        // let symbologySample;

        /* jshint ignore:start */
        // jscs:disable
        // symbologySample = [{'name':'0', 'svgcode':'<svg id=\'SvgjsSvg1081\' width=\'32\' height=\'32\' xmlns=\'http://www.w3.org/2000/svg\' version=\'1.1\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' xmlns:svgjs=\'http://svgjs.com/svgjs\' viewBox=\'0 0 32 32\'><defs id=\'SvgjsDefs1082\'></defs><path id=\'SvgjsPath1083\' d=\'M19.5 16L16 12.5L12.5 16L16 19.5Z \' fill-opacity=\'1\' fill=\'#dcdcdc\' stroke-miterlimit=\'4\' stroke-linejoin=\'miter\' stroke-linecap=\'square\' stroke-opacity=\'1\' stroke=\'#828282\' stroke-width=\'1\' transform=\'matrix(1, 0, 0, 1, 0, 0)\'></path></svg>'}, {'name':'1', 'svgcode':'<svg id=\'SvgjsSvg1084\' width=\'32\' height=\'32\' xmlns=\'http://www.w3.org/2000/svg\' version=\'1.1\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' xmlns:svgjs=\'http://svgjs.com/svgjs\' viewBox=\'0 0 32 32\'><defs id=\'SvgjsDefs1085\'></defs><path id=\'SvgjsPath1086\' d=\'M20 16L16 12L12 16L16 20Z \' fill-opacity=\'1\' fill=\'#00617f\' stroke-miterlimit=\'4\' stroke-linejoin=\'miter\' stroke-linecap=\'square\' stroke-opacity=\'1\' stroke=\'#828282\' stroke-width=\'1\' transform=\'matrix(1, 0, 0, 1, 0, 0)\'></path></svg>'}, {'name':'2', 'svgcode':'<svg id=\'SvgjsSvg1087\' width=\'32\' height=\'32\' xmlns=\'http://www.w3.org/2000/svg\' version=\'1.1\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' xmlns:svgjs=\'http://svgjs.com/svgjs\' viewBox=\'0 0 32 32\'><defs id=\'SvgjsDefs1088\'></defs><path id=\'SvgjsPath1089\' d=\'M21 16L16 11L11 16L16 21Z \' fill-opacity=\'1\' fill=\'#24b24b\' stroke-miterlimit=\'4\' stroke-linejoin=\'miter\' stroke-linecap=\'square\' stroke-opacity=\'1\' stroke=\'#828282\' stroke-width=\'1\' transform=\'matrix(1, 0, 0, 1, 0, 0)\'></path></svg>'}, {'name':'3', 'svgcode':'<svg id=\'SvgjsSvg1090\' width=\'32\' height=\'32\' xmlns=\'http://www.w3.org/2000/svg\' version=\'1.1\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' xmlns:svgjs=\'http://svgjs.com/svgjs\' viewBox=\'0 0 32 32\'><defs id=\'SvgjsDefs1091\'></defs><path id=\'SvgjsPath1092\' d=\'M22 16L16 10L10 16L16 22Z \' fill-opacity=\'1\' fill=\'#ffc816\' stroke-miterlimit=\'4\' stroke-linejoin=\'miter\' stroke-linecap=\'square\' stroke-opacity=\'1\' stroke=\'#828282\' stroke-width=\'1\' transform=\'matrix(1, 0, 0, 1, 0, 0)\'></path></svg>'}, {'name':'4', 'svgcode':'<svg id=\'SvgjsSvg1093\' width=\'32\' height=\'32\' xmlns=\'http://www.w3.org/2000/svg\' version=\'1.1\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' xmlns:svgjs=\'http://svgjs.com/svgjs\' viewBox=\'0 0 32 32\'><defs id=\'SvgjsDefs1094\'></defs><path id=\'SvgjsPath1095\' d=\'M23 16L16 9L9 16L16 23Z \' fill-opacity=\'1\' fill=\'#c86800\' stroke-miterlimit=\'4\' stroke-linejoin=\'miter\' stroke-linecap=\'square\' stroke-opacity=\'1\' stroke=\'#828282\' stroke-width=\'1\' transform=\'matrix(1, 0, 0, 1, 0, 0)\'></path></svg>'}, {'name':'5', 'svgcode':'<svg id=\'SvgjsSvg1096\' width=\'32\' height=\'32\' xmlns=\'http://www.w3.org/2000/svg\' version=\'1.1\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' xmlns:svgjs=\'http://svgjs.com/svgjs\' viewBox=\'0 0 32 32\'><defs id=\'SvgjsDefs1097\'></defs><path id=\'SvgjsPath1098\' d=\'M25 16L16 7L7 16L16 25Z \' fill-opacity=\'1\' fill=\'#d4000b\' stroke-miterlimit=\'4\' stroke-linejoin=\'miter\' stroke-linecap=\'square\' stroke-opacity=\'1\' stroke=\'#828282\' stroke-width=\'1\' transform=\'matrix(1, 0, 0, 1, 0, 0)\'></path></svg>'}]; // jshint ignore:line
        /* jshint ignore:end */

        // jscs:disable maximumLineLength
        /*let config = [
            [makeLegendNode, 'Layer Node - Bu Warker|esriFeature|esriGeometryPolygon|7252'],
            [makeLegendNode, 'Layer Node - Kru Lin Craw|esriDynamic|esriGeometryPoint|1'],
            [makeLegendSet, 'Visibiilty set',
                [
                    [makeLegendNode, 'Set Option 1 - Glukity Glu|esriDynamic|esriGeometryPoint|33'],
                    [makeLegendNode, 'Set Option 2 - GNU is not Unit|esriDynamic|esriGeometryPoint|33'],
                    [makeLegendGroup, 'Legend Group node - Simu',
                        [
                            [makeLegendNode, 'Layer Node - Angler Fast|esriDynamic|esriGeometryPoint|33'],
                            [makeInfoSection, 'Wilson Push|title'],
                            [makeInfoSection, 'Push Push are a rock band formed in the 1990s from Auckland, New Zealand. They are best known for their single Trippin|text'],
                            [makeLegendSet, 'Visibiilty set',
                                [
                                    [makeLegendNode, 'Sub Set Option 1 - Glukity Glu|esriDynamic|esriGeometryPoint|33'],
                                    [makeLegendNode, 'Sub Set Option 2 - GNU is not Unit|esriDynamic|esriGeometryPoint|33']
                                ]
                            ]
                        ],
                        [makeLegendNode, 'Set Option 3 - Lost laptop|esriDynamic|esriGeometryPoint|33']
                    ],
                    [makeLegendNode, 'Set Option 4 - GNU is not Unit|esriDynamic|esriGeometryPoint|33']
                ]],
            [makeLegendGroup, 'Legend Group node - Simu',
                [
                    [makeLegendNode, 'Layer Node - Angler Fast|esriDynamic|esriGeometryPoint|33'],
                    [makeInfoSection, 'Wilson Push|title'],
                    [makeInfoSection, 'Push Push are a rock band formed in the 1990s from Auckland, New Zealand. They are best known for their single Trippin|text'],
                    [makeInfoSection, 'https://d13yacurqjgara.cloudfront.net/users/355650/screenshots/2181500/unicorn_drib_v2.gif|image'],
                    [makeLegendNode, 'Layer Node - Coppe Bash|esriDynamic|esriGeometryPoint|53']
                ]]
        ];*/

        /*
        class LayerRecordInterface {
            /**
             * @param {Object} layerRecord
             * @param {Array} availableControls [optional=[]] an array or controls names that are displayed inside the legendEntry
             * @param {Array} disabledControls [optional=[]] an array or controls names that are disabled and cannot be interacted wiht by a user
             */
            /*constructor (layerRecord, availableControls = [], disabledControls = []) {
                this._layerRecord = layerRecord;
                this._availableControls = availableControls;
                this._disabledControls = disabledControls;

                this._state = 'loading';

                this._symbologyRenderStyle = Math.random() > 0.5 ? 'images' : 'icons';

                this._isRefreshing = true;
                this._isRefreshingHandle = null;
            }

            // these expose ui controls available on the interface and indicate which ones are disabled
            get availableControls () { return this._availableControls; }
            get disabledControls () { return this._disabledControls; }

            get symbology () {
                return {
                    stack: symbologySample,
                    renderStyle: this._symbologyRenderStyle
                };
            }

            // _state = LayerRecordInterface.states.loading;
            get state () {
                return this._state;

            } // returns 'loading', 'loaded', 'error'
            get isRefreshing () {
                /*if (!this._isRefreshingHandle) {
                    this._isRefreshingHandle = $timeout(() => {
                        this._isRefreshing = !this._isRefreshing;
                        this._isRefreshingHandle = null;
                    }, Math.random() * 16000);
                }*/

                //return this._isRefreshing;
            //} // returns true/false

            // can be group or node name
            /*get name ()  {          return 'throw new Error(`Call not supported.`);'; }

            // these are needed for the type flag
            get layerType () {      throw new Error(`Call not supported.`); }
            get geometryType () {   throw new Error(`Call not supported.`); }
            get featureCount () {   throw new Error(`Call not supported.`); }

            // fetches attributes for use in the datatable
            get formattedAttributes () { throw new Error(`Call not supported.`); }

            get infoType () {       throw new Error(`Call not supported.`); }
            get infoContent () {    throw new Error(`Call not supported.`); }

            // these return the current values of the corresponding controls
            get visibility () {      return this._visibility; }
            get opacity () {         throw new Error(`Call not supported.`); }
            get boundingBox () {     throw new Error(`Call not supported.`); }
            get query () {           throw new Error(`Call not supported.`); }
            get snapshot () {        throw new Error(`Call not supported.`); }

            // these set values to the corresponding controls
            setVisibility (value) {  this._visibility = value; }
            setOpacity () {          throw new Error(`Call not supported.`); }
            setBoundingBox () {      throw new Error(`Call not supported.`); }
            setQuery () {            throw new Error(`Call not supported.`); }
            setSnapshot () {         throw new Error(`Call not supported.`); }
        }

        let idcounter = 0;

        /* service.secondToc = {
            entries: config.map(item => {
                return item[0](item[1], item[2]);
            })
        }; */

        /*function makeLegendNode(stringConfig) {
            const parts = stringConfig.split('|');
            const co = new LayerRecordInterface({},
                ['visibility', 'opacity', 'boundingBox', 'data', 'query', 'snapshot', 'metadata', 'boundaryZoom',
                    'refresh', 'reload', 'remove', 'settings', 'symbology'],
                ['settings']);

            Object.defineProperty(co, 'name', {
                get: function () { return parts[0]; }
            });

            Object.defineProperty(co, 'layerType', {
                get: function () { return parts[1]; }
            });

            Object.defineProperty(co, 'geometryType', {
                get: function () { return parts[2]; }
            });

            Object.defineProperty(co, 'featureCount', {
                get: function () { return parts[3]; }
            });

            const ln = new LegendBlock.Node(co, idcounter++);

            $timeout(() => {
                co._state = 'loaded';
                co._isRefreshing = false;
            }, Math.random() * 10000 + 2000);

            return ln;
        }

        function makeInfoSection(stringConfig) {
            const parts = stringConfig.split('|');
            const co = new LayerRecordInterface({},
                ['visibility', 'opacity', 'boundingBox', 'query', 'snapshot', 'metadata', 'boundaryZoom',
                    'refresh', 'reload', 'remove', 'settings'],
                ['settings']);

            Object.defineProperty(co, 'infoType', {
                get: function () { return parts[1]; }
            });

            Object.defineProperty(co, 'infoContent', {
                get: function () { return parts[0]; }
            });

            const li = new LegendBlock.Info(co, idcounter++);
            return li;
        }

        function makeLegendGroup(stringConfig, items) {
            const parts = stringConfig.split('|');
            const co = new LayerRecordInterface({},
                ['visibility', 'opacity', 'boundingBox', 'query', 'snapshot', 'metadata', 'boundaryZoom',
                    'refresh', 'reload', 'remove', 'settings'],
                ['settings']);

            Object.defineProperty(co, 'name', {
                get: function () { return parts[0]; }
            });

            const lg = new LegendBlock.Group(co, idcounter++);

            $timeout(() => {
                items.forEach(item => {
                    const newEntry = item[0](item[1], item[2]);
                    newEntry._layerProxy._state = 'loaded';
                    newEntry._layerProxy._isRefreshing = false;

                    lg.addEntry(newEntry);
                });

                co._state = 'loaded';
                co._isRefreshing = false;

                /*$timeout(() => {
                    // this._state = 'error'
                }, Math.random() * 10000 + 2000);*/

            /*}, Math.random() * 20000 + 2000);

            return lg;
        }

        function makeLegendSet(stringConfig, items) {
            const parts = stringConfig.split('|');
            // visibility sets eat fake interfaces
            const co = new LayerRecordInterface({},
                ['visibility', 'opacity', 'boundingBox', 'query', 'snapshot', 'metadata', 'boundaryZoom',
                    'refresh', 'reload', 'remove', 'settings'],
                ['settings']);

            Object.defineProperty(co, 'name', {
                get: function () { return parts[0]; }
            });

            const ls = new LegendBlock.Set(co, idcounter++);

            items.forEach(item => {
                const newEntry = item[0](item[1], item[2]);

                ls.addEntry(newEntry);
            });

            co._state = 'loaded';
            co._isRefreshing = false;

            return ls;
        }

        /*
        const co1 = new LayerRecordInterface({},
            ['visibility', 'opacity', 'boundingBox', 'query', 'snapshot', 'metadata', 'boundaryZoom',
                'refresh', 'reload', 'remove', 'settings'],
            ['settings']);

        Object.defineProperty(co1, 'visibility', {
            get: function () { return false; }
        });

        Object.defineProperty(co1, 'name', {
            get: function () { return 'Layer Node - Bu Warker'; }
        });

        Object.defineProperty(co1, 'layerType', {
            get: function () { return 'esriFeature'; }
        });

        Object.defineProperty(co1, 'geometryType', {
            get: function () { return 'esriGeometryPolygon'; }
        });

        Object.defineProperty(co1, 'featureCount', {
            get: function () { return 7252; }
        });

        //

        const le1 = new LegendBlock.Node(co1, 'blha');

        const co2 = new LayerRecordInterface({},
            ['visibility', 'opacity', 'data', 'boundingBox', 'query', 'snapshot', 'metadata', 'boundaryZoom',
                'refresh', 'reload', 'remove', 'settings'],
            ['visibility']);

        Object.defineProperty(co2, 'visibility', {
            get: function () { return true; }
        });

        Object.defineProperty(co2, 'name', {
            get: function () { return 'Layer Node - Kru Lin Craw'; }
        });

        Object.defineProperty(co2, 'layerType', {
            get: function () { return 'esriDynamic'; }
        });

        Object.defineProperty(co2, 'geometryType', {
            get: function () { return 'esriGeometryPoint'; }
        });

        Object.defineProperty(co2, 'featureCount', {
            get: function () { return 1; }
        });

        const le2 = new LegendBlock.Node(co2, 'foobar');

        service.secondToc2 = {
            items: [
                le1,
                le2
            ]
        };*/

        /* -------- */

        // const selectedLayerLog = {};

        let errorToast;

        // debounce toggle filter function
        const debToggleFilter = debounceService.registerDebounce(debToggleLayerFiltersPanel);

        // set state change watches on metadata, settings and filters panel
        watchPanelState('sideMetadata', 'metadata');
        watchPanelState('sideSettings', 'settings');
        watchPanelState('filtersFulldata', 'filters');

        return service;

        /**
         * Simple function to remove layers.
         * Hides the layer data and removes the node from the layer selector; removes the layer from
         * @function removeLayer
         * @param  {Object} entry layerItem object from the `legendService`
         */
        // eslint-disable-next-line complexity
        function removeLayer(entry) {
            const isEntryVisible = entry.getVisibility();
            const entryParent = entry.parent;

            // close Settings or Metadata panel if displayed
            const isSettingsVisible = stateManager.display.settings.data !== null ? true : false;

            // if Metadata is loading the panel will be visible
            // but isMetadataDisplay will still have value set to false until content is displayed
            const isMetadataDisplay = stateManager.display.metadata.data !== null ? true : false;
            const isMetadataLoading = stateManager.display.metadata.isLoading;
            const isMetadataVisible = isMetadataDisplay || isMetadataLoading;

            if (isMetadataVisible) {
                toggleMetadata(entry, isMetadataVisible);
            } else if (isSettingsVisible) {
                toggleSettings(entry);
            }

            // pretend we removed the layer by setting it's visibility to off and remove it from the layer selector
            entry.setVisibility(false);
            const entryPosition = entryParent.remove(entry);

            // create notification toast
            const undoToast = $mdToast.simple()
                .textContent($translate.instant('toc.label.state.remove'))
                .action($translate.instant('toc.label.action.remove'))
                .parent(layoutService.panes.toc)
                .position('bottom rv-flex');

            // function to avoid cyclomatic check
            const markRecDeleted = (entry, flag) => {
                if (entry._layerRecord) {
                    entry._layerRecord.deleted = flag;
                }
            };

            entry.removed = true;
            markRecDeleted(entry, true);

            // if filters is open, close it at the same time we remove the layer
            const smRequest = stateManager.display.filters.requester;
            const isFilterOpen = (smRequest !== null && smRequest.id === entry.id) ? true : false;
            if (isFilterOpen) {
                stateManager.setActive({ filtersFulldata: false });
            }

            $mdToast.show(undoToast)
                .then(response => {
                    if (response === 'ok') { // promise resolves with 'ok' when user clicks 'undo'
                        // restore layer visibility on undo; and add it back to layer selector
                        entryParent.add(entry, entryPosition);

                        // restore filters or Metadata or Settings if one of them was opened it was open
                        if (isFilterOpen) {
                            toggleLayerFiltersPanel(entry);
                        } else if (isMetadataVisible) {
                            toggleMetadata(entry, !isMetadataVisible);
                        } else if (isSettingsVisible) {
                            toggleSettings(entry);
                        }

                        // restore original visibility, so if he removed and restored already invisible layer,
                        // it is restored also invisible
                        entry.setVisibility(isEntryVisible);
                        entry.removed = false;
                        markRecDeleted(entry, false);
                    } else {
                        if (entry.type !== 'placeholder') {
                            // remove layer for real now
                            geoService.removeLayer(entry.id);
                        }
                    }
                });
        }

        // TODO: rename to something like `setVisibility` to make it clearer what this does
        // if 'value' is not specified, toggle
        function toggleVisiblity(tocEntry, value) {
            RV.logger.log('tocService', `toggle visiblity of layer with name ${tocEntry.name}`);
            tocEntry.setVisibility(value);

            // hide bounding box only when visibility is hidden
            // TODO: move to the LayerRecord class when LayerRecord is moved into geoapi
            if (tocEntry.options.boundingBox && !tocEntry.options.visibility.value) {
                tocEntry.options.boundingBox.value = false;
                geoService.setBboxState(tocEntry, false);
            }
        }

        /**
        * Zoom to layer visibility scale and set layer visible
        * @private
        * @function zoomLayerScale
        * @param {Object} entry layer object to zoom to scale to.
        */
        function zoomLayerScale(entry) {
            // zoom to layer visibility scale
            geoService.zoomToScale(entry, entry.options.offscale.value);

            // set the layer visible
            toggleVisiblity(entry, true);
        }

        /**
        * Zoom to bounding box of a layer (wrapper function to the same function in layerRegistry)
        * @function zoomToBoundary
        * @param {Object} legendEntry layer entry in the legend
        */
        function zoomToBoundary(legendEntry) {
            geoService.zoomToBoundary(legendEntry.id);
        }

        // temp function to open layer groups
        function toggleLayerGroup(group) {
            RV.logger.log('tocService', `toggle layer group with name ${group.name}`);
            group.expanded = !group.expanded;
        }

        /**
         * Opens settings panel with settings from the provided legendBlock object.
         * @function toggleSettings
         * @param  {LegendBlock} legendBlock legendBlock object whose settings should be opened.
         */
        function toggleSettings(legendBlock) {
            const requester = {
                id: legendBlock.id,
                name: legendBlock.name
            };

            const panelToClose = {
                filters: false
            };

            stateManager
                .setActive(panelToClose)
                .then(() => stateManager.toggleDisplayPanel('sideSettings', legendBlock, requester));
        }

        /**
         * Opens filters panel with data from the provided layer object (debounce).
         * @function toggleLayerFiltersPanel
         * @param  {Object} entry layer object whose data should be displayed.
         * @private
         */
        function debToggleLayerFiltersPanel(entry) {
            const requester = {
                id: entry.id,
                name: entry.name,
                layerId: (entry.master ? entry.master : entry).id,
                legendEntry: entry
            };

            const layerRecord = geoService.layers[requester.layerId];
            const dataPromise = layerRecord.getAttributes(entry.featureIdx)
                .then(attributes => {
                    const rvSymbolColumnName = 'rvSymbol';

                    // TODO: formatLayerAttributes function should figure out icon and store it in the attribute bundle
                    // ideally, this should go into the `formatAttributes` function in layer-record.class, but we are trying to keep as loosely bound as possible to be moved later to geoApi and this uses geoService.retrieveSymbol
                    // add symbol as the first column
                    // check if the symbol column already exists
                    if (!attributes.columns.find(({ data }) => data === rvSymbolColumnName)) {

                        attributes.rows.forEach(row => {
                            row.rvSymbol = geoService.retrieveSymbol(row, attributes.renderer);
                            row.rvInteractive = '';
                        });

                        // add a column for interactive actions (detail and zoom)
                        // do not add it inside an existing field because filters will not work properly and because of https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1631
                        attributes.columns.unshift({
                            data: 'rvInteractive',
                            title: '',
                            orderable: false,
                            render: '',
                            width: '20px' // for datatables
                        });

                        // add a column for symbols
                        attributes.columns.unshift({
                            data: rvSymbolColumnName,
                            title: '',
                            orderable: false,
                            render: data => `<div class="rv-wrapper rv-symbol">${data}</div>`,
                            width: '20px' // for datatables
                        });
                    }

                    return {
                        data: attributes,
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
                .then(() => {
                    if (errorToast) {
                        errorService.remove();
                    }
                    return stateManager.toggleDisplayPanel('filtersFulldata', dataPromise, requester, 0);
                })
                .catch(() => {
                    errorToast = errorService.display($translate.instant('toc.error.resource.loadfailed'),
                        layoutService.panes.filter);
                });
        }


        function toggleLayerFiltersPanel(legendBlock) {
            const requester = {
                id: legendBlock.id,
                name: legendBlock.name,
                layerId: legendBlock.id, //(entry.master ? entry.master : entry).id,
                legendEntry: legendBlock
            };

            // const layerRecord = geoService.layers[requester.layerId];
            const dataPromise = legendBlock.formattedData
                .then(attributes => {
                    const rvSymbolColumnName = 'rvSymbol';

                    // TODO: formatLayerAttributes function should figure out icon and store it in the attribute bundle
                    // ideally, this should go into the `formatAttributes` function in layer-record.class, but we are trying to keep as loosely bound as possible to be moved later to geoApi and this uses geoService.retrieveSymbol
                    // add symbol as the first column
                    // check if the symbol column already exists
                    if (!attributes.columns.find(({ data }) => data === rvSymbolColumnName)) {

                        attributes.rows.forEach(row => {
                            row.rvSymbol = geoService.retrieveSymbol(row, attributes.renderer);
                            row.rvInteractive = '';
                        });

                        // add a column for interactive actions (detail and zoom)
                        // do not add it inside an existing field because filters will not work properly and because of https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1631
                        attributes.columns.unshift({
                            data: 'rvInteractive',
                            title: '',
                            orderable: false,
                            render: '',
                            width: '20px' // for datatables
                        });

                        // add a column for symbols
                        attributes.columns.unshift({
                            data: rvSymbolColumnName,
                            title: '',
                            orderable: false,
                            render: data => `<div class="rv-wrapper rv-symbol">${data}</div>`,
                            width: '20px' // for datatables
                        });
                    }

                    return {
                        data: attributes,
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
                .then(() => {
                    if (errorToast) {
                        errorService.remove();
                    }
                    return stateManager.toggleDisplayPanel('filtersFulldata', dataPromise, requester, 0);
                })
                .catch(() => {
                    errorToast = errorService.display($translate.instant('toc.error.resource.loadfailed'),
                        layoutService.panes.filter);
                });
        }

        /**
         * Opens filters panel with data from the provided layer object.
         * @function toggleLayerFiltersPanel
         * @param  {Object} entry layer object whose data should be displayed.
         */
        function toggleLayerFiltersPanel2(entry) {
            debToggleFilter(entry);
        }

        /**
         * Opens metadata panel with data from the provided layer object.
         * @function toggleMetadata
         * @param  {Object} entry layer object whose data should be displayed.
         * @param  {Bool | undefined} state of the panel
         *         {state = true|undefined => pane visible,
         *          state = false => pane not visible}.
         */
        function toggleMetadata(legendBlock, value = true) {

            const requester = {
                id: legendBlock.id,
                name: legendBlock.name
            };

            const panelToClose = {
                filters: false
            };

            const dataPromise = $q(resolve => {
                metadataService.loadFromURL(legendBlock.metadataUrl).then(mdata => {
                    const metadataPackage = {
                        metadata: mdata,
                        metadataUrl: legendBlock.metadataUrl,
                        catalogueUrl: legendBlock.catalogueUrl
                    };

                    resolve(metadataPackage);

                }).catch(() => {
                    errorService.display($translate.instant('toc.error.resource.loadfailed'),
                        layoutService.panes.metadata);
                });
            });

            stateManager
                .setActive(panelToClose)
                .then(() => stateManager.toggleDisplayPanel('sideMetadata', dataPromise, requester));

        }

        /**
         * Sets a watch on StateManager for layer data panels. When the requester is changed, calls setTocEntrySelectedState to dehighlight layer options and checks the state of the layer item itself (selected / not selected).
         *
         * @function watchPanelState
         * @param  {String} panelName    name of the panel to watch as specified in the stateManager
         * @param  {String} displayName type of the display data (layer toggle name: 'settings', 'metadata', 'filters')
         */
        function watchPanelState(panelName, displayName) {
            // clear display on metadata, settings, and filters panels when closed
            $rootScope.$on('stateChangeComplete', (event, name, property, value) => {
                if (property === 'active' && name === panelName && value === false) {
                    stateManager.clearDisplayPanel(panelName);
                }
            });

            $rootScope.$watch(() => stateManager.display[displayName].requester, (newRequester, oldRequester) => {
                if (newRequester !== null) {
                    // deselect layer from the old requester if layer ids don't match
                    if (oldRequester !== null && oldRequester.id !== newRequester.id) {
                        setTocEntrySelectedState(oldRequester.id, false);
                    }

                    // select the new layer
                    setTocEntrySelectedState(newRequester.id);
                } else if (oldRequester !== null) {
                    // deselect the old layer since the panel is closed as the newRequester is null
                    setTocEntrySelectedState(oldRequester.id, false);
                }
            });
        }

        /**
         * Sets selected state of the toc entry with the specified id to the specified value
         * @function setTocEntrySelectedState
         * @param {Stromg} id    toc entry id; it can be different from a layer id (sublayers of a dynamic layer will have generated ids)
         * @param {Boolean} value defaults to true;
         */
        function setTocEntrySelectedState(id, value = true) {
            console.log(configService, id, value);

            return;

            /*
            const entry = geoService.legend.getItemById(id);
            if (entry) {
                // toc entry is considered selected if its metadata, settings, or data panel is opened;
                // when switching between panels (opening metadata when settings is already open), events may happen out of order
                // to ensure a toc entry is not deselected untimely, keep count of open/close events
                selectedLayerLog[id] = (selectedLayerLog[id] || 0) + (value ? 1 : -1);
                entry.selected = selectedLayerLog[id] > 0 ? true : false;
            }*/
        }
    }
})();
