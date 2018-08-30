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
     * Return list of LegendItems and LegendGroups for the legend
     */
    get configSnippets(): Array<JSON> {
        return this._configSnippets;
    }

    /**
     * Return list of LegendItems and LegendGroups for the legend
     */
    set configSnippets(snippets: Array<JSON>) {
        this._configSnippets = snippets;
    }

    /**
     * Get a LegendItem or LegendGroup by id
     * @function getById
     * @param layerId
     */
    getById(layerId: string): LegendItem | LegendGroup | undefined {
        return this._children.find(item => item.id === layerId);
    }

    /**
     * Expand all LegendGroups in legend
     * @function expandGroups
     */
    expandGroups() {
        this._mapInstance.instance.toggleLegendGroupEntries();
    }

    /**
     * Collapse all LegendGroups in legend
     * @function collapseGroups
     */
    collapseGroups() {
        this._mapInstance.instance.toggleLegendGroupEntries(false);
    }

    /**
     * Show all LegendItems and LegendGroups in legend
     * @function showAll
     */
    showAll() {
        this._mapInstance.instance.toggleLegendEntries();
    }

    /**
     * Hide all LegendItesm and LegendGroups in legend
     * @function hideAll
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
 * Legend for a map instance
 * Can be auto or structured legends
 * Only one per map
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
     * Return list of LegendItems and LegendGroups for the legend
     */
    get configSnippets(): Array<JSON> {
        return this._configSnippets;
    }

    /**
     * Return list of LegendItems and LegendGroups for the legend
     * @override
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
     * Get a LegendItem or LegendGroup by id
     * @override
     * @function getById
     * @param id
     */
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
    }

    /**
     * Updates a group's or item's position in the legend
     * @function updateLayerPosition
     * @param item  LegendItem or LegendGroup to change position
     * @param index  New index to put the item
     */
    updateLayerPosition(item: LegendItem | LegendGroup, index: number): void {
        if (this._reorderable) {
            // Needs to be done this way to invoke the legendBlocks setter to apply the changes instantly
            let groupBorder = this._sortGroup[0].length;
            let tempLegendBlocks = this._mapInstance.legendBlocks;
            let entries = tempLegendBlocks.entries;
            let entriesIndex = index;
            if (item._legendBlock.sortGroup === 0 && index >= groupBorder) {
                entriesIndex = entries.length + 1;
            } else if (item._legendBlock.sortGroup === 1) {
                entriesIndex = groupBorder + index
            }
            const itemIndex = entries.findIndex((entry: any) => entry.id === item.id);
            if (entriesIndex >= 0 && entriesIndex < entries.length && itemIndex >= 0) {
                entries.splice(entriesIndex, 0, entries.splice(itemIndex, 1)[0]);
                let group = this._sortGroup[item._legendBlock.sortGroup];
                group.splice(index, 0, group.splice(index, 1)[0]);
                this._mapInstance.legendBlocks = tempLegendBlocks;
                this._mapInstance.instance.synchronizeLayerOrder();
            }
        }
    }
}

export class SimpleLegend extends BaseLegend {
    // TODO
}

export class LegendItem {

    /** @ignore */
    _mapInstance: any;

    /** @ignore */
    _legendBlock: any;

    /** @ignore */
    _id: string;

    /** @ignore */
    _name: string;

    /** @ignore */
    _opacity: number;
    _opacityChanged: Subject<number>;

    /** @ignore */
    _visibility: boolean;
    _visibilityChanged: Subject<boolean>;

    /** @ignore */
    _queryable: boolean;
    _queryableChanged: Subject<boolean>;

    /**@ignore*/
    _type: string;

    /** @ignore */
    _availableControls: Array<AvailableControls>;

    /**
     * Creates a new LegendItem, initializes attributes.
     * @param {Map.mapI} mapInstance - the mapInstance that this LegendItem is for
     * @param {LegendNode} itemBlock - The LegendNode that this LegendItem represents
     */
    constructor(mapInstance: any, itemBlock: any) {
        this._mapInstance = mapInstance;

        this._visibilityChanged = new Subject();
        this._opacityChanged = new Subject();
        this._queryableChanged = new Subject();

        this._visibilityChanged.subscribe(visibility => (this._visibility = visibility));
        this._opacityChanged.subscribe(opacity => (this._opacity = opacity));
        this._queryableChanged.subscribe(queryable => (this._queryable = queryable));

        this._initSettings(itemBlock);
    }

    /** Gets visibility of LegendItems that are of type legendNode
     * @return {boolean} - true if the item is currently visible, false otherwise
     */
    get visibility(): boolean | undefined {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Visibility)) {
            return this._visibility;
        }
    }

    /** Sets visibility of LegendItems that are of type legendNode
     * @param {boolean} visibility - true if visible, false if invisible. undefined has no effect.
     */
    set visibility(visibility: boolean | undefined) {
        if (typeof visibility !== 'undefined' && this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Visibility)) {
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

    /** Returns the opacity of LegendItems of type legendNode
     * @return {number} - ranges from 0 (hidden) to 1 (fully visible). undefined has no effect.
     */
    get opacity(): number | undefined {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Opacity)) {
            return this._opacity;
        }
    }

    /** Sets the opacity value for LegendItems of type legendNode
     * @param {number} opacity- ranges from 0 (hidden) to 1 (fully visible)
     */
    set opacity(opacity: number | undefined) {
        if (typeof opacity !== 'undefined' && this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Opacity)) {
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

    /** Gets queryable value of LegendItems that are of type legendNode.
     * @return {boolean} - true if the item is queryable, false otherwise
    */
    get queryable(): boolean | undefined {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Query)) {
            return this._queryable;
        }
    }

    /** Sets query value of LegendItems that are of type legendNode
     * @param {boolean} queryable - true if item can be queried, false otherwise. undefined has no effect.
     */
    set queryable(queryable: boolean | undefined) {
        if (typeof queryable !== 'undefined' && this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Query)) {
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

    /** Removes element from legend and hides layer*/
    remove() {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Remove)) {
            this._mapInstance.instance.removeAPILegendBlock(this._legendBlock);
        }
    }

    /** Reloads element in legend */
    reload() {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Reload)) {
            this._mapInstance.instance.reloadAPILegendBlock(this._legendBlock);
        }
    }

    /** Expand/collapses symbology stack. */
    toggleSymbologyStack(): void {
        if (this.type === LegendTypes.Node || this._legendBlock.infoType === 'unboundLayer') {
            this._legendBlock.symbologyStack.expanded = !this._legendBlock.symbologyStack.expanded;
        }
    }

    /**
     * Toggles the Symbologies for LegendItems of type legendNode with toggle-able symbology items (in a symbology stack)
     * @param {[string]} names - list of strings matching the name of the symbologies to toggle
     */
    toggleSymbologies(names: [string]): void {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Symbology)) {
            names.forEach(name => {
                // toggle only if the symbology item has toggle button
                if (this._legendBlock.symbologyStack.toggleList[name]) {
                    this._legendBlock.symbologyStack.onToggleClick(name);
                }
            });
        }
    }

    /**
     * Toggles metadata panel to open/close for LegendItems of type legendNode with existing metadata URLs.
     */
    toggleMetadata(): void {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Metadata)) {
            this._mapInstance.instance.toggleMetadata(this._legendBlock);
        }
    }

    /**
     * Toggles settings panel to open/close type for LegendItems of type legendNode
     */
    toggleSettings(): void {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Settings)) {
            this._mapInstance.instance.toggleSettings(this._legendBlock);
        }
    }

    /**
     * Toggles data table panel to open/close for all LegendItems of type legendNode
     */
    toggleDataTable(): void {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Data)) {
            this._mapInstance.instance.toggleDataTable(this._legendBlock);
        }
    }

    /**
     * Returns what type this LegendItem is.
     * @param string - either type legendNode or legendInfo
     */
    get type(): string {
        return this._type;
    }

    /**
     * Returns the id of this LegendItem
     * @return {string} - the id of this LegendItem
     */
    get id(): string {
        return this._id;
    }

    /**
     * Returns the name of this LegendItem
     * @return {string} - the name of this LegendItem
     */
    get name(): string {
        return this._name;
    }

    /** Set the appropriate item properties such as id, visibility and opacity.
     * Called whenever the legend block is created or reloaded.
     */
    _initSettings(itemBlock: any): void {
        this._legendBlock = itemBlock;
        this._id = itemBlock.id;
        this._name = itemBlock.name;
        this._type = itemBlock.blockConfig.entryType;

        if (itemBlock.blockConfig.entryType === LegendTypes.Node) {
            this._visibility = itemBlock.visibility;
            this._opacity = itemBlock.opacity;
            this._queryable = itemBlock.query;
            this._availableControls = itemBlock.availableControls;
        }
    }
}

export class LegendGroup {
    /** @ignore */
    _mapInstance: any;
    /** @ignore */
    _legendBlock: any;

    /** @ignore */
    _children: Array<LegendGroup|LegendItem> = [];

    /** @ignore */
    _id: string;
    /** @ignore */
    _type: string;
    /** @ignore */
    _availableControls: Array<AvailableControls>;
    /** @ignore */
    _name: string;

    /** @ignore */
    _opacity: number;
    _opacityChanged: Subject<number>;

    /** @ignore */
    _queryable: boolean;
    _queryableChanged: Subject<boolean>;

    /** @ignore */
    _visibility: boolean;
    _visibilityChanged: Subject<boolean>;

    /** Sets the legend groups viewer map instance and legend block instance. */
    constructor(mapInstance: any, legendBlock: any) {
        this._mapInstance = mapInstance;

        this._visibilityChanged = new Subject();
        this._opacityChanged = new Subject();
        this._queryableChanged = new Subject();

        this._visibilityChanged.subscribe(visibility => (this._visibility = visibility));
        this._opacityChanged.subscribe(opacity => (this._opacity = opacity));
        this._queryableChanged.subscribe(queryable => (this._queryable = queryable));

        this._initSettings(legendBlock);

        this.children.forEach(child => {
            child.visibilityChanged.subscribe(() => {
                const oldVisibility: boolean = this.visibility;
                if (oldVisibility !== this._legendBlock.visibility) {
                    this._visibilityChanged.next(this._legendBlock.visibility);
                }
            });
            child.opacityChanged.subscribe(() => {
                const oldOpacity: number = this.opacity;
                if (oldOpacity !== this._legendBlock.opacity) {
                    this._opacityChanged.next(this._legendBlock.opacity);
                }
            });
            child.queryableChanged.subscribe(() => {
                const oldQueryable: boolean = this.queryable;
                if (oldQueryable !== this._legendBlock.query) {
                    this._queryableChanged.next(this._legendBlock.query);
                }
            });
        });

    }

    /** Returns the group ID. */
    get id(): string {
        return this._id;
    }

    /** Returns the group name. */
    get name(): string {
        return this._name;
    }

    /** Returns the group type. Can be either legendGroup or legendSet. */
    get type(): string {
        return this._type;
    }

    /** Returns the children for the group (if any). Children can be either LegendGroups (if nested groups) or LegendItems. */
    get children(): Array<LegendGroup|LegendItem> {
        return this._children;
    }

    /** Returns true if the group is currently visible, false otherwise. */
    get visibility(): boolean {
        return this._visibility;
    }

    /** Sets the visibility to visible/invisible. */
    set visibility(visibility: boolean) {
        if (this._availableControls.includes(AvailableControls.Visibility)) {
            if (this._visibility !== visibility) {
                this._visibility = visibility;
                this._legendBlock.visibility = visibility;
                this._visibilityChanged.next(visibility);
            }
        }
    }

    /**
     * Emits whenever the group visibility is changed.
     * @event visibilityChanged
     */
    get visibilityChanged(): Observable<boolean> {
        return this._visibilityChanged.asObservable();
    }

    /**
     * Returns the opacity of the group on the map from 0 (hidden) to 100 (fully visible).
     * NOTE: If the opacity is 0.5, it may represent different opacity values for the children inside the group.
     * It does not necessarily mean that all the children in the group have opacity set to 0.5.
    */
    get opacity(): number {
        return this._opacity;
    }

    /** Sets the opacity value for the group. */
    set opacity(opacity: number) {
        if (this._availableControls.includes(AvailableControls.Opacity)) {
            if (this._opacity !== opacity) {
                this._opacity = opacity;
                this._legendBlock.opacity = opacity;
                this._opacityChanged.next(opacity);
            }
        }
    }

    /**
     * Emits whenever the group opacity is changed.
     * @event opacityChanged
     */
    get opacityChanged(): Observable<number> {
        return this._opacityChanged.asObservable();
    }

    /** Returns true if the group is queryable, false otherwise. */
    get queryable(): boolean {
        return this._queryable;
    }

    /** Sets the query value for the group */
    set queryable(queryable: boolean) {
        if (this._availableControls.includes(AvailableControls.Query)) {
            if (this._queryable !== queryable) {
                this._queryable = queryable;
                this._legendBlock.query = queryable;
                this._queryableChanged.next(queryable);
            }
        }
    }

    /**
     * Emits whenever the group queryable value is changed.
     * @event queryableChanged
     */
    get queryableChanged(): Observable<boolean> {
        return this._queryableChanged.asObservable();
    }

    /**
     * Get a LegendItem or LegendGroup by id
     * @override
     * @function getById
     * @param id
     */
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

    /** Removes element from legend and hides layer*/
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
     * Toggles group to reveal/hide children (if applicable).
     */
    toggleExpanded(): void {
        if (typeof this._legendBlock.expanded !== 'undefined') {
            this._legendBlock.expanded = !this._legendBlock.expanded;
        }
    }

    /**
     * Toggles metadata panel to open/close for LegendItems of type legendNode with existing metadata URLs.
     */
    toggleMetadata(): void {
        if (this._availableControls.includes(AvailableControls.Metadata)) {
            this._mapInstance.instance.toggleMetadata(this._legendBlock);
        }
    }

    /**
     * Toggles settings panel to open/close type for LegendItems of type legendNode
     */
    toggleSettings(): void {
        if (this._availableControls.includes(AvailableControls.Settings)) {
            this._mapInstance.instance.toggleSettings(this._legendBlock);
        }
    }

    /**
     * Toggles data table panel to open/close for all LegendItems of type legendNode
     */
    toggleDataTable(): void {
        if (this._availableControls.includes(AvailableControls.Data)) {
            this._mapInstance.instance.toggleDataTable(this._legendBlock);
        }
    }

    /** Set the appropriate group properties such as id, visibility and opacity. Called whenever group is created or reloaded. */
    _initSettings(legendBlock: any): void {
        legendBlock.entries.filter((entry: any) => !entry.hidden).forEach((entry: any) => {
            if ((entry.blockConfig.entryType === LegendTypes.Group || entry.blockConfig.entryType == LegendTypes.Set) && !entry.collapsed) {
                this._children.push(new LegendGroup(this._mapInstance, entry));
            } else {    // it's a collapsed dynamic layer or a node/infoSection
                this._children.push(new LegendItem(this._mapInstance, entry));
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
