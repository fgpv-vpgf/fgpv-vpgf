import { Observable, Subject } from 'rxjs';

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
    * @param {LegendNode} itemBlock - The LegendNode that this LegendItem represents
    * @param {Map.mapI} mapInstance - the mapInstance that this LegendItem is for
    */
    constructor(itemBlock: any, mapInstance: any) {
        this._mapInstance = mapInstance;
        this._visibilityChanged = new Subject();
        this._opacityChanged = new Subject();
        this._visibilityChanged.subscribe(visibility => (this._visibility = visibility));
        this._opacityChanged.subscribe(opacity => (this._opacity = opacity));
        this._initBlockSettings(itemBlock);
    }

    /** Gets visibility of LegendItems that are of type "entry"
     * @return {boolean} - true if the item is currently visible, false otherwise
    */
    get visibility(): boolean {
        if (this.type === "infoSection" || !(this._availableControls.includes(AvailableControls.Visibility))) return false;
        return this._visibility;
    }

    /** Sets visibility of LegendItems that are of type "entry"
     * @param {boolean} visibility - true if visible, false if invisible.
     */
    set visibility(visibility: boolean) {
        if (this.type === "infoSection" || !(this._availableControls.includes(AvailableControls.Visibility))) return;
        const oldVisibility: boolean = this._legendBlock.visibility;

        this._visibility = visibility;
        this._legendBlock.visibility = visibility;

        if (oldVisibility !== visibility) {
            this._visibilityChanged.next(visibility);
        }
    }

    /**
     * Emits whenever the item visibility is changed.
     * @event visibilityChanged
     */
    get visibilityChanged(): Observable<boolean> {
        return this._visibilityChanged.asObservable();
    }

    /** Returns the opacity of LegendItems of type "entry".
     * @return {number} - ranges from 0 (hidden) to 1 (fully visible)
     * */
    get opacity(): number {
        if (this.type === "infoSection" || !(this._availableControls.includes(AvailableControls.Opacity))) return 0;
        return this._opacity;
    }

    /** Sets the opacity value for LegendItems of type "entry"
     * @param {number} opacity- ranges from 0 (hidden) to 1 (fully visible)
     */
    set opacity(opacity: number) {
        if (this.type === "infoSection" || !(this._availableControls.includes(AvailableControls.Opacity))) return;

        const oldOpacity: number = this._legendBlock.opacity;
        this._opacity = opacity;
        this._legendBlock.opacity = opacity;

        if (oldOpacity !== opacity) {
            this._opacityChanged.next(opacity);
        }
    }

    /**
     * Emits whenever the item opacity is changed.
     * @event opacityChanged
     */
    get opacityChanged(): Observable<number> {
        return this._opacityChanged.asObservable();
    }

    /** Expand symbology stack. */
    expandSymbologyStack(): void {
        if (this.type === 'infoSection' && this._legendBlock.infoType !== 'unboundLayer') return;
        this._legendBlock.symbologyStack.expanded = true;
    }

    /** Collapse symbology stack. */
    collapseSymbologyStack(): void {
        if (this.type === 'infoSection' && this._legendBlock.infoType !== 'unboundLayer') return;
        this._legendBlock.symbologyStack.expanded = false;
    }

    /**
     * Toggles the Symbology Stack for LegendItems of type "entry" with toggle-able symbology items
     * @param {[string]} names - list of strings matching the name of the symbologies to toggle
     * @example
     * */
    toggleSymbologyStack(names: [string]): void {
        if (this.type === "infoSection" || !(this._availableControls.includes(AvailableControls.Symbology))) return;
        names.forEach(name => {
            //toggle only if the symbology item has toggle button
            if (this._legendBlock.symbologyStack.toggleList[name]) {
                this._legendBlock.symbologyStack.onToggleClick(name);
            }
        });
    }

    /**
     * Toggles metadata panel to open/close for LegendItems of type "entry" with existing metadata URLs.
    */
    toggleMetadata(): void {
        if (this.type === "infoSection" || !(this._availableControls.includes(AvailableControls.Metadata))) return;
        this._mapInstance.instance.toggleMetadata(this._legendBlock);
    }

    /**
     * Toggles settings panel to open/close type for LegendItems of type  "entry"
     * */
    toggleSettings(): void {
        if (this.type === "infoSection" || !(this._availableControls.includes(AvailableControls.Settings))) return;
        this._mapInstance.instance.toggleSettings(this._legendBlock);
    }

    /**
     * Toggles data table panel to open/close for all LegendItems of type "entry"
    */
    toggleDataTable(): void {
        if (this.type === "infoSection" || !(this._availableControls.includes(AvailableControls.Data))) return;
        this._mapInstance.instance.toggleDataTable(this._legendBlock);
    }

    /**
     * Returns what type this LegendItem is.
     * @param string - either type "entry" or "infoSection"
     */
    get type(): string {
        return this._type;
    }

    get id(): string {
        return this._id;
    }

    /** Set the appropriate item properties such as id, visibility and opacity.
     * Called whenever the legend block is created or reloaded.
     * */
    _initBlockSettings(itemBlock: any): void {
        this._legendBlock = itemBlock;
        this._id = itemBlock.id;

        if (itemBlock.blockConfig.entryType === "legendInfo") {
            this._type = "infoSection";
        }
        else {
            this._type = "entry";
            this._visibility = itemBlock.visibility;
            this._opacity = itemBlock.opacity;
            this._availableControls = itemBlock.availableControls;
        }
    }
}

class LegendGroup {

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
