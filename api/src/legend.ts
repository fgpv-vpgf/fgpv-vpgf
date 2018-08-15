/**
 *               __
 *              /    \
 *             | STOP |
 *              \ __ /
 *                ||
 *                ||
 *                ||
 *                ||
 *                ||
 *              ~~~~~~~
 * THE CODE HEREIN IS A WORK IN PROGRESS - DO NOT USE, BREAKING CHANGES WILL OCCUR FREQUENTLY.
 *
 * THIS API IS NOT SUPPORTED.
 */

import { Observable, Subject } from 'rxjs';

/**
 * Provides the core API fucntionality for all legends (simple and config)
 */
class BaseLegend {
    /** @ignore */
    _children: Array<LegendItem | LegendGroup>;
    // Element added/removed observables
    /** @ignore */
    _configSnippets: Array<JSON>;

    /** @ignore */
    _mapInstance: any;
    /** @ignore */
    _click: Subject<LegendItem | LegendGroup>;

    /**@ignore **/
    _dataTableToggled: Subject<any>;

    /**
     * Create a new legend instance. Most likely will not be used directly.
     * Should be instantiated as either ConfigLegend or SimpleLegend
     * @param mapInstance
     * @param configSnippets
     */
    constructor(mapInstance: any, configSnippets: Array<JSON>) {
        this._mapInstance = mapInstance;
        this._configSnippets = configSnippets;
        this._children = [];
        this._click = new Subject();
    }

    /**
     * Return list of LegendItems and LegendGroups for the legend
     */
    get children(): Array<LegendItem | LegendGroup> {
        return this._children;
    }

    /**
     * Return list of config snipppets for the legend
     */
    get configSnippets(): Array<JSON> {
        return this._configSnippets;
    }

    /**
     * Set list of config snipppets for the legend
     */
    set configSnippets(snippets: Array<JSON>) {
        this._configSnippets = snippets;
    }

    /**
     * Get a LegendItem or LegendGroup by id
     */
    getById(layerId: string): LegendItem | LegendGroup | undefined {
        return this._children.find(item => item.id === layerId);
    }

    /**
     * Expand all LegendGroups in legend
     */
    expandGroups() {
        this._mapInstance.instance.toggleLegendGroupEntries();
    }

    /**
     * Collapse all LegendGroups in legend
     */
    collapseGroups() {
        this._mapInstance.instance.toggleLegendGroupEntries(false);
    }

    /**
     * Show all LegendItems and LegendGroups in legend
     */
    showAll() {
        this._mapInstance.instance.toggleLegendEntries();
    }

    /**
     * Hide all LegendItems and LegendGroups in legend
     */
    hideAll() {
        this._mapInstance.instance.toggleLegendEntries(false);
    }

    /**
     * Emits whenever a layer is clicked on the legend.
     * @event click
     */
    get click(): Observable<LegendItem | LegendGroup> {
        return this._click.asObservable();
    }

}

/**
 * A single `ConfigLegend` instance is created for each map instance and can be
 * either structured or auto.
 */
export class ConfigLegend extends BaseLegend {
    _type: string;
    _reorderable: boolean;
    _legendStructure: LegendStructure;
    _sortGroup: Array<Array<LegendItem | LegendGroup>>;

    constructor(mapInstance: any, legendStructure: LegendStructure) {
        super(mapInstance, legendStructure.JSON.root.children);

        this._type = legendStructure.type;
        this._reorderable = mapInstance.legend._reorderable;
        this._legendStructure = legendStructure;
        this._sortGroup = [[], []];
    }

    /**
     * Return list of config snipppets for the legend
     */
    get configSnippets(): Array<JSON> {
        return this._configSnippets;
    }

    /**
     * Set list of config snipppets for the legend
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
     * Get a LegendItem or LegendGroup by id. Returns undefined if a matching `id` is not found
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

export class SimpleLegend extends BaseLegend {
    // TODO: implement SimpleLegen as menitioned in https://github.com/fgpv-vpgf/fgpv-vpgf/issues/2815
}

/**
 * Provides the core API fucntionality for `LegendItems` and `LegendGroups`
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
    _opacityChanged: Subject<number>;

    /** @ignore */
    _queryable: boolean;
    _queryableChanged: Subject<boolean>;

    /** @ignore */
    _visibility: boolean;
    _visibilityChanged: Subject<boolean>;

    /**
 * Create a new BaseItem, initialize the observables
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
     * Gets visibility of the BaseItem;
     * True if the item is currently visible, false otherwise
     */
    get visibility(): boolean | undefined {
        return this._visibility;
    }

    /**
     * Sets visibility of the BaseItem
     * @param visibility true if visible, false if invisible. undefined has no effect.
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
     * Returns the opacity of the BaseItem;
     * Ranges from 0 (hidden) to 1 (fully visible)
     */
    get opacity(): number | undefined {
        return this._opacity;
    }

    /**
     * Sets the opacity value for the BaseItem
     * @param opacity ranges from 0 (hidden) to 1 (fully visible); undefined has no effect
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
     * True if the item is queryable, false otherwise
    */
    get queryable(): boolean | undefined {
        return this._queryable;
    }

    /** Sets query value of the BaseItem
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

    /** Removes element from legend and removes layer if it's the last reference to it*/
    remove() {
        if (this._availableControls.includes(AvailableControls.Remove)) {
            this._mapInstance.instance.removeAPILegendBlock(this._legendBlock);
        }
    }

    /** Reloads element in legend */
    reload() {
        if (this._availableControls.includes(AvailableControls.Reload)) {
            this._mapInstance.instance.reloadAPILegendBlock(this._legendBlock);
        }
    }

    /**
     * Toggles metadata panel to open/close for the BaseItem
     */
    toggleMetadata(): void {
        if (this._availableControls.includes(AvailableControls.Metadata)) {
            this._mapInstance.instance.toggleMetadata(this._legendBlock);
        }
    }

    /**
     * Toggles settings panel to open/close type for the BaseItem
     */
    toggleSettings(): void {
        if (this._availableControls.includes(AvailableControls.Settings)) {
            this._mapInstance.instance.toggleSettings(this._legendBlock);
        }
    }

    /**
     * Toggles data table panel to open/close for the BaseItem
     */
    toggleDataTable(): any {
        if (this._availableControls.includes(AvailableControls.Data)) {
            let legendBlock = this._legendBlock;
            this._mapInstance.instance.toggleDataTable(legendBlock);
            while (legendBlock.parent){
                legendBlock = legendBlock.parent
            }
            legendBlock._blockConfig._tableToggled.next(this._legendBlock);
        }
    }
}

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

    /** Expand/collapses symbology stack. */
    toggleSymbologyStack(): void {
        if (this.type === LegendTypes.Node || this._legendBlock.infoType === 'unboundLayer') {
            this._legendBlock.symbologyStack.expanded = !this._legendBlock.symbologyStack.expanded;
        }
    }

    /**
     * Toggles the Symbologies for LegendItems of type legendNode with toggle-able symbology items (in a symbology stack).
     * @param names List of strings matching the name of the symbologies to toggle
     */
    toggleSymbologies(names: Array<string>): void {
        if (this._availableControls.includes(AvailableControls.Symbology)) {
            names.forEach(name => {
                // toggle only if the symbology item has toggle button
                if (this._legendBlock.symbologyStack.toggleList[name]) {
                    this._legendBlock.symbologyStack.onToggleClick(name);
                }
            });
        }
    }

    /**
     * Set the appropriate item properties such as id, visibility and opacity.
     * Called whenever the legend block is created or reloaded.
     * @param itemBlock The LegendBlock that this LegendItem represents
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
