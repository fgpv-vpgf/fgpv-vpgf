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

function tocService($q, $rootScope, $mdToast, $translate, referenceService, stateManager, geoService, metadataService, errorService, LegendBlock, configService, legendService, layerRegistry, Geo, events) {

    let panel;
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
        selectedLegendBlockLog: {}
    };

    // name mapping between true panel names and their short names
    const panelSwitch = {
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

    let mApi = null;
    events.$on(events.rvApiPreMapAdded, (_, api) => {
        mApi = api;
        panelSetup();
        watcherSetup();

        panelSwitch.metadata.panel = mApi.panels.metadata;
        panelSwitch.settings.panel = mApi.panels.settings;
    });

    // set state change watches on metadata, settings and table panel
    watchPanelState('metadata');
    watchPanelState('settings');

    events.$on(events.rvMapLoaded, () => {
        // wire in a hook to any map for removing a layer. this makes it available on the API
        configService.getSync.map.instance.removeApiLayer = (id, index, showToast = false) => {
            const legendBlocks = configService.getSync.map.legendBlocks;
            let layerToRemove = legendBlocks.walk(l => l.layerRecordId === id ? l : null).filter(a => a);

            // TODO: fix this, will only remove 1 instance from legend if there are multiple legend blocks referencing it  ?
            if (layerToRemove.length > 0) {
                if (index !== undefined) {
                    // in cases of dynamic, if index specified, remove only that child, otherwise we choose to remove entire group below
                    layerToRemove = layerToRemove.find(l => l.itemIndex === index);
                } else {
                    // removing the first instance, whether it be the legend group or node
                    layerToRemove = layerToRemove[0];
                }

                if (layerToRemove) {
                    service.removeLayer(layerToRemove, showToast);
                }
            } else {
                // layer is not in legend (or does not exist), try simply removing layer record
                layerRegistry.removeLayerRecord(id);
            }
        }

        //wire in a hook to any map for removing a layer using the given LegendBlock
        configService.getSync.map.instance.removeAPILegendBlock = (legendBlock) => {
            service.removeLayer(legendBlock, false);
        };

        //wire in a hook to any map for reloading a layer using the given LegendBlock
        configService.getSync.map.instance.reloadAPILegendBlock = (legendBlock) => {
            service.reloadLayer(legendBlock);
        };

        //wire in a hook to any map for toggling Metadata for any given legendBlock
        configService.getSync.map.instance.toggleMetadata = (legendBlock) => {
            service.toggleMetadata(legendBlock);
        }

        //wire in a hook to any map for toggling settings for any given legendBlock
        configService.getSync.map.instance.toggleSettings = (legendBlock) => {
            service.toggleSettings(legendBlock);
        }

        // wire in a hook to any map for toggling settings for any given legendBlock
        configService.getSync.map.instance.toggleDataTable = (legendBlock) => {
            service.toggleLayerTablePanel(legendBlock);
        }
    });

    return service;

    function panelSetup() {
        panel = mApi.panels.legend;
        panel.body = $('<rv-toc></rv-toc>');
        panel.reopenAfterOverlay = true;
        panel.allowUnderlay = false;
        panel.isCloseable = true;
        panel.opening.subscribe(() => {
            panel.appBar.title = 'appbar.tooltip.layers';
        });
    }

    function watcherSetup() {
        mApi.panels.settings.closing.subscribe(() => {
            stateManager.clearDisplayPanel('sideSettings');
        });
        mApi.panels.metadata.closing.subscribe(() => {
            stateManager.clearDisplayPanel('sideMetadata');
        });
    }

    /**
     * This will reload the layer records referenced by the specified legend block and all other legend blocks attached to that record;
     * will also reload all controlled layer records.
     *
     * This will close and reopen a panel if it is connected with the layer record being reloaded
     * Otherwise, any open panel will be closed
     * @function reloadLayer
     * @param {LegendBlock} legendBlock legend block to be reloaded
     */
    function reloadLayer(legendBlock, interval = false) {
        // get table configuration and check if static field were used. If so, table can't be remove and flag need to stay
        const layerRecord = configService.getSync.map.layerRecords.find(item =>
            item.config.id === legendBlock.layerRecordId);

        const tableConfig = layerRecord ? layerRecord.initialConfig.tableConfig : null;
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
        if (openPanel) {
            const panel = panelSwitch[openPanel.name].panel;
            panel.close();
        } else {    // open panel not being reloaded, close any open panel
            mApi.panels.settings.close();
            mApi.panels.metadata.close();
        }
        legendService.reloadBoundLegendBlocks(legendBlock.layerRecordId, openPanel).then(block => {
            if (openPanel) {
                const findBlock = block
                    .walk(entry =>
                        entry.id === openPanel.requester.id ?
                            entry : null)
                    .filter(a => a)[0];

                if (findBlock) {        // open panel not reloaded, close any open panel
                    mApi.panels.settings.close();
                    mApi.panels.metadata.close();
                    return;
                }

                // for the table, panel data is columns, rows, etc. instead of the actual entry
                // thus, we need to take the legend entry in those cases
                // for settings and metadata, if data exists it is the correct entry
                const node = openPanel.data ?
                    openPanel.data :
                    openPanel.requester.legendEntry ?
                        openPanel.requester.legendEntry : legendBlock;

                // find reloaded legend block
                // if there are multiple instances of the same layer, reloading any record other than the first one will still
                // return the first legend block and open the panel for that one instead (they are identical though)
                legendBlock = block
                    .walk(entry =>
                        (node.parentLayerType === Geo.Layer.Types.ESRI_DYNAMIC ? entry.blockConfig.entryIndex === node.blockConfig.entryIndex :
                            entry.layerRecordId === node.layerRecordId) ?
                            entry : null)
                    .filter(a => a && a._isDynamicRoot === node._isDynamicRoot)[0]; // filter out hidden dynamic root if any

                if (openPanel.name === 'settings') {
                    toggleSettings(legendBlock);
                } else if (openPanel.name === 'metadata') {
                    toggleMetadata(legendBlock);
                }
            }
            // clear the state for the datatable to match the refreshed legend
            const fs = legendBlock.proxyWrapper.filterState;
            if (fs !== undefined) {
                fs.setSql(fs.coreFilterTypes.SYMBOL, '');
            }

            // fire layer reloaded observable if layer can be found
            let layer = findApiLayerFromLegendBlock(legendBlock);
            if (layer) {
                mApi.layers._reload.next(layer, interval);
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
    function removeLayer(legendBlock, showToast = true) {
        let resolve, reject, openPanelName;

        // need to check all children in case of dynamic where a child table is open but parent is removed
        if (legendBlock.blockType === LegendBlock.TYPES.GROUP || legendBlock.blockType === LegendBlock.TYPES.SET) {
            legendBlock.walk(block => mApi.ui.configLegend._elementRemoved.next(block));
        } else {
            mApi.ui.configLegend._elementRemoved.next(legendBlock);
        }

        // legendBlock is the only child in the group, remove parent instead of just child
        if (legendBlock.parent && legendBlock.parent.entries.length === 1) {
            removeLayer(legendBlock.parent, showToast);
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
            panelSwitch[openPanelName.name].panel.close();
        }

        // let the layer know that the block has been deselected due to removal
        legendBlock.isSelected = false;

        // create notification toast
        const undoToast = $mdToast.simple()
            .textContent($translate.instant('toc.label.state.remove'))
            .action($translate.instant('toc.label.action.remove'))
            .parent($('#mainToc'))
            .position('bottom rv-flex');

        if (showToast) {
            // promise resolves with 'ok' when user clicks 'undo'
            $mdToast.show(undoToast)
                .then(response =>
                    response === 'ok' ? _restoreLegendBlock() : resolve());
        } else {
            resolve();
        }

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
        console.log('tocService', `toggle visiblity of layer with name ${tocEntry.name}`);
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
        let settings = configService.getLang() === 'en-CA' ? 'Settings' : 'Paramètres';
        mApi.panels.settings.header.title = `${settings}: ${legendBlock.name}`;
        const requester = {
            id: legendBlock.id,
            name: legendBlock.name
        };

        // send to display manager method
        stateManager.toggleDisplayPanel('sideSettings', legendBlock, requester);
    }

    function toggleLayerTablePanel(legendBlock) {
        let layer = findApiLayerFromLegendBlock(legendBlock);

        // TODO: see if it's possible to just emit the apiLayer instead of requiring the legendBlock too (currently used in multiple places in table plugin)
        mApi.ui.configLegend._dataTableToggled.next({ apiLayer: layer, legendBlock });
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

        let metadataPanel = mApi.panels.metadata;
        let metadata = configService.getLang() === 'en-CA' ? 'Metadata' : 'Métadonnées';
        metadataPanel.header.title = `${metadata}: ${legendBlock.name}`;

        const requester = {
            id: legendBlock.id,
            name: legendBlock.name
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
                legendBlock.metadataPackage = metadataPackage;
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

        // send to display manager method
        stateManager.toggleDisplayPanel('sideMetadata', dataPromise, requester);
    }

    /**
     * Sets a watch on StateManager for layer data panels. When the requester is changed, calls setTocEntrySelectedState to dehighlight layer options and checks the state of the layer item itself (selected / not selected).
     *
     * @function watchPanelState
     * @param  {String} panelName    name of the panel to watch as specified in the stateManager
     * @param  {String} displayName type of the display data (layer toggle name: 'settings', 'metadata', 'table')
     */
    function watchPanelState(displayName) {
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
        ref.selectedLegendBlockLog[id] = (ref.selectedLegendBlockLog[id] || 0) + (value ? 1 : -1);
        block.isSelected = ref.selectedLegendBlockLog[id] > 0;
    }

    /**
     * Find the API ConfigLayer corresponding to the legendBlock provided
     * @function findApiLayerFromLegendBlock
     * @param {Object} legendBlock layer object whose associated ConfigLayer is being found.
     * @return {Object} ConfigLayer api layer
     */
    function findApiLayerFromLegendBlock(legendBlock) {
        if (legendBlock.parentLayerType === 'esriDynamic') {
            return mApi.layers.allLayers.find(function (l) {
                return l.id === legendBlock.layerRecordId && l.layerIndex === parseInt(legendBlock.itemIndex);
            });
        } else {
            return mApi.layers.getLayersById(legendBlock.layerRecordId)[0];
        }
    }
}
