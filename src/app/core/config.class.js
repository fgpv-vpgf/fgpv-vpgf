(() => {
    'use strict';

    /**
     * @module ConfigObject
     * @memberof app.core
     * @requires dependencies
     * @description     *
     *
     */
    angular
        .module('app.core')
        .factory('ConfigObject', ConfigObjectFactory);

    // eslint-disable-next-line max-statements
    function ConfigObjectFactory(Geo, gapiService, common) {

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
                        'symbology',
                        'query',
                        'reload',
                        'remove',
                        'settings'
                    ]
                }
            },
            layer: {
                [Geo.Layer.Types.ESRI_FEATURE]: {
                    state: {
                        opacity: 1,
                        visibility: true,
                        boundingBox: false,
                        query: true,
                        snapshot: false
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
                        'symbology'
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
                        snapshot: false
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
                        'symbology'
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
                        snapshot: false
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
                        'symbology'
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
                            snapshot: false
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
                            // 'reload',
                            'remove',
                            'settings',
                            'data',
                            'symbology'
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
                        snapshot: false
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
                        snapshot: false
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
            }

            get opacity () { return this._opacity; }
            get visibility () { return this._visibility; }
            get boundingBox () { return this._boundingBox; }
            get query () { return this._query; }
            get snapshot () { return this._snapshot; }
        }

        /**
         * Applies supplied layer node and layer entry node defaults to the node/entry node source config object (not typed config).
         *
         * @function applyLayerNodeDefaults
         * @param {Object} ownSource original config object from the config file
         * @param {Object} ownDefaults default value for this layer node or layer entry node
         * @param {Object} parentSource [optional={}] already defaulted config of an immediate parent; needed only for dynamic layres (possibly wms as well)
         * @return {Object} a copy of the original `ownSource` config with state, controls, disabledControls and userDisabledControls applied
         */
        function applyLayerNodeDefaults(ownSource, ownDefaults, parentSource = {}) {
            const ownSourceCopy = angular.copy(ownSource);

            ownSourceCopy.state = _defaultState(ownSourceCopy.state, ownDefaults.state, parentSource.state);

            ownSourceCopy.controls = _defaultControls(ownSourceCopy.controls,
                ownDefaults.controls, parentSource.controls);
            ownSourceCopy.disabledControls = _defaultControls(ownSourceCopy.disabledControls,
                ownDefaults.disabledControls, parentSource.disabledControls);
            ownSourceCopy.userDisabledControls = _defaultControls(ownSourceCopy.userDisabledControls,
                ownDefaults.userDisabledControls, parentSource.userDisabledControls);

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
                    'opacity', 'visibility', 'boundingBox', 'query', 'snapshot'
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
             *     - return intersect between own, parent and default controls
             *   - parent controls are not specified
             *     - return intersect between own and default controls
             * - own controls are not specified
             *   - parent controls specified
             *     - return intersect between parent and default controls
             *   - parent controls are not specified
             *     - return default controls
             *
             * @function _defaultControls
             * @private
             * @param {Array} controls original controls
             * @param {Array} controlsDefault controls defaults
             * @param {Array} parentControls [optional={}] parent defaulted values if child of a dynamic wms layer
             * @return {Array} defaulted state object
             */
            function _defaultControls(controls, controlsDefault, parentControls) {
                let result = controls;

                if (typeof controls === 'undefined') {
                    if (typeof parentControls !== 'undefined') {
                        result = common.intersect(parentControls, controlsDefault);
                    }

                    result = angular.copy(controlsDefault);

                } else {
                    if (typeof parentControls !== 'undefined') {
                        result = common.intersect(controls, parentControls);
                    } else {
                        result = common.intersect(result, controlsDefault);
                    }
                }

                return result;
            }
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
                    gapiService.gapi.mapManager.getExtentFromJson(source.extent) :
                    undefined;

                const defaults = DEFAULTS.layer[this.layerType];

                const defaultedSource = applyLayerNodeDefaults(source, defaults);

                this._state = new InitialLayerSettings(defaultedSource.state);
                this._controls = defaultedSource.controls;
                this._disabledControls = defaultedSource.disabledControls;
                this._userDisabledControls = defaultedSource.userDisabledControls;

                /*this._state = new InitialLayerSettings(applyLayerNodeDefaults(source.state, defaults.state));

                this._controls = applyLayerNodeDefaults(source.controls, defaults.controls);
                this._disabledControls = applyLayerNodeDefaults(source.disabledControls, defaults.disabledControls);
                this._userDisabledControls =
                    applyLayerNodeDefaults(source.userDisabledControls, defaults.userDisabledControls);*/

                /*
                // defaulting initial layer state
                this._state = new InitialLayerSettings(
                    angular.extend({}, defaults.state, source.state));

                // defaulting layer controls
                if (typeof source.controls === 'undefined') {
                    this._controls = angular.copy(defaults.controls);
                } else {
                    this._controls = common.intersect(source.controls, defaults.controls);
                }

                // defaulting layer disabled controls
                if (typeof source.disabledControls === 'undefined') {
                    this._disabledControls = angular.copy(defaults.disabledControls);
                } else {
                    this._disabledControls = common.intersect(source.disabledControls, defaults.controls);
                }

                // userDisabledControls cannot be specified in schema, using straight defaults
                this._userDisabledControls = angular.copy(defaults.userDisabledControls);
                */

                // remove metadata control if no metadata url is specified after applying defaults
                if (!source.metadataUrl) {
                    common.removeFromArray(this._controls, 'metadata');
                }
            }

            get source () { return this._source; }

            get id () { return this._id; }
            get layerType () { return this._layerType; }

            get name () { return this._name; }
            set name (value) { this._name = value; }

            get url () { return this._url; }
            get metadataUrl () { return this._metadataUrl; }
            get catalogueUrl () { return this._catalogueUrl; }
            get extent () { return this._extent; }

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
            get userDisabledControls () { return this._userDisabledControls; }
            get state () { return this._state; }
        }

        class BasicLayerNode extends LayerNode {
            constructor (source) {
                super(source);
            }
        }

        class FeatureLayerNode extends LayerNode {
            constructor (source) {
                super(source);

                this._nameField = source.nameField;
                this._tolerance = source.tolerance || 5;
            }

            get nameField () { return this._nameField; }
            set nameField (value) { this._nameField = value; }

            get tolerance () { return this._tolerance; }
        }

        // abstract
        class LayerEntryNode {
            constructor (source, parentSource = {}) {
                this._source = source;

                this._index = source.index;
                this._name = source.name;

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
        }

        class WMSLayerEntryNode extends LayerEntryNode {
            constructor (source, parentSource) {
                super(source, parentSource);

                this._level = source.level;
                this._desc = source.desc;
                this._id = source.id;
            }

            get level () { return this._level; }
            get desc () { return this._desc; }
            get id () { return this._id; }

            get layerType () { return layerTypes.OGC_WMS; }

        }

        class WMSLayerNode extends LayerNode {
            constructor (source) {
                super(source);

                this._layerEntries = source.layerEntries.map(layerEntry =>
                    (new WMSLayerEntryNode(layerEntry, source)));
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
        }

        class DynamicLayerEntryNode extends LayerEntryNode {
            constructor (source, parentSource) {
                super(source, parentSource);

                this._outfields = source.outfields || '*';
                this._stateOnly = source.stateOnly;

                this.isLayerEntry = true;
            }

            get outfields () { return this._outfields; }
            get stateOnly () { return this._stateOnly; }

            get layerType () { return layerTypes.ESRI_DYNAMIC; }
        }

        class DynamicLayerNode extends LayerNode {
            constructor (source) {
                super(source);

                this._layerEntries = source.layerEntries.map(layerEntry =>
                    (new DynamicLayerEntryNode(layerEntry, source)));
                this._childOptions = source.childOptions;
                this._tolerance = source.tolerance;
            }

            get layerEntries () { return this._layerEntries; }
            /**
             * @param {Array} value an array of DynamicLayerEntryNode layer entries
             */
            set layerEntries (value = []) {
                this._layerEntries = value;
            }
            get childOptions () { return this._childOptions; }
            get tolerance () { return this._tolerance; }
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
        }

        /**
         * Typed representation of an Extent specified in the config.
         * @class ExtentSet
         */
        class ExtentSet {
            constructor (source) {
                this._id = source.id;
                this._spatialReference = source.spatialReference;

                this._default = this._parseExtent(source.default);
                this._full = this._parseExtent(source.full) || this._default;
                this._maximum = this._parseExtent(source.maximum) || this._default;
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
                const completeExtent = angular.extend(
                    {},
                    extent, {
                        spatialReference: this._spatialReference
                    });

                return gapiService.gapi.mapManager.getExtentFromJson(completeExtent);
            }
        }

        /**
         * Typed representation of a Basemap specified in the config.
         * @class Basemap
         */
        class Basemap {
            constructor ({ id, name, description, type, layers, attribution }, tileSchema) {
                this._id = id;
                this._name = name;
                this._description = description;
                this._type = type;
                this._layers = layers;
                this._url = layers[0].url;
                this._attribution = attribution;
                this._tileSchema = tileSchema;

            }

            _isSelected = false; // jshint ignore:line

            get id () { return this._id; }
            get name () { return this._name; }
            get description () { return this._description; }
            get type () { return this._type; }
            get layers () { return this._layers; }
            get url () { return this._url; }
            get attribution () { return this._attribution; }
            get tileSchema () { return this._tileSchema; }

            get isSelected () { return this._isSelected; }
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
            get wkid () { return this._tileSchema.extentSet.spatialReference.wkid; }

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
        }

        /**
         * Typed representation of a TileSchema specified in the config.
         * @class TileSchema
         */
        class TileSchema {
            constructor ({ id, lodSetId, name }, extentSet, lodSet) {
                this._id = id;
                this._name = name;
                this._lodSetId = lodSetId;

                this._extentSet = extentSet;
                this._lodSet = lodSet;
            }

            get name () { return this._name; }
            get id () { return this._id; }

            get extentSet () { return this._extentSet; }
            get lodSet () { return this._lodSet; }

            // TODO: it's not yet decided how the blank basemap will be made; see arc room for notes
            /*makeBlankBasemap() {
                return new Basemap({
                    name: $translate.instant('basemap.blank.title'),
                    description: $translate.instant('basemap.blank.desc'),
                    type: 'blank',
                    id: `blank_basemap_${this._id}`,
                    url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7/',
                    attribution: '',
                    tileSchema: this
                });
            }*/
        }

        /**
         * Typed representation of a InfoSection specified in the config's structured legend.
         * @class InfoSection
         */
        class InfoSection {
            constructor (entrySource) {
                this._infoType = entrySource.infoType;
                this._content = entrySource.content;
            }

            get infoType () { return this._infoType; }
            get content () { return this._content; }

            get entryType () { return TYPES.legend.INFO; }
        }

        /**
         * Typed representation of a VisibilitySet specified in the config's structured legend.
         * @class VisibilitySet
         */
        class VisibilitySet {
            constructor (visibilitySetSource) {
                this._exclusiveVisibility = visibilitySetSource.exclusiveVisibility.map(childConfig =>
                    _makeChildObject(childConfig));
            }

            get exclusiveVisibility () { return this._exclusiveVisibility; }

            get entryType () { return TYPES.legend.SET; }
        }

        /**
         * Typed representation of a Entry specified in the config's structured legend.
         * @class Entry
         */
        class Entry {
            constructor (entrySource) {
                this._layerId = entrySource.layerId;
                this._controlledIds = entrySource.controlledIds || [];
                this._entryIndex = entrySource.entryIndex;
                this._entryId = entrySource.entryId;
                this._coverIcon = entrySource.coverIcon;
                this._symbologyStack = entrySource.symbologyStack;
                this._symbologyRenderStyle = entrySource.symbologyRenderStyle || Entry.ICONS;

                this._userAdded = entrySource.userAdded || false;
            }

            static ICONS = 'icons'; // jshint ignore:line
            static IMAGES = 'images'; // jshint ignore:line

            get layerId () { return this._layerId; }
            get userAdded () { return this._userAdded; }
            get controlledIds () { return this._controlledIds; }
            get entryIndex () { return this._entryIndex; }
            get entryId () { return this._entryId; }
            get coverIcon () { return this._coverIcon; }
            get symbologyStack () { return this._symbologyStack; }
            get symbologyRenderStyle () { return this._symbologyRenderStyle; }

            get entryType () { return TYPES.legend.NODE; }
        }

        /**
         * Typed representation of a EntryGroup specified in the config's structured legend.
         * @class Entry
         */
        class EntryGroup {
            constructor (entryGroupSource) {
                this._name = entryGroupSource.name;
                this._children = entryGroupSource.children.map(childConfig =>
                    _makeChildObject(childConfig));

                this._controls = common.intersect(
                    entryGroupSource.controls,
                    DEFAULTS.legend[TYPES.legend.GROUP].controls);
                this._disabledControls = entryGroupSource.disabledControls || [];
                this._userDisabledControls = [];

                this._expanded = entryGroupSource.expanded || false;
            }

            get name () { return this._name; }
            get children () { return this._children; }
            get controls () { return this._controls; }
            get disabledControls () { return this._disabledControls; }
            get userDisabledControls () { return this._userDisabledControls; }
            get expanded () { return this._expanded; }

            get entryType () { return TYPES.legend.GROUP; }
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

                if (this.isReorderable) {
                    // since auto legend is a subset of structured legend, its children are automatically populated
                    const sortGroups = Geo.Layer.SORT_GROUPS_;

                    // with autolegend, the layer list is pre-sorted according to the sort groups, and layer names
                    rootChildren = layersSource
                        .sort((a, b) => {
                            if (sortGroups[a.layerType] < sortGroups[b.layerType]) {
                                return -1;
                            } else if ((sortGroups[a.layerType] > sortGroups[b.layerType])) {
                                return 1;
                            } else if (a.name < b.name) {
                                return -1;
                            } else if (a.name > b.name) {
                                return 1;
                            }

                            return 0;
                        })
                        .map(layerDefinition =>
                            ({ layerId: layerDefinition.id }));

                } else {
                    rootChildren = legendSource.root.children;

                    // removing the `remove` control :) from the structured legend
                    const controlName = 'remove';

                    _removeControlOption(DEFAULTS.legend[TYPES.legend.GROUP].controls, controlName);

                    Object.values(Geo.Layer.Types).forEach(layerType => {
                        const layerDefaults = DEFAULTS.layer[layerType];

                        _removeControlOption(layerDefaults.controls, controlName);

                        // for layers which can have children - Dynamic layer and potentilally WMS
                        if (layerDefaults.child) {
                            _removeControlOption(layerDefaults.child.controls, controlName);
                        }
                    });
                }

                this._root = new EntryGroup({
                    name: 'I\'m root',
                    children: rootChildren
                });

                function _removeControlOption(controlsArray = [], controlName = '') {
                    common.removeFromArray(controlsArray, controlName);
                }
            }

            get isReorderable () { return this._type === TYPES.legend.AUTOPOPULATE; }

            get type () { return this._type; }
            get root () { return this._root; }
        }

        function _makeChildObject (childConfig) {
            const LEGEND_TYPE_TO_CLASS = {
                [TYPES.legend.INFO]: InfoSection,
                [TYPES.legend.NODE]: Entry,
                [TYPES.legend.GROUP]: EntryGroup,
                [TYPES.legend.SET]: VisibilitySet
            };
            const childType = _detectChildType(childConfig);

            return new LEGEND_TYPE_TO_CLASS[childType](childConfig);

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
        }

        class GeoSearchComponent extends ComponentBase {
            constructor (source) {
                super(source);

                this._showGraphic = source.showGraphic;
                this._showInfo = source.showInfo;
            }

            get showGraphic () { return this._showGraphic; }
            get showInfo () { return this._showInfo; }
        }

        class MouseInfoComponent extends ComponentBase {
            constructor (source) {
                super(source);

                this._spatialReference = source.spatialReference;
            }

            get spatialReference () { return this._spatialReference; }
        }

        class NorthArrowComponent extends ComponentBase {
            constructor (source) {
                super(source);
            }
        }

        class OverviewMapComponent extends ComponentBase {
            constructor (source) {
                super(source);

                this._maximizeButton = source.maximizeButton;
                this._layerType = source.layerType;
            }

            get maximizeButton () { return this._maximizeButton; }
            get layerType () { return this._layerType; }
        }

        class ScaleBarComponent extends ComponentBase {
            constructor (source) {
                super(source);
            }

            get attachTo () { return 'bottom-left'; }
            get scalebarUnit () { return 'dual'; }
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
                this._northArray = new NorthArrowComponent(componentsSource.northArrow);
                this._overviewMap = new OverviewMapComponent(componentsSource.overviewMap);
                this._scaleBar = new ScaleBarComponent(componentsSource.scaleBar);
                this._basemap = new BasemapComponent(componentsSource.basemap);
            }

            get geoSearch () { return this._geoSearch; }
            get mouseInfo () { return this._mouseInfo; }
            get northArray () { return this._northArrow; }
            get overviewMap () { return this._overviewMap; }
            get scaleBar () { return this._scaleBar; }
            get basemap () { return this._basemap; }
        }

        class SearchService {
            constructor (source) {
                this._disabledSearches = source.disabledSearches;
                this._serviceUrls = source._serviceUrls;
            }

            get disabledSearches () { return this._disabledSearches; }
            get serviceUrls () { return this._serviceUrls; }
        }

        class ExportService {
            constructor (source) {
                this._title = source.title;
                this._map = source.map;
                this._mapElements = source.mapElements;
                this._legend = source.legend;
                this._footnote = source.footnote;
                this._timestamp = source.timestamp;
            }

            get title () { return this._title; }
            get map () { return this._map; }
            get mapElements () { return this._mapElements; }
            get legend () { return this._legend; }
            get footnote () { return this._footnote; }
            get timestamp () { return this._timestamp; }
        }

        class Services {
            constructor (source) {
                this._proxyUrl = source.proxyUrl;
                this._exportMapUrl = source.exportMapUrl;
                this._geometryUrl = source.geometryUrl;
                this._googleAPIKey = source.googleAPIKey;
                this._geolocation = source.geolocation;
                this._coordInfo = source.coordInfo;
                this._print = source.print;
                this._search = source.search;
                this._export = source.export;
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
        }

        /**
         * Typed representation of a Map specified in the config.
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

                // calling select on a basemap only marks it as `selected`; to actually change the displayed basemap, call `changeBasemap` on `geoService`
                (mapSource.initialBasemapId ?
                    this._basemaps.find(basemap =>
                        basemap.id === mapSource.initialBasemapId) :
                    this._basemaps[0])
                    .select();

                // TODO: parse components subsections

                this._layers = mapSource.layers;
                this._legend = new Legend(mapSource.legend, this._layers);

                this._components = new Components(mapSource.components);
            }

            get source () { return this._source; }

            get tileSchemas () { return this._tileSchemas; }
            get basemaps () { return this._basemaps; }
            get extentSets () { return this._extentSets; }
            get lodSets () { return this._lodSets; }
            get layers () { return this._layers; }
            get legend () { return this._legend; }
            get components () { return this._components; }

            get selectedBasemap () { return this._basemaps.find(basemap => basemap.isSelected); }

            // --- //

            _layerRecords = [];
            _boundingBoxRecords = [];
            _legendBlocks = {};

            get layerRecords () { return this._layerRecords; }
            get boundingBoxRecords () { return this._boundingBoxRecords; }
            get legendBlocks () { return this._legendBlocks; }

            get body () {       return this._body; }
            get node () {       return this._node; }
            get manager () {    return this._manager; }

            storeMapReference(node, body, manager) {
                this._node = node;
                this._body = body;
                this._manager = manager;

                this.components.basemap.body = this._manager.BasemapControl;
                this.components.overviewMap.body = this._manager.OverviewMapControl;
                this.components.scaleBar.body = this._manager.ScalebarControl;
            }

            _isLoading = true;
            get isLoading () { return this._isLoading; }
            set isLoading (value) { this._isLoading = value;}
        }

        /**
         * [partially]Typed representation of the app's config.
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

                this._map = new Map(configSource.map);
                this._services = new Services(configSource.services);
                // TODO: parse ui sections
            }

            /**
             * Returns orignal JOSN source of the config object.
             * @return {Object} original json config object
             */
            get source () { return this._source; }

            get version () { return this._version; }
            get language () { return this._language; }

            get ui () { return this._ui; }
            get services () { return this._services; }
            get map () { return this._map; }
        }

        const LAYER_TYPE_TO_LAYER_NODE = {
            [layerTypes.ESRI_TILE]: BasicLayerNode,
            [layerTypes.ESRI_FEATURE]: FeatureLayerNode,
            [layerTypes.ESRI_IMAGE]: BasicLayerNode,
            [layerTypes.ESRI_DYNAMIC]: DynamicLayerNode,
            [layerTypes.OGC_WMS]: WMSLayerNode
        };

        function makeLayerConfig(layerType, source) {
            return LAYER_TYPE_TO_LAYER_NODE[layerType](source)
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

            makeLayerConfig,
            applyLayerNodeDefaults,

            TYPES,
            DEFAULTS
        };
    }
})();
