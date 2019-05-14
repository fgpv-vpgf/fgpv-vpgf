import { Observable, Subject } from 'rxjs';
import { layerTypes } from './layers';

/**
 * All legend types must be derived from this class. Not intended to be instantiated on its own.
 * Provides the core API functionality for both `SimpleLegend` and `ConfigLegend`
 *
 * You can think of Legends as the root of a tree, `LegendGroups` as nodes with children, and `LegendItems` as leaves.
 *
 * To access the structure of the legend using the API, use `legend.children` to access top level elements.
 * For each child in `legend.children` that is a `LegendGroup` use `group.children` to access nested items.
 *<br>
 *<h2>Example Usecases for Legend API:</h2>
 * <ul>
 *     <li>Allow a plugin author to easily access attributes from the legend</li>
 *     <li>Allow a plugin author to easily manipulate the legend</li>
 *     <li>Allow a plugin author to listen for changes on the legend in order to update their plugin</li>
 *     <li>Allow a map author other paths for their end user to interact with the legend
 *          <ul><li>e.g: allowing a user to manipulate legend using an external button on the map author's host page</li></ul>
 *     </li>
 *     <li>Allow a map author a way to listen for changes to the legend and update their host page if nescessary.</li>
 *</ul>
 */
class BaseLegend {
    /** @ignore */
    _children: Array<LegendItem | LegendGroup>;
    /** @ignore */
    _configSnippets: Array<JSON>;
    /** @ignore */
    _mapInstance: any;
    /** @ignore */
    _click: Subject<LegendItem | LegendGroup>;
    /**@ignore **/
    _dataTableToggled: Subject<any>;
    /**@ignore **/
    _elementRemoved: Subject<LegendItem>;

    /**
     * Create a new legend instance that provides core functionality. Not to be used directly.
     * Should be instantiated as either `ConfigLegend` or `SimpleLegend`
     * @param mapInstance - the `mapInstance` that the legend is on
     * @param configSnippets - an array of top level config snippets for `LegendItems` or `LegendGroups` as defined in the config file
     */
    constructor(mapInstance: any, configSnippets: Array<JSON>) {
        this._mapInstance = mapInstance;
        this._configSnippets = configSnippets;
        this._children = [];
        this._click = new Subject();
        this._dataTableToggled = new Subject();
        this._elementRemoved = new Subject();
    }

    /**
     * Return list of `LegendItems` and/or `LegendGroups` for the legend
     */
    get children(): Array<LegendItem | LegendGroup> {
        return this._children;
    }

    /**
     * Return list of config snipppets for the legend.
     * The order of the `configSnippets` correspond to current top-level `LegendItems`/`LegendGroups` in the legend from top down
     */
    get configSnippets(): Array<JSON> {
        return this._configSnippets;
    }

    /**
     * Set list of config snipppets for the legend
     * Changes legend to match snippet order from top down.
     */
    set configSnippets(snippets: Array<JSON>) {
        this._configSnippets = snippets;
    }

    /**
     * Get a `LegendItem` or `LegendGroup` by id
     * Returns `undefined` if a matching `id` is not found
     * @param {string} layerId - the layerId for the layer that the `LegendGroup` or `LegendItem` corresponds to.
     */
    getById(layerId: string): LegendItem | LegendGroup | undefined {
        return this._children.find(item => item.id === layerId);
    }

    /**
     * Expand all `LegendGroups` in legend
     */
    expandGroups(): void {
        this._mapInstance.instance.toggleLegendGroupEntries();
    }

    /**
     * Collapse all `LegendGroups` in legend
     */
    collapseGroups(): void {
        this._mapInstance.instance.toggleLegendGroupEntries(false);
    }

    /**
     * Toggle all `LegendItems` and `LegendGroups` in legend to visible (so that all layer data shows on map)
     */
    showAll(): void {
        this._mapInstance.instance.toggleLegendEntries();
    }

    /**
     * Toggle all `LegendItems` and `LegendGroups` in legend to invisible (so that all layer data is hidden on map)
     */
    hideAll(): void {
        this._mapInstance.instance.toggleLegendEntries(false);
    }

    /**
     * Emits whenever a layer is clicked on the legend.
     * @event click
     */
    get click(): Observable<LegendItem | LegendGroup> {
        return this._click.asObservable();
    }

    /**
     * Emits whenever a datatable is toggled.
     * @event dataTableToggled
     */
    get dataTableToggled(): any {
        return this._dataTableToggled.asObservable();
    }

    /**
     * Emits whenever an element is removed from the legend.
     * @event elementRemoved
     */
    get elementRemoved(): Observable<LegendItem> {
        return this._elementRemoved.asObservable();
    }

}

/**
 * A single `ConfigLegend` instance is created for each map instance.
 * ConfigLegends can be of either "structured" or "auto" legend types.
 *
 * You can think of `ConfigLegend` as the root of a tree,`LegendGroups` as nodes with children, and `LegendItems` as leaves.
 *
 * To access the structure of the legend using the API, use `legend.children` to access top level elements.
 * For each child in `legend.children` that is a `LegendGroup` use `group.children` to access nested items.
 *
 * @example
 * ```js
 * let configLegend = RAMP.mapInstances[0].ui.configLegend; // access configLegend using the map API
 * ```
 *<br>
 *<h2>Example Usecases for Legend API:</h2>
 * <ul>
 *     <li>Allow a plugin author to easily access attributes from the legend</li>
 *     <li>Allow a plugin author to easily manipulate the legend</li>
 *     <li>Allow a plugin author to listen for changes on the legend in order to update their plugin</li>
 *     <li>Allow a map author other paths for their end user to interact with the legend
 *          <ul><li>e.g: allowing a user to manipulate legend using an external button on the map author's host page</li></ul>
 *     </li>
 *     <li>Allow a map author a way to listen for changes to the legend and update their host page if nescessary.</li>
 *</ul>
 */
export class ConfigLegend extends BaseLegend {
    /**@ignore **/
    _type: string;
    /**@ignore **/
    _reorderable: boolean;
    /**@ignore **/
    _legendStructure: LegendStructure;
    /**@ignore **/
    _sortGroup: Array<Array<LegendItem | LegendGroup>>;

    /**
     * Create a new ConfigLegend instance.
     * @param mapInstance - mapInstance that the ConfigLegend will sit on
     * @param legendStructure - an object representation of the legend. Its children will correspond to the `configSnippets`
     */
    constructor(mapInstance: any, legendStructure: LegendStructure) {
        super(mapInstance, legendStructure.JSON.root.children);

        this._type = legendStructure.type;
        this._reorderable = mapInstance.legend._reorderable;
        this._legendStructure = legendStructure;
        this._sortGroup = [[], []];
    }

    /**
     * Return list of config snipppets for the legend.
     * Config snippet order will correspond to current top-level `LegendItems`/`LegendGroups` in legend from top down.
     */
    get configSnippets(): Array<JSON> {
        return this._configSnippets;
    }

    /**
     * Set list of config snipppets for the legend
     * Changes legend to match snippet order from top down.
     *
     * @example ### Setting Legend Structure:
     * ```js
     * configLegend.configSnippets = [{...}, ... , {...}];
     * ```
     */
    set configSnippets(snippets: Array<JSON>) { // TODO: add code to fix children array
        if (snippets) {
            const structure = this._legendStructure.JSON;
            if (this._type === 'structured') {    // use constant
                this._configSnippets = snippets;
                structure.root.children = snippets;
                this._mapInstance.instance.setLegendConfig(structure);
            }
        }
    }

    /**
     * Get a `LegendItem` or `LegendGroup` by id.
     * Returns `undefined` if a matching `id` is not found
     */
    getById(id: string): LegendItem | LegendGroup | undefined {
        for (let item of this.children) {
            if (item.id === id) {
                return item;
            } else {
                if (item instanceof LegendGroup) {
                    // If the item is a LegendGroup, search through its children
                    let match = item.getById(id);
                    if (match) {
                        return match;
                    }
                }
            }
        }
    }

    /**
     * Updates a group's or item's position in the legend.
     * Keeps vectors and rasters seperate as the ui does.
     * @param item LegendItem or LegendGroup to change position
     * @param index New index to put the item
     *
     * @example Move vector layer to the front/top of its group
     * ```js
     * mapInstance.ui.configLegend.updateLayerPosition(vectorItem, 0);
     * ```
     *
     * @example Move a raster layer to the front/top of its group
     * ```js
     * mapInstance.ui.configLegend.updateLayerPosition(rasterItem, 0);
     * ```
     */
    updateLayerPosition(item: LegendItem | LegendGroup, index: number): void {
        if (this._reorderable) {
            const groupBorder = this._sortGroup[0].length;
            let tempLegendBlocks = this._mapInstance.legendBlocks;
            let entries = tempLegendBlocks.entries;
            let entriesIndex = index;
            const itemIndex = entries.findIndex((entry: any) => entry.id === item.id);
            if (item._legendBlock.sortGroup === 0 && index >= groupBorder) {
                // exit early if the index exceeds the size of the sort group
                return;
            } else if (item._legendBlock.sortGroup === 1) {
                // if it's in the second sortGroup, set the index to start from the group border
                entriesIndex += groupBorder;
            }
            if (entriesIndex >= 0 && entriesIndex < entries.length && itemIndex >= 0) {
                // reorder in the elements array
                entries.splice(entriesIndex, 0, entries.splice(itemIndex, 1)[0]);
                // reorder in the sort group array as well
                let group = this._sortGroup[item._legendBlock.sortGroup];
                group.splice(index, 0, group.splice(index, 1)[0]);
                // need to set the entire legend block to trigger change on the map
                this._mapInstance.legendBlocks = tempLegendBlocks;
                this._mapInstance.instance.synchronizeLayerOrder();
            }
        }
    }
}

/**
 * WORK IN PROGRESS - to be implemented as mentioned in https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2815
 */
export class SimpleLegend extends BaseLegend {
    // TODO: implement SimpleLegend as mentioned in https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2815
}

/**
 * Provides the core API functionality for `LegendItems` and `LegendGroups`
 */
class BaseItem {
    /** @ignore */
    _mapInstance: any;
    /** @ignore */
    _legendBlock: any;

    /** @ignore */
    _id: string;
    /** @ignore */
    _name: string;
    /** @ignore */
    _type: string;
    /** @ignore */
    _availableControls: Array<AvailableControls>;

    /** @ignore */
    _opacity: number;
    /** @ignore */
    _opacityChanged: Subject<number>;

    /** @ignore */
    _queryable: boolean;
    /** @ignore */
    _queryableChanged: Subject<boolean>;

    /** @ignore */
    _visibility: boolean;
    /** @ignore */
    _visibilityChanged: Subject<boolean>;

    /**
     * Create a new BaseItem, initialize the observables.
     * @param mapInstance the mapInstance that this BaseItem is for
     */
    constructor(mapInstance: any) {
        this._mapInstance = mapInstance;

        this._visibilityChanged = new Subject();
        this._opacityChanged = new Subject();
        this._queryableChanged = new Subject();

        this._visibilityChanged.subscribe(visibility => (this._visibility = visibility));
        this._opacityChanged.subscribe(opacity => (this._opacity = opacity));
        this._queryableChanged.subscribe(queryable => (this._queryable = queryable));
    }

    /** Returns the item's id */
    get id(): string {
        return this._id;
    }

    /** Returns the item's name */
    get name(): string {
        return this._name;
    }

    /** Returns the item's type */
    get type(): string {
        return this._type;
    }

    /**
     * Gets visibility of the BaseItem
     * @return {boolean | undefined} - true if the item is currently visible, false if invisible. undefined if "visibility" is not
     * part of `BaseItem's`  `_availableControls`.
     */
    get visibility(): boolean | undefined {
        return this._visibility;
    }

    /**
     * Sets visibility of the BaseItem
     * @param visibility - true if visible, false if invisible. Undefined has no effect.
     */
    set visibility(visibility: boolean | undefined) {
        if (typeof visibility !== 'undefined' && this._availableControls.includes(AvailableControls.Visibility)) {
            if (this._visibility !== visibility) {
                this._visibility = visibility;
                this._legendBlock.visibility = visibility;
                this._visibilityChanged.next(visibility);
            }
        }
    }

    /**
    * Emits whenever the item visibility is changed.
    * @event visibilityChanged
    */
    get visibilityChanged(): Observable<boolean> {
        return this._visibilityChanged.asObservable();
    }

    /**
     * Returns the opacity of the BaseItem.
     * @return {number | undefined} - ranges from 0 (hidden) to 1 (fully visible). undefined if "opacity" is not
     * part of `BaseItem's` `_availableControls`.
     */
    get opacity(): number | undefined {
        return this._opacity;
    }

    /**
     * Sets the opacity value for the BaseItem
     * @param opacity - ranges from 0 (hidden) to 1 (fully visible); `undefined` has no effect.
     */
    set opacity(opacity: number | undefined) {
        if (typeof opacity !== 'undefined' && this._availableControls.includes(AvailableControls.Opacity)) {
            if (this._opacity !== opacity) {
                this._opacity = opacity;
                this._legendBlock.opacity = opacity;
                this._opacityChanged.next(opacity);
            }
        }
    }

    /**
     * Emits whenever the item opacity is changed.
     * @event opacityChanged
     */
    get opacityChanged(): Observable<number> {
        return this._opacityChanged.asObservable();
    }

    /**
     * Gets queryable value of the BaseItem;
     * @return {boolean|undefined} - true if the item is queryable, false otherwise. undefined if "query" is not
     * part of `BaseItem's` `_availableControls`.
     */
    get queryable(): boolean | undefined {
        return this._queryable;
    }

    /**
     * Sets query value of the BaseItem
     * @param queryable true if item can be queried, false otherwise. undefined has no effect.
     */
    set queryable(queryable: boolean | undefined) {
        if (typeof queryable !== 'undefined' && this._availableControls.includes(AvailableControls.Query)) {
            if (this._queryable !== queryable) {
                this._queryable = queryable;
                this._legendBlock.query = queryable;
                this._queryableChanged.next(queryable);
            }
        }
    }

    /**
     * Emits whenever the item queryable value is changed.
     * @event queryableChanged
     */
    get queryableChanged(): Observable<boolean> {
        return this._queryableChanged.asObservable();
    }

    /**
     * Removes element from legend and removes layer if it's the last reference to it.
     * Does nothing if "remove" is not part of `BaseItem's` s`_availableControls`.
     * The only exception is if it is of type 'legendInfo' in which case removing is possible without it being an available control.
     */
    remove(): void {
        if (this._availableControls.includes(AvailableControls.Remove) || this.type === LegendTypes.Info) {
            this._mapInstance.instance.removeAPILegendBlock(this._legendBlock);
        }
    }

    /**
     * Reloads element in legend
     * Does nothing if "reload" is not part of `BaseItem's` `_availableControls`.
     */
    reload(): void {
        if (this._availableControls.includes(AvailableControls.Reload) ) {
            this._mapInstance.instance.reloadAPILegendBlock(this._legendBlock);
        }
    }

    /**
     * Toggles metadata panel to open/close for the BaseItem
     * Does nothing if "metadata" is not part of `BaseItem's` `_availableControls`.
     */
    toggleMetadata(): void {
        if (this._controlAvailable(AvailableControls.Metadata)) {
            this._mapInstance.instance.toggleMetadata(this._legendBlock);
        }
    }

    /**
     * Toggles settings panel to open/close type for the BaseItem
     * Does nothing if "settings" is not part of `BaseItem's` `_availableControls`.
     */
    toggleSettings(): void {
        if (this._controlAvailable(AvailableControls.Settings)) {
            this._mapInstance.instance.toggleSettings(this._legendBlock);
        }
    }

    /**
     * Toggles data table panel to open/close for the BaseItem
     * Does nothing if "data" is not part of `BaseItem's` `_availableControls`.
     */
    toggleDataTable(): any {
        if (this._controlAvailable(AvailableControls.Data) && this._legendBlock.layerType === layerTypes.ESRI_FEATURE) {
            this._mapInstance.instance.toggleDataTable(this._legendBlock);
        }
    }

    /**
     * Check if a control is available for the legend item
     * @param control name of the control
     */
    _controlAvailable(control: AvailableControls) {
        return this._legendBlock.state !== 'rv-error' && this._availableControls.includes(control) && !this._legendBlock.isControlDisabled(control);
    }
}

/**
 * `LegendItems` can either be `LegendNodes` (they correspond to a layer) or `InfoSections` (they do not correspond to a layer)
 */
export class LegendItem extends BaseItem {
    /**
     * Creates a new LegendItem, initializes attributes.
     * @param mapInstance The mapInstance that this LegendItem is for
     * @param itemBlock The LegendBlock that this LegendItem represents
     */
    constructor(mapInstance: any, itemBlock: any) {
        super(mapInstance);

        this._initSettings(itemBlock);
    }

    /**
     * Expand/collapses symbology stack.
     * Does nothing if `LegendItem` is an `InfoSection`
     */
    toggleSymbologyStack(): void {
        if (this.type === LegendTypes.Node || this._legendBlock.infoType === 'unboundLayer') {
            this._legendBlock.symbologyStack.expanded = !this._legendBlock.symbologyStack.expanded;
        }
    }

    /**
     * Toggles the Symbologies for LegendItems of type legendNode with toggle-able symbology items (in a symbology stack).
     * @param indices - List of indices of the symbologies to toggle
     * @example
     * ```js
     * item.toggleSymbologies([1, 4]);
     * ```
     */
    toggleSymbologies(indices: Array<number>): void {
        if (this._availableControls.includes(AvailableControls.Symbology)) {
            indices.forEach(index => {
                // check if index is valid
                if (index < 0 || index >= this._legendBlock.symbologyStack.stack.length) {
                    return;
                }
                // toggle only if the symbology item has toggle button
                const toggle = this._legendBlock.symbologyStack.stack[index].toggle;
                if (toggle) {
                    this._legendBlock.symbologyStack.onToggleClick(toggle);
                }
            });
        }
    }

    /**
     * Toggles a symbology for a legendNode with toggle-able symbology items
     * @param index Index of the symbology to toggle
     */
    toggleSymbology(index: number): void {
        this.toggleSymbologies([index]);
    }

    /**
     * The names of the symbologies in order
     */
    get symbologyNames(): string[] | undefined {
        if (this.type === LegendTypes.Node || this._legendBlock.infoType === 'unboundLayer') {
            return this._legendBlock.symbologyStack.stack.map((symbol: any) => symbol.name);
        } else {
            // no symbology
            return undefined;
        }
    }

    /**
     * Set the appropriate item properties such as id, visibility and opacity.
     * Called whenever the legend block is created or reloaded.
     * @param itemBlock The LegendBlock that this LegendItem represents
     * @ignore
     */
    _initSettings(itemBlock: any): void {
        this._legendBlock = itemBlock;
        this._id = itemBlock.id;
        this._name = itemBlock.name;
        this._type = itemBlock.blockConfig.entryType;

        this._availableControls = [];

        if (itemBlock.blockConfig.entryType === LegendTypes.Node) {
            this._visibility = itemBlock.visibility;
            this._opacity = itemBlock.opacity;
            this._queryable = itemBlock.query;
            this._availableControls = itemBlock.availableControls;
        }
    }
}

/**
 * `LegendGroups` have children; they provide nesting capability for Legends.
 * They can nest `LegendItems` or other `LegendGroups`.
 */
export class LegendGroup extends BaseItem {

    /** @ignore */
    _children: Array<LegendGroup | LegendItem> = [];

    /**
     * Sets the legend groups viewer map instance and legend block instance.
     * @param mapInstance The mapInstance that this LegendGroup is for
     * @param itemBlock The LegendBlock that this LegendGroup represents
     */
    constructor(mapInstance: any, legendBlock: any) {
        super(mapInstance);

        this._initSettings(legendBlock);
    }

    /** Returns the children for the group (if any). Children can be either LegendGroups (if nested groups) or LegendItems. */
    get children(): Array<LegendGroup | LegendItem> {
        return this._children;
    }

    /** Get a child LegendItem or LegendGroup by id. Returns undefined if a matching `id` is not found */
    getById(id: string): LegendItem | LegendGroup | undefined {
        for (let item of this.children) {
            if (item.id === id) {
                return item;
            } else {
                if (item instanceof LegendGroup) {
                    let match = item.getById(id);
                    if (match) {
                        return match;
                    }
                }
            }
        }
        return undefined;
    }

    /** Toggles group to reveal/hide children (if applicable).*/
    toggleExpanded(): void {
        if (typeof this._legendBlock.expanded !== 'undefined') {
            this._legendBlock.expanded = !this._legendBlock.expanded;
        }
    }

    /**
     * Set the appropriate group properties such as id, visibility and opacity. Called whenever group is created or reloaded.
     * @param legendBlock LegendBlock that this LegendGroup represents
     * @ignore
     */
    _initSettings(legendBlock: any): void {
        legendBlock.entries.filter((entry: any) => !entry.hidden).forEach((entry: any) => {

            // if a corresponding child already exists, reinit settings
            let childExists = false;
            this._children.forEach(child => {
                if (child._legendBlock._layerRecordId === entry._layerRecordId && child._legendBlock._blockConfig._entryIndex === entry._blockConfig._entryIndex) {
                    if (entry.parent.entries.indexOf(entry) === this._children.indexOf(child)) {
                        child._initSettings(entry);
                        childExists = true;
                    }
                }
            });

            // otherwise create new LegendGroup/LegendItem and push to child array
            if (!childExists) {
                if ((entry.blockConfig.entryType === LegendTypes.Group || entry.blockConfig.entryType == LegendTypes.Set) && !entry.collapsed) {
                    this._children.push(new LegendGroup(this._mapInstance, entry));
                } else { // it's a collapsed dynamic layer or a node/infoSection
                    this._children.push(new LegendItem(this._mapInstance, entry));
                }
            }
        });

        this._legendBlock = legendBlock;
        this._type = legendBlock.blockConfig.entryType;
        this._availableControls = legendBlock.availableControls

        this._id = legendBlock.id;

        this._name = legendBlock.name;
        this._visibility = legendBlock.visibility;
        this._opacity = legendBlock.opacity;
        this._queryable = legendBlock.query;

        this.children.forEach(child => {
            child.visibilityChanged.subscribe(() => {
                if (this.visibility !== this._legendBlock.visibility) {
                    this._visibilityChanged.next(this._legendBlock.visibility);
                }
            });
            child.opacityChanged.subscribe(() => {
                if (this.opacity !== this._legendBlock.opacity) {
                    this._opacityChanged.next(this._legendBlock.opacity);
                }
            });
            child.queryableChanged.subscribe(() => {
                if (this.queryable !== this._legendBlock.query) {
                    this._queryableChanged.next(this._legendBlock.query);
                }
            });
        });
    }
}

enum LegendTypes {
    Group = 'legendGroup',
    Set = 'legendSet',
    Node = 'legendNode',
    Info = 'legendInfo',
}

enum AvailableControls {
    Opacity = 'opacity',
    Visibility = 'visibility',
    Boundingbox = 'boundingBox',
    Query = 'query',
    Snapshot = 'snapshot',
    Metadata = 'metadata',
    BoundaryZoom = 'boundaryZoom',
    Refresh = 'refresh',
    Reload = 'reload',
    Remove = 'remove',
    Settings = 'settings',
    Data = 'data',
    Symbology = 'symbology'
}

interface LegendStructure {
    type: string;
    JSON: LegendJSON;
}

interface LegendJSON {
    type: string;
    root: EntryGroupJSON;
}

interface EntryGroupJSON {
    name: string;
    expanded?: boolean;
    children: Array<JSON>;
    controls?: Array<string>;
    disabledControls?: Array<string>;
}
