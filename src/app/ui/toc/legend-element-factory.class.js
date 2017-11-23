/* eslint max-statements: ["error", 32] */

/**
 *
 * @module LegendElementFactory
 * @memberof app.geo
 * @requires dependencies
 * @description
 *
 * `LegendElementFactory` exposed two functions to create layer controls and flags objects.
 *
 */
angular
    .module('app.ui')
    .factory('LegendElementFactory', LegendElementFactory);

// eslint-disable-next-line max-statements
function LegendElementFactory($translate, Geo, ConfigObject, tocService, debounceService, configService, mapService, layerRegistry) {
    const ref = {
        get autoLegendEh() {
            return configService.getSync.map.legend.type === ConfigObject.TYPES.legend.AUTOPOPULATE;
        }
    };

    class BaseElement {
        constructor (legendBlock) {
            this._legendBlock = legendBlock;
        }

        get controlName () { return this._controlName; }

        get block () { return this._legendBlock; }

        get icon () {    return ''; }
        get label () {   return ''; }
        get tooltip () { return this.label; }

        get isVisible () { return this.block.isControlVisible(this._controlName); }
    }

    class BaseControl extends BaseElement {
        action () { }

        get isDisabled () {
            const value =
                this.block.isControlDisabled(this._controlName);

            return value;
        }
    }

    class VisibilityControl extends BaseControl {
        constructor (...args) {
            super(...args);
        }

        _controlName = 'visibility'; // jshint ignore:line

        set value (value) { this.action(value); }
        get value () { return this.block.visibility; }

        get icon () {    return `action:visibility`; }
        get label () {   return `toc.label.visibility.off`; }

        action (value = !this.value) {
            this._debouncedAction(value);
        }

        _debouncedAction = debounceService.registerDebounce(
            value => { this.block.visibility = value; }, 300);
    }

    class VisibilityNodeControl extends VisibilityControl {
        constructor (...args) {
            super(...args);
        }

        get icon () {    return `toggle:check_box${this.value ? '' : '_outline_blank'}`; }
        get label () {   return `toc.label.visibility.${this.value ? 'on' : 'off'}`; }
    }

    class VisibilitySetControl extends VisibilityControl {
        constructor (...args) {
            super(...args);
        }

        get icon () {    return `toggle:radio_button_${this.value ? '' : 'un'}checked`; }
        get label () {   return `toc.label.visibility.${this.value ? 'on' : 'off'}`; }
    }

    class OpacityControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'opacity';
        }

        get value () { return this.block.opacity; }
        set value (value) { this.action(value); }

        get icon () {    return 'action:opacity'; }
        get label () {   return 'settings.label.opacity'; }

        action (value = 1) {
            this.block.opacity = value;
        }
    }

    class BoundingBoxControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'boundingBox';
        }

        get value () { return this.block.boundingBox; }
        set value (value) { this.action(value); }

        get icon () {    return 'community:cube-outline'; }
        get label () {   return 'settings.label.boundingBox'; }

        action (value = !this.value) {
            this._debouncedAction(value);
        }

        _debouncedAction = debounceService.registerDebounce(
            value => { this.block.boundingBox = value; }, 300);
    }

    class QueryControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'query';
        }

        get value () {          return this.block.query; }
        set value (value) {     this.action(value); }

        get icon () {           return 'communication:location_on'; }
        get label () {          return 'toc.label.query'; }

        action (value = !this.value) {
            this.block.query = value;
        }
    }

    class SnapshotControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'snapshot';
        }

        get value () {  return this.block.snapshot; }

        get icon () {   return 'action:cached'; }
        get label () {  return 'settings.label.snapshot'; }

        action () {
            this.block.snapshot = true;
            tocService.reloadLayer(this.block);
        }
    }

    class MetadataControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'metadata';
        }

        get icon () {   return 'action:description'; }
        get label () {  return 'toc.label.metadata'; }

        action () {     tocService.toggleMetadata(this.block); }
    }

    class SettingsControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'settings';
        }

        get icon () {   return 'image:tune'; }
        get label () {  return 'toc.label.settings'; }

        action () {     tocService.toggleSettings(this.block); }
    }

    class ScaleControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'scale';
        }

        get value () {  return this.block.scale; }

        get icon () {   return `action:zoom_${this.value.zoomIn ? 'in' : 'out'}`; }
        get label () {  return `toc.label.visibility.zoom${this.value.zoomIn ? 'In' : 'Out'}`; }

        action () {     this.block.zoomToScale(); }

        // visibility of this control is specified in the legend node template
        get isVisible () { return true; }
    }

    class ReloadControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'reload';
        }

        get icon () {   return 'navigation:refresh'; }
        get label () {  return 'toc.label.reload'; }

        action () {     tocService.reloadLayer(this.block); }
    }

    class BoundaryControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'boundaryZoom';
        }

        get icon () {   return 'action:zoom_in'; }
        get label () {  return 'toc.label.boundaryZoom'; }

        action () { this.block.zoomToBoundary().then(mapService.checkForBadZoom); }
    }

    class DataControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'data';
        }

        get icon () {   return 'community:table-large'; }
        get label () {  return 'toc.label.dataTable'; }

        action () {     this._debouncedAction(); }

        get isVisible () {
            // data control is visible for all feature layers unless the controls is disallowed or disabled in the config
            return super.isVisible &&
                !this.block.isControlDisabled(this._controlName) &&
                this.block.layerType === Geo.Layer.Types.ESRI_FEATURE;
        }

        _debouncedAction = debounceService.registerDebounce(
            () => { tocService.toggleLayerTablePanel(this.block); }, 300);
    }

    class RemoveControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'remove';
        }

        get icon () {   return 'action:delete'; }
        get label () {  return 'toc.label.remove'; }

        action () {     tocService.removeLayer(this.block); }

        /**
         * The remove control is visible for every element in an auto legend and user-added layer unless prohibited by the layer config.
         *
         * @return {Boolean} true if the remove control should be visible
         */
        get isVisible () {  return super.isVisible && (ref.autoLegendEh || this.block.userAdded); }
    }

    class ReorderControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'reorder';
        }

        get icon () {    return 'editor:drag_handle'; }
        get label () {   return 'toc.label.reorder'; }

        // visibility of this control is specified at the toc level
        get isVisible () { return true; }
    }

    /**
     * SymbologyControl allows the user to expand the symbology stack.
     */
    class SymbologyControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'symbology';

            this._symbologyStack = this.block.symbologyStack;
        }

        get icon () {    return 'maps:layers'; }
        get label () {   return 'toc.layer.label.symbology'; }

        action () {
            this._symbologyStack.expanded = !this._symbologyStack.expanded;
            this._symbologyStack.fannedOut = !this._symbologyStack.expanded;
        }
    }

    class StylesControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'styles';
        }

        get label () {   return 'settings.label.styles'; }
    }

    class IntervalControl extends BaseControl {
        constructor (...args) {
            super(...args);

            this._controlName = 'interval';
        }

        get label () {   return 'settings.label.refreshHint'; }

        get isDynamicChild () {
            return this.block.isControlUserDisabled('interval') && !layerRegistry.getLayerRecord(this.block.layerRecordId).isTrueDynamic;
        }

        get clearAndReload() {
            if (this.block._rootProxyWrapper && this.block._rootProxyWrapper.layerType === Geo.Layer.Types.ESRI_DYNAMIC) {
                this.block._rootProxyWrapper.layerConfig.refreshInterval = 0;
                this.block._rootProxyWrapper.layerConfig.layerEntries.forEach(entry => (entry.refreshInterval = 0));
            } else {
                this.block.mainProxyWrapper.layerConfig.refreshInterval = 0;
            }

            tocService.reloadLayer(this.block);
        }
    }

    class BaseFlag extends BaseElement {
        get data () { return {}; }
        get style () { return ''; }
    }

    class BoundingBoxFlag extends BaseFlag {
        constructor (...args) {
            super(...args);

            this._controlName = 'boundingBox';
        }

        get icon () {    return 'community:cube-outline'; }
        get label () {   return 'settings.label.boundingBox'; }

        get isVisible () { return this.block.boundingBox; }
    }

    class TypeFlag extends BaseFlag {
        constructor (...args) {
            super(...args);

            this._controlName = 'type';
        }

        // TODO: remove; geoapi will return unresolved while the layer type is retrieved and unknown if it cannot retrieve it from the service
        static unresolvedType = 'unresolved'; // jshint ignore:line

        get _styles () {
            return {
                unresolved: 'rv-spinning'
            };
        }

        get _icons () {
            const { geometryType } = this.block;

            return {
                unknown: 'community:help',
                unresolved: 'action:cached',
                get esriFeature () {
                    return {
                        esriGeometryPoint: 'community:vector-point',
                        esriGeometryPolygon: 'community:vector-polygon',
                        esriGeometryPolyline: 'community:vector-polyline'
                    }[geometryType];
                },
                esriDynamic: 'action:settings',
                esriDynamicLayerEntry: 'image:photo',
                ogcWms: 'image:photo',
                ogcWmsLayerEntry: 'image:photo',
                esriImage: 'image:photo',
                esriTile: 'image:photo'
            };
        }

        get _labels () {
            return {
                unknown: 'toc.label.flag.unknown',
                unresolved: 'toc.label.flag.unresolved',
                esriFeature: 'toc.label.flag.feature',
                esriDynamic: 'toc.label.flag.dynamic',
                esriDynamicLayerEntry: 'toc.label.flag.dynamic',
                ogcWms: 'toc.label.flag.wms',
                ogcWmsLayerEntry: 'toc.label.flag.wms',
                esriImage: 'toc.label.flag.image',
                esriTile: 'toc.label.flag.tile'
            };
        }

        get data () {
            const { layerType, geometryType, featureCount } = this.block;

            const dataObject = {
                unknown: {},
                unresolved: {},
                get esriFeature() {
                    let content = '';

                    // only if there a valid feature count, display it
                    if (typeof featureCount !== 'undefined' && featureCount !== -1) {
                        // need to translate the substution variable itself; can't think of any other way :(
                        const typeName = $translate
                            .instant(`geometry.type.${geometryType}`)
                            .split('|')[featureCount === 1 ? 0 : 1];

                        content = `(${featureCount} ${typeName})`;
                    }

                    return { content };
                },

                get esriRaster() {  return this.esriDynamic; },
                get esriDynamic() { return { content: `(${$translate.instant('geometry.type.imagery')})` }; }
            }[layerType || TypeFlag.unresolvedType];

            return dataObject;
        }

        get style () {   return this._styles[this.block.parentLayerType || TypeFlag.unresolvedType]; }
        get icon () {    return this._icons[this.block.parentLayerType || TypeFlag.unresolvedType]; }
        get label () {   return this._labels[this.block.parentLayerType || TypeFlag.unresolvedType]; }

        get isVisible () { return true; }
    }

    class ScaleFlag extends BaseFlag {
        constructor (...args) {
            super(...args);

            this._controlName = 'scale';
        }

        get icon () {    return 'maps:layers_clear'; }
        get label () {   return 'toc.tooltip.flag.scale'; }

        get isVisible () { return this.block.scale.offScale; }
    }

    class DataFlag extends BaseFlag {
        constructor (...args) {
            super(...args);

            this._controlName = 'data';
        }

        get icon () {    return 'community:table-large'; }
        get label () {   return 'toc.label.flag.data.table'; }

        get isVisible () {
            // data flag is visible for all feature layers unless the controls is disallowed or disabled in the config
            return super.isVisible &&
                !this.block.isControlDisabled(this._controlName) &&
                this.block.layerType === Geo.Layer.Types.ESRI_FEATURE;
        }
    }

    class QueryFlag extends BaseFlag {
        constructor (...args) {
            super(...args);

            this._controlName = 'query';
        }

        get icon () {    return 'community:map-marker-off'; }
        get label () {   return 'toc.label.flag.query'; }

        get isVisible () {
            return super.isVisible && !this.block.query;
        }
    }

    class UserFlag extends BaseFlag {
        constructor (...args) {
            super(...args);

            this._controlName = 'user';
        }

        get icon () {    return 'social:person'; }
        get label () {   return 'toc.label.flag.user'; }

        get isVisible () { return this.block.userAdded; }
    }

    class FilterFlag extends BaseFlag {
        constructor (...args) {
            super(...args);

            this._controlName = 'filter';
        }

        get icon () {    return 'community:filter'; }
        get label () {   return 'toc.label.flag.filter'; }

        get isVisible () { return this.block.filter; }
    }

    class BadProjectionFlag extends BaseFlag {
        constructor (...args) {
            super(...args);

            this._controlName = 'badProjection';
        }

        get icon () {    return 'alert:warning'; }
        get label () {   return 'toc.label.flag.unsupportedprojection'; }

        get isVisible () { return true; }
    }

    const controlTypes = {
        flag: 'flag',
        control: 'control'
    };

    const typeToClass = {
        flag: {
            boundingBox: BoundingBoxFlag,
            type: TypeFlag,
            scale: ScaleFlag,
            data: DataFlag,
            query: QueryFlag,
            user: UserFlag,
            filter: FilterFlag,
            badProjection: BadProjectionFlag
        },
        control: {
            visibility: VisibilityControl,
            visibilitynode: VisibilityNodeControl,
            visibilityset: VisibilitySetControl,
            opacity: OpacityControl,
            boundingBox: BoundingBoxControl,
            query: QueryControl,
            snapshot: SnapshotControl,
            metadata: MetadataControl,
            settings: SettingsControl,
            scale: ScaleControl,
            reload: ReloadControl,
            boundary: BoundaryControl,
            data: DataControl,
            remove: RemoveControl,
            reorder: ReorderControl,
            symbology: SymbologyControl,
            styles: StylesControl,
            interval: IntervalControl
        }
    };

    return {
        makeControl(legendBlock, controlName) {
            return new typeToClass[controlTypes.control][controlName](legendBlock);
        },

        makeFlag(legendBlock, controlName) {
            return new typeToClass[controlTypes.flag][controlName](legendBlock);
        }
    };
}
