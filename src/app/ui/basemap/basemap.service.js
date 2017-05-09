(() => {
    'use strict';

    /**
     * @module basemapService
     * @memberof app.ui
     * @description
     *
     * The `basemapService` is responsible for providing a list of selectable basemaps, and tracking
     * the currently selected basemap.
     *
     */
    angular
        .module('app.ui')
        .factory('basemapService', basemapService);

    function basemapService($rootElement, $mdSidenav, $q) {

        let closePromise;

        const service = {
            open,
            close,
            toggle,
            isOpen,
            onClose: () => closePromise // returns promise that resolves when panel has closed (by any means)
        };

        return service;

        /**
         * Opens basemap panel.
         * @function open
         * @return  {Promise}   resolves to undefined when panel animation is complete
         */
        function open() {
            closePromise = $q($mdSidenav('right').onClose)
                .then(() => setOtherChromeOpacity(1));

            setOtherChromeOpacity(0.2);

            // close the side menu
            $mdSidenav('left').close();

            return $mdSidenav('right')
                .open()
                // Once the side panel is open, set focus on the panel
                .then(() => $('md-sidenav[md-component-id="right"] button').first().rvFocus());

            /**
             * Makes all other chrome almost transparent so the basemap is more clearly visible
             * @function setOtherChromeOpacity
             * @private
             */
            function setOtherChromeOpacity(opacity) {
                $rootElement.find(`rv-panel, rv-appbar`).css('opacity', opacity);
                $rootElement.find(`.rv-esri-map .layersDiv > *:not(:first)`).css('opacity', opacity);
            }
        }

        /**
         * Closes basemap panel.
         * @function close
         * @return  {Promise}   resolves to undefined when panel animation is complete
         */
        function close() {
            return $mdSidenav('right').close();
        }

        /**
         * Toggles basemap panel open/close.
         * @function toggle
         * @return  {Promise}   resolves to undefined when panel animation is complete
         */
        function toggle() {
            return isOpen() ? close() : open();
        }

        /**
         * Determines if the basemap panel is currently open/opening or closed/closing
         * @function toggle
         * @return  {Boolean}   true iff open/opening, false otherwise
         */
        function isOpen() {
            return $mdSidenav('right').isOpen();
        }

        /**
         * Returns the projection name given a basemap wkID as defined in translations,
         * or 'Other' if not found
         * @function wkidToName
         * @private
         * @param   {Number}    wkID    the basemap wkID from which to derive a name
         * @return  {String}    the translated basemap projection name
         */
        /*function wkidToName(wkID) {
            const translationID = `wkids.${wkID}`;
            const translationStr = $translate.instant(translationID);

            return translationID !== translationStr ? translationStr : $translate.instant('wkids.other');
        }*/

        /**
         * Sets a callback function that is called whenever basemaps changes.
         *
         * @function setOnChangeCallback
         * @param {Function} cb   a callback function which takes an optional parameter containing
         *                        the list of projections
         */
        /*
        function setOnChangeCallback(cb) {
            onChangeCallback.push(cb);
        }*/

        /**
         * Rebuilds the list of basemaps and projections based on the current configuration.
         * @function reload
         */
        /*
        function reload() {
            projections.length = 0;
            configService.getAsync.then(conf => {
                // initialBasemapId = conf.map ? conf.map.initialBasemapId : null;
                _addBaseMaps(conf.baseMaps);
            });
        }*/

        /*function selectBasemap(newSelection) {
            const oldSelection = service.selectedBasemap || { deselect: angular.noop };

            oldSelection.deselect();
            newSelection.select();

            // TODO: use this call after config is typed and basemap classes are moved out of here
            // geoService.changeBasemap(basemap);

            // TODO: would any other code need to know when the basemap changes? an event for that can be fired
            // $rootScope.$broadcast('rv-basemap-change', [newSelection, oldSelection]);
        }*/

        /**
         * Set the provided basemap as selected and update the map
         *
         * @function select
         * @param {Object} basemap   the basemap object to set as selected
         */
        /*
        function select(basemap) {

            // To avoid double checkmark on basemap selection
            if (bmBlankSelected !== null) {
                bmBlankSelected.selected = bmBlankSelected.type !== 'blank';
                bmBlankSelected = null;
            }

            bmSelected.selected = false; // set current basemap to unselected
            bmSelected = basemap;
            bmSelected.selected = true;

            if ($injector.get('geoService').baseMapHasSameSP(basemap.id)) { // avoid circular dependency
                $injector.get('geoService').selectBasemap(basemap); // avoid circular dependency
            } else {
                // avoiding circular dependency on bookmarkService
                $injector.get('reloadService').loadNewProjection(basemap.id); // avoid circular dependency
            }
        }*/

        /**
         * Get the currently selected basemap
         *
         * @function getSelected
         * @returns {Object}    the basemap that is currently selected
         */
        /*
        function getSelected() {
            return bmSelected;
        }*/

        /**
         * Organizes basemaps into projection groupings and inserts a blank basemap
         *
         * @function _addBaseMaps
         * @private
         * @param {Array} basemapList   A list of basemap objects
         */
        /*
        function _addBaseMaps(mapConfig) {

            //console.log(mapConfig);

            // creates lists of extentSets, tileShemas and basemaps;
            // the basemap list is flat and will be grouped by tileSchema id and sorted by basemap name directly in the template



            basemapList.forEach(bm => {
                const basemap = _normalizeBasemap(bm);
                const projName = wkidToName(basemap.wkid);
                let projection = projections.find(proj => proj.name === projName);
                // make first basemap selected by default
                bmSelected = typeof bmSelected === 'undefined' ? basemap : bmSelected;
                // create projection if one does not already exist
                if (!projection) {
                    projection = {
                        wkid: basemap.wkid,
                        name: projName,
                        basemaps: []
                    };
                    projections.push(projection);
                }

                // if config specifies a default basemap set to selected
                basemap.selected = initialBasemapId === basemap.id;
                bmSelected = basemap.selected ? basemap : bmSelected;

                projection.basemaps.push(basemap);
            });

            projections.forEach(p => {

                const idBlank = 'blank_basemap_' + p.basemaps[0].wkid;
                // do we have a selected blank basemap
                const selectedBlank = idBlank === bmSelected.id;

                const index = p.basemaps.push({
                    name: $translate.instant('basemap.blank.title'),
                    description: $translate.instant('basemap.blank.desc'),
                    type: 'blank',
                    id: idBlank,
                    url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7/',
                    wkid: p.basemaps[0].wkid,
                    selected: selectedBlank,
                    attribution: p.basemaps[0].attribution
                }) - 1;
                // to keep a trace of the blank basemap selection
                if (selectedBlank) {
                    bmBlankSelected = p.basemaps[index];
                }
            });

            bmSelected.selected = true;
            onChangeCallback.forEach(cb => cb(projections, bmSelected));
        }*/

    }

    /**
     * Overwrites and adds properties to the basemap object provided by the config
     *
     * @function _normalizeBasemap
     * @private
     * @returns {Object}    the basemap object
     */
    /*function _normalizeBasemap(basemap) {
        return {
            name: basemap.name,
            description: basemap.description,
            type: basemap.type,
            id: basemap.id,
            url: basemap.layers[0].url,
            wkid: basemap.wkid,
            selected: false,
            attribution: basemap.attribution
        };
    }*/

})();
