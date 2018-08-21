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

class BaseLegend {

}

export class ConfigLegend {

}

export class SimpleLegend {

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
        this._visibilityChanged.subscribe(visibility => (this._visibility = visibility));
        this._opacityChanged.subscribe(opacity => (this._opacity = opacity));
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
     * @param {boolean} visibility - true if visible, false if invisible.
     */
    set visibility(visibility: boolean | undefined) {
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Visibility)) {
            if (this._legendBlock.visibility !== !!visibility) {
                this._visibility = !!visibility;
                this._legendBlock.visibility = !!visibility;
                this._visibilityChanged.next(!!visibility);
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
     * @return {number} - ranges from 0 (hidden) to 1 (fully visible)
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
        if (this.type === LegendTypes.Node && this._availableControls.includes(AvailableControls.Opacity)) {
            if (this._legendBlock.opacity !== (opacity || 0)) {
                this._opacity = opacity || 0;
                this._legendBlock.opacity = opacity || 0;
                this._opacityChanged.next(opacity || 0);
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
            this._availableControls = itemBlock.availableControls;
        }
    }
}

export class LegendGroup {
    /** @ignore */
    _mapInstance: any;
    /** @ignore */
    _groupBlock: any;

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
    _expanded: boolean | undefined;

    /** @ignore */
    _opacity: number;
    _opacityChanged: Subject<number>;

    /** @ignore */
    _visibility: boolean;
    _visibilityChanged: Subject<boolean>;

    /** Sets the legend groups viewer map instance and legend block instance. */
    constructor(mapInstance: any, groupBlock: any) {
        this._mapInstance = mapInstance;

        this._visibilityChanged = new Subject();
        this._opacityChanged = new Subject();

        this._visibilityChanged.subscribe(visibility => (this._visibility = visibility));
        this._opacityChanged.subscribe(opacity => (this._opacity = opacity));

        this._initSettings(groupBlock);
    }

    /** Returns the group ID. */
    get id(): string {
        return this._id;
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
            const oldVisibility: boolean = this._groupBlock.visibility;

            this._visibility = visibility;
            this._groupBlock.visibility = visibility;

            if (oldVisibility !== visibility) {
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

    /** Returns the opacity of the group on the map from 0 (hidden) to 100 (fully visible). */
    get opacity(): number {
        return this._opacity;
    }

    /** Sets the opacity value for the group. */
    set opacity(opacity: number) {
        if (this._availableControls.includes(AvailableControls.Opacity)) {
            const oldOpacity: number = this._groupBlock.opacity;

            this._opacity = opacity;
            this._groupBlock.opacity = opacity;

            if (oldOpacity !== opacity) {
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

    /** Returns if the group on the map is expanded (if false, it is collapsed or not applicable). */
    get expanded(): boolean | undefined{
        return this._expanded;
    }

    /** Toggles group to reveal/hide children (if applicable). */
    set expanded(expanded: boolean | undefined) {
        if (typeof this._expanded !== 'undefined') {
            this._expanded = !!expanded;
            this._groupBlock.expanded = !!expanded;
        }
    }

    /**
     * Toggles metadata panel to open/close for LegendItems of type legendNode with existing metadata URLs.
     */
    toggleMetadata(): void {
        if (this._availableControls.includes(AvailableControls.Metadata)) {
            this._mapInstance.instance.toggleMetadata(this._groupBlock);
        }
    }

    /**
     * Toggles settings panel to open/close type for LegendItems of type legendNode
     */
    toggleSettings(): void {
        if (this._availableControls.includes(AvailableControls.Settings)) {
            this._mapInstance.instance.toggleSettings(this._groupBlock);
        }
    }

    /**
     * Toggles data table panel to open/close for all LegendItems of type legendNode
     */
    toggleDataTable(): void {
        if (this._availableControls.includes(AvailableControls.Data)) {
            this._mapInstance.instance.toggleDataTable(this._groupBlock);
        }
    }

    /** Set the appropriate group properties such as id, visibility and opacity. Called whenever group is created or reloaded. */
    _initSettings(groupBlock: any): void {
        groupBlock.entries.forEach((entry: any) => {
            if ((entry.blockConfig.entryType === LegendTypes.Group || entry.blockConfig.entryType == LegendTypes.Set) && !entry.collapsed) {
                this._children.push(new LegendGroup(this._mapInstance, entry));
            } else {    // it's a collapsed dynamic layer or a node/infoSection
                this._children.push(new LegendItem(this._mapInstance, entry));
            }
        });

        this._groupBlock = groupBlock;
        this._type = groupBlock.blockConfig.entryType;
        this._availableControls = groupBlock.availableControls

        this._id = groupBlock.id;

        this._expanded = this._groupBlock.expanded;
        this._name = groupBlock.name;
        this._visibility = groupBlock.visibility;
        this._opacity = groupBlock.opacity;
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
