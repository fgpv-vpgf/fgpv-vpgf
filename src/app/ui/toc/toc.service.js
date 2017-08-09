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
    .module('app.ui')
    .factory('tocService', tocService);

function tocService($q, $rootScope, $mdToast, $translate, common, layoutService, stateManager, graphicsService,
    geoService, metadataService, errorService, LegendBlock, configService, legendService) {

    const service = {
        // method called by the options and flags set on the layer item
        actions: {
            toggleLayerTablePanel
        },

        toggleSettings,
        toggleMetadata,
        toggleLayerTablePanel,

        removeLayer,
        reloadLayer
    };

    let errorToast;

    // set state change watches on metadata, settings and table panel
    watchPanelState('sideMetadata', 'metadata');
    watchPanelState('sideSettings', 'settings');
    watchPanelState('tableFulldata', 'table');

    return service;

    /**
     * This will reload the layer records referenced by the specified legend block and all other legend blocks attached to that record;
     * will also reload all controlled layer records.
     *
     * For simplicity, this will close all open panels even if they are not affected by the reload
     * // TODO: close and reopen only the panel which is connected with the layer record being reloaded
     * @function reloadLayer
     * @param {LegendBlock} legendBlock legend block to be reloaded
     */
    function reloadLayer(legendBlock) {
        // get table configuration and check if static field were used. If so, table can't be remove and flag need to stay
        const config = configService.getSync.map.layerRecords.find(item =>
            item.config.id === legendBlock.layerRecordId).initialConfig.table;
        const staticField = config.columns.find(col =>
            col.filter.static === true);

        // reset filter flag
        legendBlock.filter = (typeof staticField !== 'undefined' && config.applyMap) ? true : false;

        stateManager.setActive({ tableFulldata: false } , { sideMetadata: false }, { sideSettings: false });
        legendService.reloadBoundLegendBlocks(legendBlock.layerRecordId);
    }

    /**
     * Removes the provided legend block from the layer selector, hides the corresponding layer, displays a toast
     * notification give the user a chance to undo.
     * This will also close an open panel related to the layer being remove and restore this panel if the removal is cancelled.
     *
     * // TODO: come up with a better name; this one is not descriptive enough;
     * @function removeLayer
     * @param  {LegendBlock} legendBlock legend block to be remove from the layer selector
     */
    function removeLayer(legendBlock) {
        const [resolve, reject] = legendService.removeLegendBlock(legendBlock);

        // create notification toast
        const undoToast = $mdToast.simple()
            .textContent($translate.instant('toc.label.state.remove'))
            .action($translate.instant('toc.label.action.remove'))
            .parent(layoutService.panes.toc)
            .position('bottom rv-flex');

        // promise resolves with 'ok' when user clicks 'undo'
        $mdToast.show(undoToast)
            .then(response =>
                response === 'ok' ? _restoreLegendBlock() : resolve());

        // name mapping between true panel names and their short names
        const panelSwitch = {
            table: {
                panel: 'tableFulldata',
                action: toggleLayerTablePanel
            },
            metadata: {
                panel: 'sideMetadata',
                action: toggleMetadata
            },
            settings: {
                panel: 'sideSettings',
                action: toggleSettings
            }
        };

        // each legend block can have only one panel open at a time; find its name;
        const openPanelName = Object.keys(panelSwitch)
            .map(panelName => {
                const panelDisplay = stateManager.display[panelName];
                if (panelDisplay.requester && panelDisplay.requester.id === legendBlock.id) {
                    return panelName;
                } else {
                    return null;
                }
            })
            .filter(a => a !== null)[0] || null;

        if (openPanelName) {
            stateManager.setActive({ [panelSwitch[openPanelName].panel]: false });
        }

        console.log(stateManager.display);

        function _restoreLegendBlock() {
            reject();
            if (openPanelName) {
                panelSwitch[openPanelName].action(legendBlock);
            }
        }
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
            table: false
        };

        stateManager
            .setActive(panelToClose)
            .then(() => stateManager.toggleDisplayPanel('sideSettings', legendBlock, requester));
    }

    /**
     * Opens table panel with data from the provided layer object (debounce).
     *
     * @function toggleLayerTablePanel
     * @param  {Object} legendBlock legend block object whose data should be displayed.
     * @private
     */
    function toggleLayerTablePanel(legendBlock) {
        const requester = {
            id: legendBlock.id,
            name: legendBlock.name,
            error: false,
            layerId: legendBlock.id, //(entry.master ? entry.master : entry).id,
            legendEntry: legendBlock
        };

        // const layerRecord = geoService.layers[requester.layerId];
        const dataPromise = legendBlock.formattedData
            .then(attributes => common.$timeout(() => attributes), 1000)
            .then(attributes => {
                const rvSymbolColumnName = 'rvSymbol';

                // TODO: formatLayerAttributes function should figure out icon and store it in the attribute bundle
                // ideally, this should go into the `formatAttributes` function in layer-record.class, but we are trying to keep as loosely bound as possible to be moved later to geoApi and this uses geoService.retrieveSymbol
                // add symbol as the first column
                // check if the symbol column already exists
                if (!attributes.columns.find(({ data }) => data === rvSymbolColumnName)) {

                    attributes.rows.forEach(row => {
                        legendBlock.getSymbol(row).then(symbol => { row.rvSymbol = symbol; });
                        row.rvInteractive = '';
                    });

                    // add filters attributes needed by every columns
                    attributes.columns.forEach(columns => {
                        columns.name = columns.data; // add name so we can get column from datatables (https://datatables.net/reference/type/column-selector)
                        columns.display = true;
                        columns.sort = 'none'; // can be none, asc or desc (values use by datatable)
                        columns.filter = { };
                        columns.width = '';
                        columns.init = false;
                        columns.position = -1; // use to synchronize columns when reorder
                    });

                    // add a column for interactive actions (detail and zoom)
                    // do not add it inside an existing field because filters will not work properly and because of https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1631
                    attributes.columns.unshift({
                        data: 'rvInteractive',
                        title: '',
                        orderable: false,
                        render: '',
                        width: '20px', // for datatables
                        position: 1, // for datatables
                        className: 'rv-filter-noexport' // do not show when datatble export or print
                    });

                    // add a column for symbols
                    attributes.columns.unshift({
                        data: rvSymbolColumnName,
                        title: '',
                        orderable: false,
                        render: data => `<div class="rv-wrapper rv-symbol">${data}</div>`,
                        width: '20px', // for datatables
                        position: 0, // for datatables
                        className: 'rv-filter-noexport' // do not show when datatble export or print

                    });
                }

                // add filters informations (use by filters to keep info on table so it persist when we change table)
                if (typeof attributes.filter === 'undefined') {
                    attributes.filter =  {
                        globalSearch: '',
                        isApplied: true,
                        isActive: false,
                        isMapFiltered: false,
                        isInit: false,
                        isOpen: true
                    };
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
                return stateManager.toggleDisplayPanel('tableFulldata', dataPromise, requester, 0);
            })
            .catch(error => {
                // do not show error message if loading was aborted
                if (error.message === 'ABORTED') {
                    return ;
                }

                requester.error = true; // this will hide the table loading splash

                errorToast = errorService.display($translate.instant('toc.error.resource.loadfailed'),
                    layoutService.panes.filter);
            });
    }

    /**
     * Opens metadata panel with data from the provided layer object.
     * @function toggleMetadata
     * @param  {Object} legendBlock layer object whose data should be displayed.
     * @param  {Bool | undefined} value of the panel
     *         {state = true|undefined => pane visible,
     *          state = false => pane not visible}.
     */
    function toggleMetadata(legendBlock, value = true) {

        const requester = {
            id: legendBlock.id,
            name: legendBlock.name
        };

        const panelToClose = {
            table: false
        };

        const dataPromise = $q((resolve, reject) => {
            metadataService.loadFromURL(legendBlock.metadataUrl).then(mdata => {
                const metadataPackage = {
                    metadata: mdata,
                    metadataUrl: legendBlock.metadataUrl,
                    catalogueUrl: legendBlock.catalogueUrl
                };

                resolve(metadataPackage);

            }).catch(error => {
                errorService.display($translate.instant('toc.error.resource.loadfailed'),
                    layoutService.panes.metadata);

                // display manager will stop the progress bar when datapromise is rejected
                reject(error);
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
     * @param  {String} displayName type of the display data (layer toggle name: 'settings', 'metadata', 'table')
     */
    function watchPanelState(panelName, displayName) {
        // clear display on metadata, settings, and table panels when closed
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

        /* FIXME
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
