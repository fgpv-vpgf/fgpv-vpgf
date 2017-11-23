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

function tocService($q, $rootScope, $mdToast, $translate, referenceService, common, stateManager, graphicsService,
    geoService, metadataService, errorService, LegendBlock, configService, legendService, Geo) {

    const service = {
        // method called by the options and flags set on the layer item
        actions: {
            toggleLayerTablePanel
        },

        toggleSettings,
        toggleMetadata,
        toggleLayerTablePanel,

        removeLayer,
        reloadLayer,

        validMetadata: false
    };

    const ref = {
        selecteLegendBlockLog: {}
    };

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
     * This will close and reopen a panel if it is connected with the layer record being reloaded
     * Otherwise, any open panel will be closed
     * @function reloadLayer
     * @param {LegendBlock} legendBlock legend block to be reloaded
     */
    function reloadLayer(legendBlock) {
        // get table configuration and check if static field were used. If so, table can't be remove and flag need to stay
        const tableConfig = configService.getSync.map.layerRecords.find(item =>
            item.config.id === legendBlock.layerRecordId).initialConfig.table;

        // update filter flag
        if (tableConfig) {
            legendBlock.filter = tableConfig.applied;
        }

        // search for open panels from the top-most parent (excluding the root level)
        let topLevelBlock = legendBlock;
        while (topLevelBlock.parent.parent) {
            topLevelBlock = topLevelBlock.parent;
        }

        const openPanel = _findOpenPanel(panelSwitch, topLevelBlock);

        // displayManagers 'toggleDisplayPanel' requires an argument called 'dataPromise', for settings 'dataPromise' is LegendNode
        // if the table is being toggled, 'dataPromise is an object with 'data' key
        // 'data' for table consists of columns, rows, etc.
        // if the metadata is being toggled, 'dataPromise is an object with multiple properties
        // example of properties are metadata, metadataUrl, etc.
        let data, panel;
        if (openPanel) {
            panel = panelSwitch[openPanel.name].panel;
            stateManager.setActive({ [panel]: false });

            if (openPanel.name === 'table') {
                data = { data: stateManager.display[openPanel.name].data };
            } else if (openPanel.name === 'metadata') {
                data = stateManager.display[openPanel.name].data;
            }
        } else {    // open panel not being reloaded, close any open panel
            stateManager.setActive({ tableFulldata: false } , { sideMetadata: false }, { sideSettings: false });
        }

        legendService.reloadBoundLegendBlocks(legendBlock.layerRecordId, openPanel).then(block => {
            if (openPanel) {
                const findBlock = block
                    .walk(entry =>
                        entry.id === openPanel.requester.id ?
                            entry : null)
                    .filter(a => a)[0];

                if (findBlock) {        // open panel not reloaded, close any open panel
                    stateManager.setActive({ tableFulldata: false }, { sideMetadata: false }, { sideSettings: false });
                    return;
                }

                // for the table, panel data is columns, rows, etc. instead of the actual entry
                // thus, we need to take the legend entry in those cases
                // for settings and metadata, if data exists it is the correct entry
                const node = openPanel.name !== 'table' && openPanel.data ?
                    openPanel.data :
                    openPanel.requester.legendEntry ?
                        openPanel.requester.legendEntry : legendBlock;

                // find reloaded legend block
                // if there are multiple instances of the same layer, reloading any record other than the first one will still
                // return the first legend block and open the panel for that one instead (they are identical though)
                legendBlock = block
                    .walk(entry =>
                        (node.parentLayerType ===  Geo.Layer.Types.ESRI_DYNAMIC ? entry.blockConfig.entryIndex === node.blockConfig.entryIndex :
                        entry.layerRecordId === node.layerRecordId) ?
                            entry : null)
                    .filter(a => a && a._isDynamicRoot === node._isDynamicRoot)[0]; // filter out hidden dynamic root if any

                // update the requester accordingly for the reloaded legend block
                openPanel.requester.id = legendBlock.id;
                openPanel.requester.name = legendBlock.name;

                if (openPanel.data && openPanel.name !== 'table') {
                    openPanel.data = legendBlock;
                }

                if (openPanel.requester.layerId) {
                    openPanel.requester.layerId = legendBlock.id;
                }

                if (openPanel.requester.legendEntry) {
                    openPanel.requester.legendEntry = legendBlock;
                }

                stateManager.toggleDisplayPanel(panel, data || legendBlock, openPanel.requester, 0);
            }
        }, (layerName) => {
            console.error('Failed to reload layer:', layerName);
        });
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
        let resolve, reject, openPanelName;

        // legendBlock is the only child in the group, remove parent instead of just child
        if (legendBlock.parent && legendBlock.parent.entries.length === 1) {
            removeLayer(legendBlock.parent);
            return;
            // legendBlock has no parent, so we are at the top most level
            // this block has one entry which is the only one currently in the legend, remove that entry
        } else if (!legendBlock.parent) {
            openPanelName = _findOpenPanel(panelSwitch, legendBlock);
            [resolve, reject] = legendService.removeLegendBlock(legendBlock.entries[0]);
            // remove the legendBlock normally since it has other siblings
        } else {
            // each legend block can have only one panel open at a time; find its name;
            openPanelName = _findOpenPanel(panelSwitch, legendBlock);
            [resolve, reject] = legendService.removeLegendBlock(legendBlock);
        }

        if (openPanelName) {
            stateManager.setActive({ [panelSwitch[openPanelName.name].panel]: false });
        }

        // let the layer know that the block has been deselected due to removal
        legendBlock.isSelected = false;

        // create notification toast
        const undoToast = $mdToast.simple()
            .textContent($translate.instant('toc.label.state.remove'))
            .action($translate.instant('toc.label.action.remove'))
            .parent(referenceService.panes.toc)
            .position('bottom rv-flex');

        // promise resolves with 'ok' when user clicks 'undo'
        $mdToast.show(undoToast)
            .then(response =>
                response === 'ok' ? _restoreLegendBlock() : resolve());

        console.log(stateManager.display);

        function _restoreLegendBlock() {
            reject();
        }
    }

    /**
    * Find any open panels matching the legendBlock
    * @private
    * @function _findOpenPanel
    * @param {Object} panelSwitch name mapping between true panel names and their short names
    * @param {LegendBlock} legendBlock legend block to be searched for open panel
    * @return {Object} requester, data and name of open panel (if any)
    */
    function _findOpenPanel(panelSwitch, legendBlock) {
        return Object.keys(panelSwitch)
            .map(panelName => {
                const panelDisplay = stateManager.display[panelName];
                if (panelDisplay.requester && panelDisplay.requester.id === legendBlock.id) {
                    return {
                        requester: panelDisplay.requester,
                        data: panelDisplay.data,
                        name: panelName
                    };
                }
                else if (panelDisplay.requester && legendBlock.entries) {
                    // walk through the children of the current block to see if there's an open panel being removed
                    return legendBlock
                        .walk(lb => lb.id === panelDisplay.requester.id ? lb.id : null)
                        .filter(a => a)[0] ? {
                            requester: panelDisplay.requester,
                            data: panelDisplay.data,
                            name: panelName
                        } : null;
                } else {
                    return null;
                }
            })
            .filter(a => a !== null)[0] || null;
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
     * @param  {Object} entry legend block object whose data should be displayed.
     * @private
     */
    function debToggleLayerTablePanel(entry) {
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
                        // reset href to solve problem in Safari with svg not rendered
                        row.rvSymbol =
                            graphicsService.setSvgHref(geoService.retrieveSymbol(row, attributes.renderer));
                        row.rvInteractive = '';
                    });

                    // add a column for interactive actions (detail and zoom)
                    // do not add it inside an existing field because table will not work properly and because of https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1631
                    attributes.columns.unshift({
                        data: 'rvInteractive',
                        title: '',
                        orderable: false,
                        render: '',
                        width: '40px' // for datatables
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
                return stateManager.toggleDisplayPanel('tableFulldata', dataPromise, requester, 0);
            })
            .catch(() => {
                errorToast = errorService.display($translate.instant('toc.error.resource.loadfailed'),
                    referenceService.panes.filter);
            });
    }


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
                        width: '40px', // for datatables
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

                errorToast = errorService.display({
                    textContent: $translate.instant('toc.error.resource.loadfailed'),
                    parent: referenceService.panes.filter
                });
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

                service.validMetadata = true;
                referenceService.panes.metadata.find('md-toast').remove();      // remove any lingering toast message from before

                resolve(metadataPackage);

            }).catch(error => {
                service.validMetadata = false;
                referenceService.panes.metadata.find('rv-metadata-content').empty();        // empty the panels contents

                errorService.display({
                    textContent: $translate.instant('toc.error.resource.loadfailed'),
                    parent: referenceService.panes.metadata
                });

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
        const legendBlocks = configService.getSync.map.legendBlocks;

        const block = legendBlocks
            .walk(lb => lb.id === id ? lb : null)
            .filter(a => a)[0];

        // there should always be a block with the provided id, but check anyway in case it was remove or something
        if (!block) {
            return;
        }

        // toc entry is considered selected if its metadata, settings, or data panel is opened;
        // when switching between panels (opening metadata when settings is already open), events may happen out of order
        // to ensure a toc entry is not deselected untimely, keep count of open/close events
        ref.selecteLegendBlockLog[id] = (ref.selecteLegendBlockLog[id] || 0) + (value ? 1 : -1);
        block.isSelected = ref.selecteLegendBlockLog[id] > 0;
    }
}
