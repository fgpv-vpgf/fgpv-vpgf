import screenfull from 'screenfull';
import { Observable } from 'rxjs/Rx';
import { XY, XYBounds } from 'api/geometry';

/**
 * @module ConfigObject
 * @memberof app.core
 * @requires dependencies
 * @description
 *
 * ### About controls:
 * Each layer and group has two arrays of control settings: `controls` and `disabledControls`.
 * `controls` specify if the layer has corresponding ui elements to control the setting
 * `disabledControls` specify if the corresponding setting can be modified
 *
 * #### Control behaviour
 * | control | disabledControl | result                                                          |
 * |---------|-----------------|-----------------------------------------------------------------|
 * | x       |                 | control is visible to the user and can be modified                             |
 * |         | x               | control is invisible and is locked to modification                             |
 * |         |                 | control is invisible to the user, but can be modified indirecly, by a parent   |
 * | x       | x               | control is visible and is locked to modifications                              |
 *
 */
angular
    .module('app.core')
    .factory('ConfigObject', ConfigObjectFactory);

// eslint-disable-next-line max-statements
function ConfigObjectFactory(Geo, gapiService, common, events) {

    const ref = {
        legendElementCounter: 0,
        walkFunction
    };

    const { Layer: { Types: layerTypes }, Service: { Types: serviceTypes } } = Geo;

    const TYPES = {
        legend: {
            INFO: 'legendInfo',
            NODE: 'legendNode',
            GROUP: 'legendGroup',
            SET: 'legendSet',
            STRUCTURED: 'structured',
            AUTOPOPULATE: 'autopopulate'
        }
    };

    // These are layer default values for controls, disabledControls, and state
    const DEFAULTS = {
        legend: {
            [TYPES.legend.GROUP]: {
                controls: [
                    'opacity',
                    'visibility',
                    'query',

                    'symbology',
                    'reload',
                    'remove',
                    'settings',
                    'interval'
                ],
                disabledControls: [],
                userDisabledControls: []
            }
        },
        layer: {
            [Geo.Layer.Types.ESRI_FEATURE]: {
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: true,
                    snapshot: false,
                    userAdded: false
                },
                controls: [
                    'opacity',
                    'visibility',
                    'boundingBox',
                    'query',
                    'snapshot',
                    'metadata',
                    'boundaryZoom',
                    'refresh',
                    'reload',
                    'remove',
                    'settings',
                    'data',
                    'symbology',
                    'interval'
                ],
                disabledControls: [],
                userDisabledControls: []
            },
            [Geo.Layer.Types.OGC_WMS]: {
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: true,
                    snapshot: false,
                    userAdded: false
                },
                controls: [
                    'opacity',
                    'visibility',
                    'boundingBox',
                    'query',
                    // 'snapshot',
                    'metadata',
                    'boundaryZoom',
                    'refresh',
                    'reload',
                    'remove',
                    'settings',
                    // 'data',
                    'symbology',
                    'styles',
                    'interval'
                ],
                disabledControls: [],
                userDisabledControls: [],
                child: {
                    state: {},
                    controls: [],
                    disabledControls: [],
                    userDisabledControls: []
                }
            },
            [Geo.Layer.Types.ESRI_DYNAMIC]: {
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: true,
                    snapshot: false,
                    userAdded: false
                },
                controls: [
                    'opacity',
                    'visibility',
                    'boundingBox',
                    'query',
                    // 'snapshot',
                    'metadata',
                    'boundaryZoom',
                    'refresh',
                    'reload',
                    'remove',
                    'settings',
                    'data',
                    'symbology',
                    'interval'
                ],
                disabledControls: [],
                userDisabledControls: [],
                // this is special case reserved from children of a dynamic layer
                // these defaults cannot be applied to the layer config ahead of time since we don't know the child tree structure until the layer loads
                child: {
                    state: {
                        opacity: 1,
                        visibility: true,
                        boundingBox: false,
                        query: true,
                        snapshot: false,
                        userAdded: false
                    },
                    controls: [
                        'opacity',
                        'visibility',
                        'boundingBox',
                        'query',
                        // 'snapshot',
                        'metadata',
                        'boundaryZoom',
                        'refresh',
                        'reload',
                        'remove',
                        'settings',
                        'data',
                        'symbology',
                        'interval'
                    ],
                    disabledControls: [],
                    userDisabledControls: []
                }
            },
            [Geo.Layer.Types.ESRI_IMAGE]: {
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: false,
                    snapshot: false,
                    userAdded: false
                },
                controls: [
                    'opacity',
                    'visibility',
                    'boundingBox',
                    // 'query',
                    // 'snapshot',
                    'metadata',
                    'boundaryZoom',
                    'refresh',
                    'reload',
                    'remove',
                    'settings',
                    // 'data',
                    'symbology'
                ],
                disabledControls: [],
                userDisabledControls: []
            },
            [Geo.Layer.Types.ESRI_TILE]: {
                state: {
                    opacity: 1,
                    visibility: true,
                    boundingBox: false,
                    query: false,
                    snapshot: false,
                    userAdded: false
                },
                controls: [
                    'opacity',
                    'visibility',
                    'boundingBox',
                    // 'query',
                    // 'snapshot',
                    'metadata',
                    'boundaryZoom',
                    'refresh',
                    'reload',
                    'remove',
                    'settings',
                    // 'data',
                    'symbology'
                ],
                disabledControls: [],
                userDisabledControls: []
            }
        }
    };

    class InitialLayerSettings {
        /**
         *
         * @param {Object} source a well-formed layer state object
         */
        constructor (source) {
            this._opacity = source.opacity;
            this._visibility = source.visibility;
            this._boundingBox = source.boundingBox;
            this._query = source.query;
            this._snapshot = source.snapshot;
            this._userAdded = source.userAdded;
            this._hovertips = source.hovertips !== false;

            // TODO: decide if we want to preserve any settings (apart from snapshot) through the layer reload
        }

        get opacity () {            return this._opacity; }
        set opacity (value) {       this._opacity = value; }

        get visibility () {         return this._visibility; }
        set visibility (value) {    this._visibility = value; }

        get boundingBox () {        return this._boundingBox; }
        set boundingBox (value) {   this._boundingBox = value; }

        get query () {              return this._query; }
        set query (value) {         this._query = value; }

        get snapshot () {           return this._snapshot; }
        set snapshot (value) {      this._snapshot = value; }

        get userAdded () {          return this._userAdded; }
        set userAdded (value) {     this._userAdded = value; }

        get hovertips() { return this._hovertips; }
        set hovertips(value) { this._hovertips = value; }

        get JSON() {
            return {
                opacity: this.opacity,
                visibility: this.visibility,
                boundingBox: this.boundingBox,
                query: this.query,
                snapshot: this.snapshot
            };
        }
    }

    /**
     * Applies supplied layer node and layer entry node defaults to the node/entry node source config object (not typed config).
     *
     * @function applyLayerNodeDefaults
     * @param {Object} ownSource original config object from the config file (not typed)
     * @param {Object} ownDefaults default value for this layer node or layer entry node (not typed)
     * @param {Object} parentSource [optional={}] already defaulted config of an immediate parent; needed only for dynamic layres (possibly wms as well)
     * @return {Object} a copy of the original `ownSource` config with state, controls, disabledControls and userDisabledControls applied
     */
    function applyLayerNodeDefaults(ownSource =
        { state: {}, controls: [], disabledControls: [], userDisabledControls: [] },
    ownDefaults, parentSource = {}) {
        const ownSourceCopy = angular.copy(ownSource);

        ownSourceCopy.state = _defaultState(ownSourceCopy.state, ownDefaults.state, parentSource.state);

        ownSourceCopy.controls = _defaultControls(ownSourceCopy.controls,
            ownDefaults.controls, ownDefaults.controls, parentSource.controls);

        ownSourceCopy.disabledControls = _defaultControls(ownSourceCopy.disabledControls,
            ownDefaults.disabledControls, ownDefaults.controls, parentSource.disabledControls);

        ownSourceCopy.userDisabledControls = _defaultControls(ownSourceCopy.userDisabledControls,
            ownDefaults.userDisabledControls, ownDefaults.controls, parentSource.userDisabledControls);

        return ownSourceCopy;

        /**
         * Applies state defaults to the supplied layer node/entry state.
         * State is defaulted in the following order:
         * - state own property takes precedence
         * - parentState property is applied if the own state property is missing
         * - stateDefault property is applied if the parent state property is missing
         *
         * @function _defaultState
         * @private
         * @param {Object} state original state
         * @param {Object} stateDefaults state defaults
         * @param {Object} parentState [optional={}] parent defaulted values if child of a dynamic wms layer
         * @return {Object} defaulted state object
         */
        function _defaultState(state = {}, stateDefaults, parentState = {}) {
            const properies = [
                'opacity', 'visibility', 'boundingBox', 'query', 'snapshot', 'userAdded'
            ];

            properies.forEach(propName => {
                if (typeof state[propName] === 'undefined') {
                    state[propName] = typeof parentState[propName] !== 'undefined' ?
                        parentState[propName] :
                        stateDefaults[propName];
                }
            });

            return state;
        }

        /**
         * Applies controls defaults to the supplied layer node/entry controls (can be controls, disabledControls or userDisabledControls).
         * Controls are defaulted in the following order:
         * - own controls specified
         *   - parent controls specified
         *     - return intersect between own, parent and available controls
         *   - parent controls are not specified
         *     - return intersect between own and available controls
         * - own controls are not specified
         *   - parent controls specified
         *     - return intersect between parent and availalbe controls
         *   - parent controls are not specified
         *     - return default controls
         *
         * @function _defaultControls
         * @private
         * @param {Array} controls original controls
         * @param {Array} controlsDefault controls defaults
         * @param {Array} controlsAvailable controls which are available on this layer type
         * @param {Array} controlsParent [optional={}] parent defaulted values if child of a dynamic wms layer
         * @return {Array} defaulted state object
         */
        function _defaultControls(controls, controlsDefault, controlsAvailable, controlsParent) {
            let result = controls;

            if (typeof controls === 'undefined') {
                if (typeof controlsParent !== 'undefined') {
                    result = common.intersect(controlsParent, controlsAvailable);
                } else {
                    result = angular.copy(controlsDefault);
                }
            } else {
                if (typeof controlsParent !== 'undefined') {
                    result = common.intersect(controls, controlsParent);
                }
            }

            // this will just remove names that are not controls or not available on this layer type
            return common.intersect(result, controlsAvailable);
        }
    }

    class FilterNode {
        constructor(source = {}) {
            this._source = source;

            this._type = source.type;
            this._value = source.value;
            this._static = source.static || false;
        }

        get type () { return this._type; }

        get value () { return this._value; }
        set value (value) { this._value = value; }

        get static () { return this._static; }

        get JSON () {
            return {
                type: this.type,
                value: this.value,
                static: this.static
            }
        }
    }

    class ColumnNode {
        constructor(source = {}) {
            this._source = source;

            this._data = source.data;
            this._title = source.title;
            this._description = source.description;
            this._visible = typeof source.visible !== 'undefined' ? source.visible : true;
            this._width = source.width;
            this._sort = source.sort;
            this._searchable = typeof source.searchable !== 'undefined' ? source.searchable : true;
            this._filter = new FilterNode(source.filter);
        }

        get data () { return this._data; }
        get title () { return this._title; }
        get description () { return this._description; }
        get visible () { return this._visible; }
        get width () { return this._width; }
        get sort () { return this._sort; }
        get searchable () { return this._searchable; }
        get filter () { return this._filter; }

        get JSON () {
            return {
                data: this.data,
                title: this.title,
                description: this.description,
                visible: this.visible,
                width: this.width,
                sort: this.sort,
                searchable: this.searchable,
                filter: this.filter.JSON
            }
        }
    }

    class TableNode {
        constructor(source = {}) {
            this._source = source;

            this._title = source.title || '';
            this._description = source.description;
            this._maximize = source.maximize || false;
            this._search = source.search;
            this._applyMap = source.applyMap || false;
            this._applied = source.applyMap || false;
            this._columns = source.columns ?
                source.columns.map(columnsSource =>
                    (new ColumnNode(columnsSource))) :
                [];
        }

        get title () { return this._title; }
        get description () { return this._description; }

        get maximize () { return this._maximize; }
        set maximize (value) { this._maximize = value; }

        get search () { return this._search; }

        get applyMap () { return this._applyMap; }
        set applyMap (value) { this._applyMap = value; }

        get columns () { return this._columns; }
        set columns (value) { this._columns = value; }

        get applied () { return this._applied; }
        set applied (value) { this._applied = value; }

        get JSON () {
            return {
                title: this.title,
                description: this.description,
                maximize: this.maximize,
                search: this.search,
                applyMap: this.applyMap,
                columns: this.columns.JSON
            }
        }
    }

    /**
     * Creates column nodes for layers without pre-defined table property with columns (used for filters)
     *
     * @function createColumnNode
     * @param {Object} column original column object
     * @param {Object} displayData
     * @return {ColumnNode} a ColumnNode with required values applied
     */
    function createColumnNode(column, fields) {
        delete column.sort;
        delete column.width;

        switch (fields.find(field => field.name === column.data).type) {
            case 'esriFieldTypeString':
                column.filter.type = 'string';
                break;
            case 'esriFieldTypeDate':
                column.filter.type = 'rv-date';
                break;
            default:
                column.filter.type = 'number';
        }

        return new ColumnNode(column);
    }

    // abstract
    class LayerNode {
        /**
         *
         * @param {Object} source a well-formed layer config object
         */
        constructor (source) {

            this._source = source;
            this._id = source.id;
            this._layerType = source.layerType;
            this._name = source.name;
            this._url = source.url;
            this._metadataUrl = source.metadataUrl;
            this._catalogueUrl = source.catalogueUrl;
            this._extent = source.extent ?
                gapiService.gapi.Map.getExtentFromJson(source.extent) :
                undefined;
            this._refreshInterval = typeof source.refreshInterval !== 'undefined' ? source.refreshInterval : 0;

            const defaults = DEFAULTS.layer[this.layerType];

            const defaultedSource = applyLayerNodeDefaults(source, defaults);

            this._state = new InitialLayerSettings(defaultedSource.state);
            this._controls = defaultedSource.controls;
            this._disabledControls = defaultedSource.disabledControls;
            this._userDisabledControls = defaultedSource.userDisabledControls;
            this._initialFilteredQuery = defaultedSource.initialFilteredQuery;
            this._toggleSymbology = typeof source.toggleSymbology === 'boolean' ? source.toggleSymbology : true;

            // remove metadata control if no metadata url is specified after applying defaults
            if (!source.metadataUrl) {
                common.removeFromArray(this._controls, 'metadata');
            }
        }

        get source () {                 return this._source; }

        get id () {                     return this._id; }
        get layerType () {              return this._layerType; }

        get name () {                   return this._name; }
        set name (value) {              this._name = value; }

        get url () {                    return this._url; }
        get metadataUrl () {            return this._metadataUrl; }
        get catalogueUrl () {           return this._catalogueUrl; }
        get extent () {                 return this._extent; }

        get refreshInterval () {        return this._refreshInterval; }
        set refreshInterval (value) {   this._refreshInterval = value; }

        get initialFilteredQuery() { return this._initialFilteredQuery; }
        set initialFilteredQuery(value) { this._initialFilteredQuery = value; }
        get toggleSymbology() { return this._toggleSymbology; }

        _hovertipEnabled = false;
        get hovertipEnabled () {        return this._hovertipEnabled; }
        set hovertipEnabled (value) {   this._hovertipEnabled = value; }

        /**
         * @return {Array} an array of control names which are visible in UI;
         * if a control name is not specified here, its value is blocked from modification
         */
        get controls () { return this._controls; }
        /**
         * @return {Array} an array of control names whose values are immutable;
         * this can be used to block a control which is already visible (in the `controls` array), so it becomes a static indicator of the current state value;
         * specifying a control which is not visibile (not in the `controls` array) will not have any effect
         */
        get disabledControls () { return this._disabledControls; }
        /**
         * @return {Array} an array of control names whose values are blocked from modification by the user;
         * they can be changed by the system in some circumstances;
         * this is internal property and should not be avaialbe in the schema;
         * one use example is opacity on dynamic children whose parent layer is not a true dynamic - the child opacity
         * control is blocked to the user, but is still availabe to the system as child opacity will just reflect the opacity of the layer itself;
         */
        get userDisabledControls () {   return this._userDisabledControls; }
        get state () {                  return this._state; }

        applyBookmark (value) {
            this._state = new InitialLayerSettings(value.state);
            this._source.state = value.state;
        }

        get JSON() {
            return {
                id: this.id,
                name: this.name,
                url: this.url,
                metadataUrl: this.metadataUrl,
                catalogueUrl: this.catalogueUrl,
                layerType: this.layerType,
                extent: this.source.extent,
                refreshInterval: this.refreshInterval,
                controls: this.controls,
                disabledControls: this.disabledControls,
                state: this.state.JSON
            };
        }
    }

    class BasicLayerNode extends LayerNode {
        constructor (source) {
            super(source);
        }

        get JSON() {
            return super.JSON;
        }
    }

    class FeatureLayerNode extends LayerNode {
        constructor (source) {
            super(source);

            this._nameField = source.nameField;
            this._tolerance = source.tolerance || 5;
            this._table = new TableNode(source.table);
        }

        _hovertipEnabled = true;

        get nameField () { return this._nameField; }
        set nameField (value) { this._nameField = value; }

        get tolerance () { return this._tolerance; }
        get table () { return this._table; }

        get queryUrl () { return this._queryUrl; }

        get JSON() {
            return angular.merge(super.JSON, {
                nameField: this.nameField,
                tolerance: this.tolerance,
                table: this.table.JSON
            });
        }
    }

    // abstract
    class LayerEntryNode {
        constructor (source) {
            this._source = source;

            this._index = source.index;
            this._name = source.name;

            // the initial filters to be applied for the layer
            // applied on source object so the property is not lost when applying layer node defaults
            this._initialFilteredQuery = source.initialFilteredQuery;

            // state and controls defaults cannot be applied here;
            // need to wait until dynamic/wms layer is loaded before parent/child defaulting can be applied; this is done in the legend service;
            this._indent = source.indent || '';
            this._state = new InitialLayerSettings(source.state || {});
            this._controls = source.controls;
            this._disabledControls = source.disabledControls;
            this._userDisabledControls = source.userDisabledControls;
        }

        get source () { return this._source; }

        get index () { return this._index; }
        get name () { return this._name; }
        get controls () { return this._controls; }
        get disabledControls () { return this._disabledControls; }
        get userDisabledControls () { return this._userDisabledControls; }
        get indent () { return this._indent; }
        get state () { return this._state; }

        get initialFilteredQuery() { return this._initialFilteredQuery; }
        set initialFilteredQuery(value) { this._initialFilteredQuery = value; }

        applyBookmark (value) {
            this._state = new InitialLayerSettings(value.state);
            this._source.state = value.state;
        }

        get JSON () {
            return {
                index: this.index,
                name: this.name,
                state: this.state.JSON,
                controls: this.controls,
                disabledControls: this.disabledControls
            }
        }
    }

    class WMSLayerEntryNode extends LayerEntryNode {
        constructor (source) {
            super(source);

            this._level = source.level;
            this._desc = source.desc;
            this._id = source.id;
            this._allStyles = source.allStyles;
            this._styleToURL = source.styleToURL;
            this._currentStyle = source.currentStyle;
        }

        get level () { return this._level; }
        get desc () { return this._desc; }
        get id () { return this._id; }

        get layerType () { return layerTypes.OGC_WMS; }

        get allStyles () { return this._allStyles; }
        get styleToURL () { return this._styleToURL; }

        get currentStyle () { return this._currentStyle; }
        set currentStyle (value) { this._currentStyle = value; }

        get JSON() {
            return angular.merge(super.JSON, {
                id: this.id,
                allStyles: this.allStyles,
                styleToURL: this.styleToURL,
                currentStyle: this.currentStyle
            });
        }
    }

    class WMSLayerNode extends LayerNode {
        constructor (source) {
            super(source);

            this._layerEntries = source.layerEntries.map(layerEntry =>
                (new WMSLayerEntryNode(layerEntry)));
            this._featureInfoMimeType = source.featureInfoMimeType;
            this._legendMimeType = source.legendMimeType || "image/png";
        }

        get layerEntries () { return this._layerEntries; }
        /**
         * @param {Array} value an array of WMSLayerEntryNode layer entries
         */
        set layerEntries (value = []) {
            this._layerEntries = value;
        }
        get featureInfoMimeType () { return this._featureInfoMimeType; }
        get legendMimeType () { return this._legendMimeType; }

        get JSON() {
            return angular.merge(super.JSON, {
                layerEntries: this.layerEntries.map(layerEntry =>
                    layerEntry.JSON),
                featureInfoMimeType: this.featureInfoMimeType,
                legendMimeType: this.legendMimeType
            });
        }
    }

    class DynamicLayerEntryNode extends LayerEntryNode {
        constructor (source) {
            super(source);

            this._outfields = source.outfields || '*';
            this._stateOnly = source.stateOnly;
            this._extent = source.extent ?
                gapiService.gapi.Map.getExtentFromJson(source.extent) :
                undefined;

            this.isLayerEntry = true;
            this._table = new TableNode(source.table);
        }

        get outfields () { return this._outfields; }
        get stateOnly () { return this._stateOnly; }
        get extent () { return this._extent; }
        get table () { return this._table; }
        get layerType () { return layerTypes.ESRI_DYNAMIC; }

        get JSON() {
            return angular.merge(super.JSON, {
                outfields: this.outfields,
                stateOnly: this.stateOnly,
                extent: this.extent,
                table: this.table.JSON
            });
        }
    }

    class DynamicLayerNode extends LayerNode {
        constructor (source) {
            super(source);

            this._layerEntries = source.layerEntries.map(layerEntry =>
                (new DynamicLayerEntryNode(layerEntry)));
            this._tolerance = source.tolerance;
            this._table = new TableNode(source.table);

            this._singleEntryCollapse = source.singleEntryCollapse === true;
        }

        get layerEntries () { return this._layerEntries; }
        /**
         * @param {Array} value an array of DynamicLayerEntryNode layer entries
         */
        set layerEntries (value = []) {
            this._layerEntries = value;
        }
        get tolerance () { return this._tolerance; }
        get table () { return this._table; }

        get queryUrl () { return this._queryUrl; }

        _singleEntryCollapse = false;
        set singleEntryCollapse (value) {   this._singleEntryCollapse = value; }
        get singleEntryCollapse () {        return this._singleEntryCollapse; }

        _isResolved = false;
        /**
         * tldnr; A resolved dynamic layer has a layerEntry for each legend block rendered in the legend.
         *
         * When a dynamic layer is resolved, it service was contacted, and the underlying hierarchy is retrieved.
         * A layerEntry specified in the initial config file or through the layer import wizard can point to a sub group,
         * and elements of this subgroup need to be retrieved. After the layer loads and child tree is traversed, defaults are computed
         * for all layer entries (specified in the config and autopopulated from the subgroups). New layer entries are dynamically created and
         * added to the layer definition.
         */
        get isResolved () {        return this._isResolved; }
        set isResolved (value) {   this._isResolved = value; }

        applyBookmark (value) {
            super.applyBookmark(value);

            // errored dynamic layers will have no children array bookmarked; use config value
            if (!angular.isArray(value.layerEntries)) {
                return;
            }

            value.layerEntries.forEach(layerEntryBookmark => {
                const existingLayerEntry = this.layerEntries.find(lr => lr.index === layerEntryBookmark.index);
                if (existingLayerEntry) {
                    existingLayerEntry.applyBookmark(layerEntryBookmark);
                } else {
                    this.layerEntries.push(new DynamicLayerEntryNode(layerEntryBookmark));
                }
            });
        }

        get JSON () {
            return angular.merge(super.JSON, {
                layerEntries: this.layerEntries.map(layerEntry =>
                    layerEntry.JSON),
                tolerance: this.tolerance,
                table: this.table.JSON,
                isResolved: this.isResolved
            });
        }
    }

    /**
     * Typed representation of a LodSet specified in the config.
     * @class LodSet
     */
    class LodSet {
        constructor ({ id, lods }) {
            this._id = id;
            this._lods = lods;
        }

        get id () { return this._id; }
        get lods () { return this._lods; }

        get JSON () {
            return {
                id: this.id,
                lods: this.lods
            };
        }
    }

    /**
     * Typed representation of an Extent specified in the config.
     * @class ExtentSet
     */
    class ExtentSet {
        constructor (source) {
            this._source = source;

            this._id = source.id;
            this._spatialReference = source.spatialReference;

            this._default = this._parseExtent(source.default);
            this._full = source.full ? this._parseExtent(source.full) : this._default;
            this._maximum = source.maximum ? this._parseExtent(source.maximum) : this._full;
        }

        get id () { return this._id; }
        get spatialReference () { return this._spatialReference; }

        /**
         * Returns the default extent as an Esri extent object.
         * @return {Object} Esri extent object
         */
        get default () { return this._default; }
        /**
         * Returns the full extent as an Esri extent object.
         * @return {Object} Esri extent object
         */
        get full () { return this._full; }
        /**
         * Returns the maximum extent as an Esri extent object.
         * @return {Object} Esri extent object
         */
        get maximum () { return this._maximum; }

        /**
         * Converts JSON representation of an extent to Esri extent object.
         * @private
         * @param {Object} extent JSON representation of the extent in the form of { xmin: <Number>, xmax: <Number>, ymin: <Number>, ymax: <Number>, spatialReference: { wkid: <Number> }}
         * @return {Object} returns Esri extent object
         */
        _parseExtent (extent) {
            return angular.extend({}, extent, { spatialReference: this._spatialReference });
        }

        get JSON () {
            return {
                id: this.id,
                spatialReference: this.spatialReference,
                // default, full, and maximum cannot change during runtime, so taking the source when serializing
                default: this._source.default,
                full: this._source.full || null,
                maximum: this._source.maximum || null
            };
        }
    }

    class Attribution {
        constructor (source = {}) {
            angular.merge(this._text, source.text);
            angular.merge(this._logo, source.logo);
        }

        _text = {
            enabled: true,
            value: null
        }

        _logo = {
            enabled: true,
            value: null,
            link: null
        }

        get text () { return this._text; }
        get logo () { return this._logo; }

        get JSON () {
            return {
                text: this.text,
                logo: this.logo
            };
        }
    }

    /**
     * Typed representation of a Basemap specified in the config.
     * @class Basemap
     */
    class Basemap {
        constructor ({ id, name, description, typeSummary, layers, thumbnailUrl = null, attribution, opacity = 1,
            altText, zoomLevels = {} }, tileSchema) {
            this._id = id;
            this._name = name;
            this._description = description;
            this._typeSummary = typeSummary;
            this._layers = layers;
            this._url = layers[0].url;
            this._thumbnailUrl = thumbnailUrl;
            this._attribution = attribution;
            this._tileSchema = tileSchema;
            this._opacity = opacity;

            this._altText = altText;
            this._zoomLevels = zoomLevels;
        }

        _isSelected = false;

        get id () {             return this._id; }
        get name () {           return this._name; }
        get description () {    return this._description; }
        get typeSummary () {    return this._typeSummary; }
        get layers () {         return this._layers; }
        get url () {            return this._url; }
        get thumbnailUrl () {   return this._thumbnailUrl; }
        get attribution () {    return this._attribution; }
        get tileSchema () {     return this._tileSchema; }
        get opacity () {        return this._opacity; }
        get altText () {        return this._altText; }
        get zoomLevels () {     return this._zoomLevels; }

        get isSelected () {     return this._isSelected; }
        select () {
            this._isSelected = true;
            return this;
        }
        deselect () {
            this._isSelected = false;
            return this;
        }

        /**
         * Returns an array containing levels of details for the current basemap
         * @return {Array} an array containing levels of details for the current basemap.
         */
        get lods () { return this._tileSchema.lodSet.lods; }

        /**
         * Returns the wkid of the basemap projection.
         * @return {Number} wkid of the basemap projection
         */
        get wkid () { return this.spatialReference.wkid; }

        /**
         * Returns the spatial reference of the basemap tile schema.
         * @return {Object} spatial reference
         */
        get spatialReference () { return this._tileSchema.extentSet.spatialReference;  }

        /**
         * Returns the default extent as an Esri extent object.
         * @return {Object} Esri extent object
         */
        get default () { return this._tileSchema.extentSet.default; }
        /**
         * Returns the full extent as an Esri extent object.
         * @return {Object} Esri extent object
         */
        get full () { return this._tileSchema.extentSet.full; }
        /**
         * Returns the maximum extent as an Esri extent object.
         * @return {Object} Esri extent object
         */
        get maximum () { return this._tileSchema.extentSet.maximum; }

        get JSON () {
            return {
                id: this.id,
                name: this.name,
                description: this.description,
                typeSummary: this.typeSummary,
                altText: this.altText,
                thumbnailUrl: this.thumbnailUrl,
                tileSchemaId: this.tileSchemaId,
                layers: this.layers,
                attribution: this.attribution.JSON,
                zoomLevels: this.zoomLevels
            };
        }
    }

    /**
     * Typed representation of a TileSchema specified in the config.
     * @class TileSchema
     */
    class TileSchema {
        constructor ({ id, lodSetId, name, overviewUrl }, extentSet, lodSet) {
            this._id = id;
            this._name = name;
            this._lodSetId = lodSetId;

            this._overviewUrl = overviewUrl;

            this._extentSet = extentSet;
            this._lodSet = lodSet;
        }

        get name () { return this._name; }
        get id () { return this._id; }

        get overviewUrl () { return this._overviewUrl; }

        get extentSet () { return this._extentSet; }
        get lodSet () { return this._lodSet; }

        /**
         * Create a blank basemap from a basemap with the same tile schema.
         * It's not really a blank basemap, it's a basemap with opacity set to 0.
         *
         * @function makeBlankBasemap
         * @param {Basemap} basemap a basemap to serve as a basis for a blank basemap
         * @return {Basemap} returns a copy of the provided basemap with opacity dialed all the way to 0 to make it appear blank
         */
        makeBlankBasemap(basemap) {
            const blankBasemap = new Basemap({
                name: 'basemap.blank.title',
                description: 'basemap.blank.desc',
                id: `blank_basemap_${basemap.id}`,
                layers: basemap.layers,
                thumbnailUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
                // blank maps have no attributions
                attribution: {
                    text: {
                        enabled: false
                    },
                    logo: {
                        enabled: false
                    }
                },
                opacity: 0
            }, this);

            return blankBasemap;
        }

        // TODO add overviewUrl object to this?
        get JSON () {
            return {
                id: this.id,
                name: this.name,
                extentSetId: this.extentSet.id,
                lodSetId: this.lodSet.id
            };
        }
    }

    class LegendElement {
        constructor() {
            this._id = `${this.entryType}_${++ref.legendElementCounter}`;
        }

        get id () { return this._id; }
    }

    /**
     * Typed representation of a VisibilitySet specified in the config's structured legend.
     * @class VisibilitySet
     */
    class VisibilitySet extends LegendElement {
        constructor (visibilitySetSource) {
            super();
            this._exclusiveVisibility = visibilitySetSource.exclusiveVisibility.map(childConfig =>
                _makeChildObject(childConfig));

            this._walk = ref.walkFunction.bind(this);
        }

        get exclusiveVisibility () { return this._exclusiveVisibility; }

        get entryType () { return TYPES.legend.SET; }

        walk (...args) {
            return this._walk(...args);
        }

        get JSON() {
            return {
                exclusiveVisibility: this.exclusiveVisibility.map(child =>
                    child.JSON),
                entryType: this.entryType
            };
        }
    }

    /**
     * Typed representation of a Entry specified in the config's structured legend.
     * @class Entry
     */
    class Entry extends LegendElement {
        constructor (entrySource) {
            super();
            this._layerId = entrySource.layerId;
            this._controlledIds = entrySource.controlledIds || [];
            this._entryIndex = entrySource.entryIndex;
            this._entryId = entrySource.entryId;
            this._coverIcon = entrySource.coverIcon;
            this._description = entrySource.description || '';
            this._symbologyStack = entrySource.symbologyStack || [];
            this._symbologyRenderStyle = entrySource.symbologyRenderStyle || Entry.ICONS;
            this._hidden = entrySource.hidden === true;

        }

        static ICONS = 'icons';
        static IMAGES = 'images';

        get layerId () {        return this._layerId; }
        get controlledIds () {  return this._controlledIds; }
        get entryIndex () {     return this._entryIndex; }
        get entryId () {        return this._entryId; }
        get coverIcon () {      return this._coverIcon; }
        get description () {    return this._description; }
        get symbologyStack () { return this._symbologyStack; }

        get symbologyRenderStyle () { return this._symbologyRenderStyle; }
        set symbologyRenderStyle (value) { this._symbologyRenderStyle = value; }

        /**
         * Specifies if the legend block should be hidden from the UI.
         *
         * @return {Boolean} if true, the legend block will not be rendered in legend UI
         */
        get hidden () { return this._hidden; }

        get entryType () {              return TYPES.legend.NODE; }

        get JSON() {
            return {
                layerId: this.layerId,
                userAdded: this.userAdded,
                controlledIds: this.controlledIds,
                entryIndex: this.entryIndex,
                entryId: this.entryId,
                coverIcon: this.coverIcon,
                description: this.description,
                symbologyStack: this.symbologyStack,
                symbologyRenderStyle: this.symbologyRenderStyle,
                hidden: this.hidden,
                entryType: this.entryType
            };
        }
    }

    /**
     * Typed representation of a EntryGroup specified in the config's structured legend.
     * @class Entry
     */
    class EntryGroup extends LegendElement {
        constructor (entryGroupSource, type) {
            super();
            this._name = entryGroupSource.name;
            this._children = entryGroupSource.children.map(childConfig =>
                _makeChildObject(childConfig));

            this._controls = angular.isArray(entryGroupSource.controls) ? common.intersect(
                entryGroupSource.controls,
                DEFAULTS.legend[TYPES.legend.GROUP].controls) :
                DEFAULTS.legend[TYPES.legend.GROUP].controls;

            this._disabledControls = angular.isArray(entryGroupSource.disabledControls) ? common.intersect(
                entryGroupSource.disabledControls,
                DEFAULTS.legend[TYPES.legend.GROUP].controls) :
                DEFAULTS.legend[TYPES.legend.GROUP].disabledControls;
            this._userDisabledControls = angular.isArray(entryGroupSource.userDisabledControls) ? common.intersect(
                entryGroupSource.userDisabledControls,
                DEFAULTS.legend[TYPES.legend.GROUP].controls) :
                [];

            this._expanded = entryGroupSource.expanded || false;

            this._walk = ref.walkFunction.bind(this);
        }

        get name () { return this._name; }
        get children () { return this._children; }
        get controls () { return this._controls; }
        get disabledControls () { return this._disabledControls; }
        get userDisabledControls () { return this._userDisabledControls; }
        get expanded () { return this._expanded; }

        get entryType () { return TYPES.legend.GROUP; }

        walk (...args) {
            return this._walk(...args);
        }

        get JSON() {
            return {
                name: this.name,
                children: this.children.map(child =>
                    child.JSON),
                controls: this.controls,
                disabledControls: this.disabledControls,
                expanded: this.expanded,
                entryType: this.entryType
            };
        }
    }

    /**
     * Typed representation of a InfoSection specified in the config's structured legend.
     * @class InfoSection
     */
    class InfoSection extends LegendElement {
        constructor (entrySource) {
            super();
            this._infoType = entrySource.infoType;
            this._content = entrySource.content;

            this._layerName = entrySource.layerName || '';
            this._description = entrySource.description || '';
            this._symbologyStack = entrySource.symbologyStack || [];
            this._symbologyRenderStyle = entrySource.symbologyRenderStyle || Entry.ICONS;
        }

        get infoType () {               return this._infoType; }
        get content () {                return this._content; }

        get layerName () {              return this._layerName; }
        get description () {            return this._description; }
        get symbologyStack () {         return this._symbologyStack; }
        get symbologyRenderStyle () {   return this._symbologyRenderStyle; }

        get entryType () { return TYPES.legend.INFO; }

        get JSON() {
            return {
                infoType: this.infoType,
                content: this.content,
                entryType: this.entryType,
                layerName: this.layerName,
                description: this.description,
                symbologyStack: this.symbologyStack,
                symbologyRenderStyle: this.symbologyRenderStyle
            };
        }
    }

    /**
     * Typed representation of a Legend specified in the config. If the legend's type is set as `autopopulate`, the structured legend (exclusively consisting of Entry objects) is generated based on the layer definition list.
     * Defaulting of the legend entries happens here as opposed to defaulting of layer definition which occurs in the layer blueprint.
     * @class Legend
     */
    class Legend {
        constructor (legendSource, layersSource) {
            this._type = legendSource.type;

            let rootChildren;

            if (this._type === TYPES.legend.AUTOPOPULATE) {
                // since auto legend is a subset of structured legend, its children are automatically populated
                const sortGroups = Geo.Layer.SORT_GROUPS_;

                // with autolegend, the layer list is pre-sorted according to the sort groups, and layer names
                rootChildren = layersSource
                    .sort((a, b) => {
                        if (sortGroups[a.layerType] < sortGroups[b.layerType]) {
                            return -1;
                        } else if ((sortGroups[a.layerType] > sortGroups[b.layerType])) {
                            return 1;
                        }

                        return 0;
                    })
                    .map(layerDefinition =>
                        ({
                            layerId: layerDefinition.id,
                            // in auto legend, default wms symbology to images;
                            symbologyRenderStyle:
                                layerDefinition.layerType === layerTypes.OGC_WMS ?
                                    Entry.IMAGES : Entry.ICONS
                        }));

            } else {
                rootChildren = legendSource.root.children;
            }

            this._root = new EntryGroup({
                name: 'I\'m root',
                children: rootChildren
            });

            function _removeControlOption(controlsArray = [], controlName = '') {
                common.removeFromArray(controlsArray, controlName);
            }
        }

        get type () { return this._type; }
        get root () { return this._root; }

        /**
         * Inserts a child into the root group of the legend config.
         * Unless specified, the child is inserted at the top of the legend.
         *
         * @function addChild
         * @param {LegendElement} child a legendElement child to be inserted
         * @param {Number} [position=0] to be inserted at
         */
        addChild (child, position = 0) {
            this._root.children.splice(position, 0, child);
        }

        get JSON() {
            return {
                type: this.type,
                root: this.root.JSON
            };
        }
    }

    function _makeChildObject (childConfig) {
        const LEGEND_TYPE_TO_CLASS = {
            [TYPES.legend.INFO]: InfoSection,
            [TYPES.legend.NODE]: Entry,
            [TYPES.legend.GROUP]: EntryGroup,
            [TYPES.legend.SET]: VisibilitySet
        };
        const childType = _detectChildType(childConfig);

        return new LEGEND_TYPE_TO_CLASS[childType](childConfig, childType);

        function _detectChildType(child) {
            if (typeof child.infoType !== 'undefined') {
                return TYPES.legend.INFO;
            } else if (typeof child.exclusiveVisibility !== 'undefined') {
                return TYPES.legend.SET;
            } else if (typeof child.children !== 'undefined') {
                return TYPES.legend.GROUP;
            }

            return TYPES.legend.NODE;
        }
    }

    class ComponentBase {
        constructor (source = { enabled: true }) {
            this._source = source;

            this._enabled = source.enabled;
        }

        get enabled () { return this._enabled; }

        get body () { return this._body; }
        set body (value) {
            if (this._body) {
                console.warn('Component\' body is already set');
            } else {
                this._body = value;
            }
        }

        get JSON() {
            return {
                enabled: this.enabled
            };
        }
    }

    class GeoSearchComponent extends ComponentBase {
        constructor (source) {
            super(source);

            this._showGraphic = source.showGraphic;
            this._showInfo = source.showInfo;
            this._enabled = source.enabled;
        }

        get showGraphic () { return this._showGraphic; }
        get showInfo () { return this._showInfo; }
        get enabled () { return this._enabled; }

        set enabled (val) { this._enabled = val; }

        get JSON() {
            return angular.merge(super.JSON, {
                showGraphic: this.showGraphic,
                showInfo: this.showInfo,
                enabled: this.enabled
            });
        }
    }

    class MouseInfoComponent extends ComponentBase {
        constructor (source) {
            super(source);

            this._spatialReference = source.spatialReference;
        }

        get spatialReference () { return this._spatialReference; }

        get JSON() {
            return angular.merge(super.JSON, {
                spatialReference: this.spatialReference
            });
        }
    }

    class NorthArrowComponent extends ComponentBase {
        constructor (source) {
            super(source);
        }

        get JSON() {
            return super.JSON;
        }
    }

    class OverviewMapComponent extends ComponentBase {
        constructor (source) {
            super(source);

            this._maximizeButton = source.maximizeButton;
            this._layerType = source.layerType;
            this._expandFactor = source.expandFactor || 2;
            this._initiallyExpanded = typeof source.initiallyExpanded !== 'undefined' ? source.initiallyExpanded : true;
        }

        get maximizeButton () { return this._maximizeButton; }
        get layerType () { return this._layerType; }
        get expandFactor () { return this._expandFactor; }
        get initiallyExpanded () { return this._initiallyExpanded; }

        get JSON() {
            return angular.merge(super.JSON, {
                maximizeButton: this.maximizeButton,
                layerType: this.layerType,
                expandFactor: this.expandFactor,
                initiallyExpanded: this.initiallyExpanded
            });
        }
    }

    class ScaleBarComponent extends ComponentBase {
        constructor (source) {
            super(source);
        }

        get attachTo () { return 'bottom-right'; }
        get scalebarUnit () { return 'dual'; }

        get JSON() {
            return angular.merge(super.JSON, {
                attachTo: this.attachTo,
                scalebarUnit: this.scalebarUnit
            });
        }
    }

    class BasemapComponent extends ComponentBase {
        constructor (source) {
            super(source);
        }
    }

    class Components {
        constructor (componentsSource) {
            this._source = componentsSource;

            this._geoSearch = new GeoSearchComponent(componentsSource.geoSearch);
            this._mouseInfo = new MouseInfoComponent(componentsSource.mouseInfo);
            this._northArrow = new NorthArrowComponent(componentsSource.northArrow);
            this._overviewMap = new OverviewMapComponent(componentsSource.overviewMap);
            this._scaleBar = new ScaleBarComponent(componentsSource.scaleBar);
            this._basemap = new BasemapComponent(componentsSource.basemap);
        }

        get geoSearch () { return this._geoSearch; }
        get mouseInfo () { return this._mouseInfo; }
        get northArrow () { return this._northArrow; }
        get overviewMap () { return this._overviewMap; }
        get scaleBar () { return this._scaleBar; }
        get basemap () { return this._basemap; }

        get JSON() {
            return {
                geoSearch: this.geoSearch.JSON,
                mouseInfo: this.mouseInfo.JSON,
                northArrow: this.northArrow.JSON,
                overviewMap: this.overviewMap.JSON,
                scaleBar: this.scaleBar.JSON,
                basemap: this.basemap.JSON
            };
        }
    }

    class SearchService {
        constructor (source) {
            this._disabledSearches = source.disabledSearches;
            this._serviceUrls = source.serviceUrls;
        }

        get disabledSearches () { return this._disabledSearches; }
        get serviceUrls () { return this._serviceUrls; }

        get JSON() {
            return {
                disabledSearches: this.disabledSearches,
                serviceUrls: this.serviceUrls
            };
        }
    }

    /**
     * Typed representation of the `services.export.[components]` section of the config (excluding the legend).
     * @class ExportComponent
     */
    class ExportComponent {
        constructor (source = { value: '', isSelectable: false, isSelected: false, isVisible: false }) {
            this._isSelected = source.isSelected;
            this._isSelectable = source.isSelectable;
            this._isVisible = source.isVisible;
            this._value = source.value;
        }

        get isSelected () {         return this._isSelected; }
        set isSelected (value) {    this._isSelected = value; }
        get isSelectable () {       return this._isSelectable; }
        set isSelectable (value) {  this._isSelectable = value; }
        get isVisible () {          return this._isVisible; }
        set isVisible (value) {     this._isVisible = value; }
        get value () {              return this._value; }
        set value (value) {         this._value = value; }

        _generators = [];
        _graphicOrder = null;

        get generators () { return this._generators; }
        set generators(value = []) { this._generators = value; }
        get graphicOrder () { return this._graphicOrder; }
        set graphicOrder(value = null) { this._graphicOrder = value; }

        get JSON() {
            return {
                isSelected: this.isSelected,
                isSelectable: this.isSelectable,
                isVisible: this.isVisible,
                value: this.value
            };
        }
    }

    /**
     * Typed representation of the `services.export.legend` section of the config.
     * @class LegendExportComponent
     */
    class LegendExportComponent extends ExportComponent {
        constructor (source) {
            super(source);

            this._showInfoSymbology = source.showInfoSymbology || false;
            this._showControlledSymbology = source.showControlledSymbology || false;
        }

        get showInfoSymbology () {      return this._showInfoSymbology; }
        set showInfoSymbology (value) { this._showInfoSymbology = value; }

        get showControlledSymbology () {      return this._showControlledSymbology; }
        set showControlledSymbology (value) { this._showControlledSymbology = value; }

        get JSON() {
            return angular.merge(super.JSON, {
                showInfoSymbology: this.showInfoSymbology,
                showControlledSymbology: this.showControlledSymbology
            });
        }
    }

    /**
     * Typed representation of the `services.export` section of the config.
     * @class ExportService
     */
    class ExportService {
        constructor (source) {
            this._title = new ExportComponent(source.title);
            this._title.isVisible = false; // rendered export title should not be visible in the ui
            this._map = new ExportComponent(source.map);
            this._mapElements = new ExportComponent(source.mapElements);
            this._legend = new LegendExportComponent(source.legend);
            this._footnote = new ExportComponent(source.footnote);
            this._timestamp = new ExportComponent(source.timestamp);
        }

        get title () { return this._title; }
        get map () { return this._map; }
        get mapElements () { return this._mapElements; }
        get legend () { return this._legend; }
        get footnote () { return this._footnote; }
        get timestamp () { return this._timestamp; }

        get JSON() {
            return {
                title: this.title.JSON,
                map: this.map.JSON,
                mapElements: this.mapElements.JSON,
                legend: this.legend.JSON,
                footnote: this.footnote.JSON,
                timestamp: this.timestamp.JSON
            };
        }
    }

    /**
     * Typed representation of the `services` section of the config.
     * @class Services
     */
    class Services {
        constructor (source) {
            this._proxyUrl = source.proxyUrl;
            this._exportMapUrl = source.exportMapUrl;
            this._geometryUrl = source.geometryUrl;
            this._googleAPIKey = source.googleAPIKey;
            this._geolocation = source.geolocation;
            this._coordInfo = source.coordInfo;
            this._print = source.print;
            this._search = new SearchService(source.search || {}) // source.search;
            this._export = new ExportService(source.export || {});
            this._rcsEndpoint = source.rcsEndpoint;
        }

        get proxyUrl () { return this._proxyUrl; }
        get exportMapUrl () { return this._exportMapUrl; }
        get geometryUrl () { return this._geometryUrl; }
        get googleAPIKey () { return this._googleAPIKey; }
        get geolocation () { return this._geolocation; }
        get coordInfo () { return this._coordInfo; }
        get print () { return this._print; }
        get search () { return this._search; }
        get export () { return this._export; }
        get rcsEndpoint () { return this._rcsEndpoint; }

        get JSON() {
            return {
                proxyUrl: this.proxyUrl,
                exportMapUrl: this.exportMapUrl,
                geometryUrl: this.geometryUrl,
                googleAPIKey: this.googleAPIKey,
                geolocation: this.geolocation,
                coordInfo: this.coordInfo,
                print: this.print,
                search: this.search,
                export: this.export,
                rcsEndpoint: this.rcsEndpoint
            };
        }
    }

    /**
     * A map center point. Used in bookmarking. Passed to the config through the `applyBookmark` function.
     * @class StartPoint
     */
    class StartPoint {
        constructor({ x, y, scale }) {
            this._x = parseFloat(x);
            this._y = parseFloat(y);
            this._scale = scale;
        }

        get x () {      return this._x; }
        get y () {      return this._y; }
        get scale () {  return this._scale; }
    }

    /**
     * Typed representation of the `map` section of the config.
     * @class Map
     */
    class Map {
        constructor (mapSource) {
            this._source = mapSource;

            this._extentSets = mapSource.extentSets.map(extentSetSource =>
                (new ExtentSet(extentSetSource)));

            this._lodSets = mapSource.lodSets.map(lodSetSource =>
                (new LodSet(lodSetSource)));

            this._tileSchemas = mapSource.tileSchemas.map(tileSchemaSource => {
                const extentSet = this._extentSets.find(extentSet =>
                    extentSet.id === tileSchemaSource.extentSetId)

                const lodSet = this._lodSets.find(lodSet =>
                    lodSet.id === tileSchemaSource.lodSetId);

                const tileSchema = new TileSchema(tileSchemaSource, extentSet, lodSet);

                return tileSchema;
            });

            // TODO: if basemaps are optional, here we need to generate a blank basemap for every tileSchema
            this._basemaps = mapSource.baseMaps.map(basemapSource => {
                const tileSchema = this._tileSchemas.find(tileSchema =>
                    tileSchema.id === basemapSource.tileSchemaId);

                const basemap = new Basemap(basemapSource, tileSchema);

                return basemap;
            });

            // making a blank basemap;
            // find a first basemap in this tileschema and create a copy settign its opacity to 0
            this._tileSchemas.forEach(tileSchema => {
                const basemap = mapSource.baseMaps.find(basemapSource =>
                    tileSchema.id === basemapSource.tileSchemaId);

                if (basemap) {
                    const blankBasemap = tileSchema.makeBlankBasemap(basemap);
                    this._basemaps.push(blankBasemap);
                }
            });

            // calling select on a basemap only marks it as `selected`; to actually change the displayed basemap, call `changeBasemap` on `geoService`
            (mapSource.initialBasemapId ?
                this._basemaps.find(basemap =>
                    basemap.id === mapSource.initialBasemapId) :
                this._basemaps[0])
                .select();

            this._layers = mapSource.layers;
            this._legend = new Legend(mapSource.legend, this._layers);

            this._components = new Components(mapSource.components);
        }

        get source () { return this._source; }

        get tileSchemas () { return this._tileSchemas; }
        get basemaps () { return this._basemaps; }
        get extentSets () { return this._extentSets; }
        get lodSets () { return this._lodSets; }

        get layers () {         return this._layers; }
        set layers (value) {    this._layers = value; }

        get legend () { return this._legend; }
        get components () { return this._components; }

        get selectedBasemap () { return this._basemaps.find(basemap => basemap.isSelected); }

        // --- //

        _layerRecords = [];
        _layerBlueprints = [];
        _boundingBoxRecords = [];
        _legendBlocks = null;
        // holds an array of references to the legendBlock and the corresponding blockConfig objects that belong to a particular layerRecord in the form of
        // { <layerRecordId>: [ { legendBlockId: <String>, blockConfigId: <String> }, ... ] }
        _legendMappings = {};
        _highlightLayer = null;

        get layerRecords () {               return this._layerRecords; }
        set layerRecords (value) {          this._layerRecords = value; }

        get layerBlueprints () {            return this._layerBlueprints; }
        set layerBlueprints (value) {       this._layerBlueprints = value; }

        get boundingBoxRecords () {         return this._boundingBoxRecords; }
        set boundingBoxRecords (value) {    this._boundingBoxRecords = value; }

        get legendBlocks () {               return this._legendBlocks; }
        set legendBlocks (lb) {             this._legendBlocks = lb; }

        get legendMappings () {             return this._legendMappings; }
        set legendMappings (value) {        this._legendMappings = value; }

        get highlightLayer () {             return this._highlightLayer; }
        set highlightLayer (value) {        this._highlightLayer = value; }

        get instance () {                   return this._instance; }

        // this indicates that the map finished loading the initial basemap and data layers can be safely added
        get isLoaded () {                   return this._isLoaded; }
        set isLoaded (value) {              this._isLoaded = value; }

        storeMapReference(instance) {

            // Begin hooking API into instance functions -------------------------------
            events.$on(events.rvApiMapAdded, (_, mapInstance) => {
                mapInstance.zoomChanged = Observable.create(subscriber => {
                    const originalSetZoom = instance.setZoom;
                    instance.setZoom = function() {
                        subscriber.next(arguments[0]);
                        return originalSetZoom.apply(this, arguments);
                    }
                });

                mapInstance.boundsChanged = Observable.create(subscriber => {
                    events.$on(events.rvExtentChange, (_, d) => subscriber.next(extentToApi(d.extent)));
                });

                mapInstance.centerChanged = Observable.create(subscriber => {
                    events.$on(events.rvExtentChange, (_, d) => {
                        const centerXY = d.extent.getCenter();

                        subscriber.next(pointToApi(centerXY.x, centerXY.y));
                    });
                });
            });

            function extentToApi(extent) {
                const xy = gapiService.gapi.proj.localProjectExtent(extent, 4326);
                return new XYBounds([xy.x1, xy.y1], [xy.x0, xy.y0]);
            }

            function pointToApi(x, y) {
                const xy = gapiService.gapi.proj.localProjectPoint(instance.spatialReference.wkid, 4326, [x, y]);
                return new XY(xy[0], xy[1]);
            }

            this._instance = instance;
            this._isLoaded = false;
        }

        _isLoading = true;
        get isLoading () { return this._isLoading; }
        set isLoading (value) { this._isLoading = value;}

        _startPoint = null;
        get startPoint () {         return this._startPoint; }
        set startPoint (value) {    this._startPoint = value; }

        /**
         * Resets all previously created map constructs like layer records, legend blocks, and legend mappings.
         * Settings provided by the initial config like layer list and legend order are not modified.
         *
         * @function reset
         */
        reset () {
            // remove all previosly createad layer constructs
            this._layerBlueprints = [];
            this._layerRecords = [];
            this._legendBlocks = null;
            this._legendMappings = {};

            this._instance = null;
            this._highlightLayer = null;
        }

        applyBookmark (value) {
            // apply new basemap
            this.selectedBasemap.deselect();
            this._basemaps.find(basemap => basemap.id === value.basemap).select();

            // apply starting point
            this.startPoint = new StartPoint(value);

            if (this.legend.type === TYPES.legend.AUTOPOPULATE) {
                // filter out layers that are not present in the bookmark preserving the bookmark layer order
                this._layers = value.bookmarkLayers.map(bookmarkedLayer =>
                    this._layers.find(layer => layer.id === bookmarkedLayer.id));
            }

            // re-create the legend structure
            // - in auto legend, this will generate the legend using the order of the layers array (in cases where it was modified by the bookmark)
            // - in structured legend, this will strip all the user-added layers that were added to the legend structure
            this._legend = new Legend(this.source.legend, this._layers);
        }

        get JSON() {
            return {
                initialBasemapId: this.source.initialBasemapId,
                components: this.components.JSON,
                extentSets: this.extentSets.JSON,
                lodSets: this.lodSets.JSON,
                // FIXME: write serialization functions for legend objects; will be used in full state restore
                // legend: this.legendBlocks.map(legendBlock => legendBlock.JSON),
                layers: this.layerRecords.map(layerRecord => layerRecord.JSON),
                tileSchemas: this.tileSchemas.JSON,
                basemaps: this.basemaps.JSON
            };
        }
    }

    class AppBar {
        constructor(source = {}) {
            this._sideMenu = source.sideMenu !== false;
            this._geoSearch = source.geoSearch !== false;
            this._basemap = source.basemap !== false;
            this._layers = source.layers !== false;
        }

        get sideMenu () {   return this._sideMenu; }
        get geoSearch () {  return this._geoSearch; }
        get basemap () {    return this._basemap; }
        get layers () {     return this._layers; }

        get enabled () {    return this.sideMenu || this.geoSearch || this.layers || this.basemap; }
        get sideMenuOnly () {
            return this.sideMenu && !this.geoSearch && !this.layers && !this.basemap;
        }

        get JSON () {
            return {
                sideMenu: this.sideMenu,
                geoSearch: this.geoSearch,
                basemap: this.basemap,
                layers: this.layers
            };
        }
    }

    /**
     * Typed representation of the `ui.navBar` section of the config.
     * @class NavBar
     */
    class NavBar {
        constructor(source = {}) {
            this._source = source;
            this._zoom = source.zoom || 'buttons';
            this._extra = angular.isArray(source.extra) ?
                common.intersect(source.extra, NavBar.EXTRA_AVAILABLE_ITEMS) :
                angular.copy(NavBar.EXTRA_ITEMS_DEFAULT);
        }

        get zoom () { return this._zoom; }
        get extra () { return this._extra; }

        get JSON () {
            return {
                zoom: this.zoom,
                extra: this.extra
            }
        }

        static EXTRA_ITEMS_DEFAULT = [
            'fullscreen',
            'geoLocator',
            'home',
            'help'
        ];

        static EXTRA_AVAILABLE_ITEMS = [
            'history',
            'geoSearch',
            'fullscreen',
            'marquee',
            'home',
            'help',
            'geoLocator',
            'basemap',
            'sideMenu',
            'layers'
        ];
    }

    /**
     * Typed representation of the `ui.sideMenu` section of the config.
     * @class SideMenu
     */
    class SideMenu {
        constructor(source = {}) {
            this._source = source;
            this._logo = source.logo === true;

            this._items = angular.isArray(source.items) ?
                source.items.map(subItems => common.intersect(subItems, SideMenu.AVAILABLE_ITEMS)) :
                angular.copy(SideMenu.ITEMS_DEFAULT);
        }

        static ITEMS_DEFAULT = [
            [
                'layers',
                'basemap'
            ],
            [
                'fullscreen',
                'export',
                'share',
                'touch',
                'help',
                'about'
            ],
            [
                'language'
            ],
            [
                'plugins'
            ]
        ];

        static AVAILABLE_ITEMS = [
            'layers',
            'geoSearch',
            'basemap',
            'about',
            'fullscreen',
            'export',
            'share',
            'touch',
            'help',
            'language'
        ];

        get source () { return this._source; }

        get logo () { return this._logo; }
        get items () { return this._items; }

        get JSON () {
            return {
                logo: this.logo,
                items: this.items
            }
        }
    }

    /**
     * Typed representation of the `ui.legend.isOpen` section of the config.
     * @class LegendIsOpen
     */
    class LegendIsOpen {
        constructor(source = {}) {
            this._source = source;

            this._large = source.large === true;
            this._medium = source.medium === true;
            this._small = source.small === true;
        }

        get large () { return this._large; }
        get medium () { return this._medium; }
        get small () { return this._small; }

        get JSON () {
            return {
                large: this.large,
                medium: this.medium,
                small: this.small
            }
        }
    }

    /**
     * Typed representation of the `ui.tableIsOpen` section of the config.
     * @class TableIsOpen
     */
    class TableIsOpen {
        constructor(source = {}) {
            this._source = source;

            this._id = source.id;
            this._large = this._id ? source.large : false;
            this._medium = this._id ? source.medium : false;
            this._small = this._id ? source.small : false ;
        }

        get id () { return this._id; }
        get large () { return this._large; }
        get medium () { return this._medium; }
        get small () { return this._small; }

        get JSON () {
            return {
                id: this.id,
                large: this.large,
                medium: this.medium,
                small: this.small
            }
        }
    }

    /**
     * Typed representation of the `ui.help` section of the config.
     * @class Help
     */
    class Help {
        constructor(helpSource = {}) {
            this._source = helpSource;
            this._folderName = helpSource.folderName;
        }

        get folderName () { return this._folderName; }

        get JSON () {
            return {
                folderName: this.folderName
            };
        }
    }

    /**
     * Typed representation of the `ui.about` section of the config.
     * @class About
     */
    class About {
        constructor(aboutSource = {}) {
            this._source = aboutSource;
            this._content = aboutSource.content;
            this._folderName = aboutSource.folderName;
        }

        get content() { return this._content; }
        get folderName() { return this._folderName; }

        get JSON() {
            return {
                content: this.content,
                folderName: this.folderName
            };
        }
    }

    class FaliureFeedback {
        constructor(source = {}) {
            this._source = source;
            this._failureMessage = source.failureMessage;
            this._failureImageUrl = source.failureImageUrl;
        }

        get failureMessage () { return this._failureMessage; }
        get failureImageUrl () { return this._failureImageUrl; }

        get JSON () {
            return {
                failureMessage: this.failureMessage,
                failureImageUrl: this.failureImageUrl
            }
        }
    }

    /**
     * Typed representation of the `ui.legend` section of the config.
     * @class UILegend
     */
    class UILegend {
        constructor(uiLegendSource = {}) {
            this._reorderable = uiLegendSource.reorderable !== false;
            this._allowImport = uiLegendSource.allowImport !== false;
            this._isOpen = new LegendIsOpen(uiLegendSource.isOpen);
        }

        get reorderable () {    return this._reorderable; }
        get allowImport () {    return this._allowImport; }
        get isOpen () {         return this._isOpen; }

        get JSON () {
            return {
                reorderable: this.reorderable,
                allowImport: this.allowImport,
                isOpen: this.isOpen.JSON
            }
        }
    }

    /**
     * Typed representation of the `ui` section of the config.
     * @class ConfigObject.UI
     */
    class UI {
        /**
         * Creates a new typed `UI` construct.
         *
         * @param {Object} uiSource original JSON object
         */
        constructor(uiSource) {
            this._source = uiSource;

            this._appBar = new AppBar(uiSource.appBar);
            this._navBar = new NavBar(uiSource.navBar, uiSource.help);
            this._logoUrl = uiSource.logoUrl || null;
            this._failureFeedback = new FaliureFeedback(uiSource.failureFeedback);
            this._title = uiSource.title || null;
            this._restrictNavigation = uiSource.restrictNavigation === true;
            this._sideMenu = new SideMenu(uiSource.sideMenu, uiSource.help);
            this._legend = new UILegend(uiSource.legend);
            this._help = new Help(uiSource.help);
            this._fullscreen = uiSource.fullscreen;
            this._tableIsOpen = new TableIsOpen(uiSource.tableIsOpen);
            this._about = new About(uiSource.about);
        }

        get source () {                 return this._source; }

        get appBar () {                 return this._appBar; }
        get navBar () {                 return this._navBar; }
        get logoUrl () {                return this._logoUrl; }
        get failureFeedback() {         return this._failureFeedback; }
        get title () {                  return this._title; }
        get restrictNavigation () {     return this._restrictNavigation; }
        get sideMenu () {               return this._sideMenu; }
        get legend () {                 return this._legend; }
        get help () {                   return this._help; }
        get fullscreen () {             return this._fullscreen; }
        get tableIsOpen () {            return this._tableIsOpen; }
        get about() {                   return this._about; }

        get JSON () {
            return {
                appBar: this.appBar.JSON,
                navBar: this.navBar.JSON,
                logoUrl: this.logoUrl,
                failureFeedback: this.failureFeedback.JSON,
                title: this.title,
                restrictNavigation: this.restrictNavigation,
                sideMenu: this.sideMenu.JSON,
                legend: this.legend.JSON,
                help: this.help.JSON,
                fullscreen: this.fullscreen,
                tableIsOpen: this.tableIsOpen.JSON,
                about: this.about.JSON
            }
        }
    }

    /**
     * Typed representation of the app's config.
     * @class ConfigObject
     */
    class ConfigObject {
        /**
         *
         * @param {Object} configSource vanilla json config object loaded into the app by the ConfigService
         */
        constructor (configSource) {
            this._source = configSource;

            this._version = configSource.version;
            this._language = configSource.language;
            this._languages = configSource.languages;

            this._map = new Map(configSource.map);
            this._services = new Services(configSource.services);
            this._ui = new UI(configSource.ui);

            // post parsing runtimechecks
            this.ui.legend._reorderable =
                this.map.legend.type === TYPES.legend.AUTOPOPULATE && this.ui.legend._reorderable;

            // set geoSearch.enable to false if it was false initialy or does not have all services
            this.map.components.geoSearch.enabled = this.map.components.geoSearch.enabled
                && hasAllSearchServices(this.services.search);

            let optionName;

            if (!this.map.components.geoSearch.enabled) {
                optionName = 'geoSearch';

                this.ui.appBar.geoSearch = false;

                this.ui.sideMenu.items.forEach(section =>
                    common.removeFromArray(section, optionName));

                common.removeFromArray(this.ui.navBar.extra, optionName);
            }

            // remove fullscreen option if fullscreen functionality is not available
            if (!screenfull.enabled) {
                optionName = 'fullscreen';

                this.ui.sideMenu.items.forEach(section =>
                    common.removeFromArray(section, optionName));

                common.removeFromArray(this.ui.navBar.extra, optionName);
            }

            // remove help from the side menu and map nav cluster if help or its folderName is absent
            if (!this.ui.help.folderName) {
                common.removeFromArray(this.ui.navBar.extra, 'help');

                this.ui.sideMenu.items.forEach(section =>
                    common.removeFromArray(section, 'help'));
            }

            // remove `about` option if about content or about folder is not provided
            if (!this.ui.about.folderName && !this.ui.about.content) {
                this.ui.sideMenu.items.forEach(section =>
                    common.removeFromArray(section, 'about'));
            }

            /**
             * Return true if all search services are included in the config file, false otherwise
             *
             * @function hasAllSearchServices
             * @private
             * @param   {Object}    search   The search service the config file contains
             * @returns   {boolean}    True if it has all the required geo services, false otherwise
             */
            function hasAllSearchServices(search) {
                const GEOSERVICES = new Set([  // required geo search services
                    'geoNames',
                    'geoLocation',
                    'geoSuggest',
                    'provinces',
                    'types'
                ]);

                // check if the number of all required search services is correct
                if (typeof search === 'undefined' || typeof search.serviceUrls === 'undefined'
                    || Object.keys(search.serviceUrls).length < GEOSERVICES.length) {
                    return false;
                }

                // check if the serives match what were required
                for (let service of GEOSERVICES) {
                    if (! search.serviceUrls.hasOwnProperty(service)) {
                        return false;
                    }
                }

                return true;
            }
        }

        /**
         * Returns orignal JSON source of the config object.
         * @return {Object} original json config object
         */
        get source () { return this._source; }

        get version () { return this._version; }
        get language () { return this._language; }
        get languages () { return this._languages; }

        get ui () { return this._ui; }
        get services () { return this._services; }
        get map () { return this._map; }

        applyBookmark (value) {
            this.map.applyBookmark(value);
        }

        get JSON () {
            return {
                version: this.version,
                language: this.language,
                languages: this.languages,
                ui: this.ui.JSON,
                services: this.services.JSON,
                map: this.map.JSON
            }
        }
    }

    /**
     * A helper function that walks the config legend hierarachy and executes arbitrary code on legend config blocks.
     *
     * @function walkFunction
     * @param {Function} action a function to execute on legend config blocks; it is called with `block`, `index` and `parent`
     * @param {Function} decision [optional=null] a function that returns `true` or `false`; it is called with `block`, `index` and `parent` on legend config block that contain children; if `false` is return, children of the current block are not walled;
     * @return {Array} an array of flattened results from the `action` function execution
     */
    function walkFunction(action, decision = null) {
        // roll in the results into a flat array
        return [].concat.apply([], (this.children || this.exclusiveVisibility).map((child, index) => {
            if (child.entryType === TYPES.legend.GROUP ||
                child.entryType === TYPES.legend.SET) {

                const actionResult = action(child, index, this);
                const walkResult = [];
                const proceed = decision ? decision(child, index, this) : true;

                if (proceed) {
                    walkResult.push.apply(walkResult, child.walk(action, decision));
                }

                return [].concat(actionResult, walkResult);
            } else {
                return action(child, index, this);
            }
        }));
    }

    return {
        ConfigObject,

        legend: {
            Legend,
            Entry,
            InfoSection,
            EntryGroup,
            VisibilitySet
        },

        layers: {
            BasicLayerNode,
            FeatureLayerNode,
            DynamicLayerNode,
            WMSLayerNode,

            DynamicLayerEntryNode,
            WMSLayerEntryNode
        },

        applyLayerNodeDefaults,

        createColumnNode,

        TYPES,
        DEFAULTS
    };
}
