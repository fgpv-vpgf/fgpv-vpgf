import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Rx';
import { LayerNode } from 'api/schema';

/**
 * Represents a base layer implementation that will be extended by ConfigLayer and SimpleLayer
 */
export class BaseLayer {
    private _mapInstance: any;

    protected _dataArray: Array<DataItem>;
    protected _id: string;

    // index required when reloading dynamic layers to differentiate between them since id is same for all children
    private _dynamicLayerIndex: string;

    protected _name: string;
    private _nameChanged: Observable<LayerNode>;

    protected _opacity: number;
    private _opacityChanged: Observable<LayerNode>;

    protected _visibility: boolean;
    private _visibilityChanged: Observable<LayerNode>;

    // slight inconsistency between dynamic layers and other types of layers
    // the viewerLayer for dynamics is the 'LayerInterface' whereas for others its the 'LayerRecord'
    private _viewerLayer: LayerNode;

    protected _dataAdded: Subject<Array<DataItem>>;
    protected _dataChanged: Subject<Array<DataItem>>;
    protected _dataRemoved: Subject<Array<DataItem>>;

    constructor(mapInstance: any) {
        this._mapInstance = mapInstance;
        this._dataArray = [];
        this._dataAdded = new Subject();
        this._dataChanged = new Subject();
        this._dataRemoved = new Subject();
    }

    /**
     * Emits whenever one or more data items are added.
     * @event dataAdded
    */
    get dataAdded(): Observable<Array<DataItem>> {
        return this._dataAdded.asObservable();
    }

    /**
     * Emits whenever an existing data entry is updated.
     * @event dataChanged
    */
    get dataChanged(): Observable<Array<DataItem>> {
        return this._dataChanged.asObservable();
    }

    /**
     * Emits whenever data is removed.
     * @event dataRemoved
    */
    get dataRemoved(): Observable<Array<DataItem>> {
        return this._dataRemoved.asObservable();
    }

    /** Returns the viewer map instance. Type any for convenience */
    get mapI(): any {
        return this._mapInstance;
    }

    /** Returns the viewer layer instance. Type any for convenience  */
    get layerI(): any {
        return this._viewerLayer;
    }

    set layerI(value: any) {
        this._viewerLayer = value;
    }

    /** Returns the value of the requested data, or undefined if the data does not exist. */
    getData(key: string): string | number | undefined;

    /** Returns all data. If applicable, this will pull data from a server, however an empty array will still be
     * returned if no prior data existed. Use the `data_added` event to determine when pulled data is ready. */
    getData(): Array<DataItem>;

    /** If key provided, returns the value of the requested data, or undefined if the data does not exist. Else returns all data */
    getData(key?: string): string | number | undefined | Array<DataItem> {
        let data: DataItem | undefined;

        if (typeof key !== 'undefined') {
            data = this._dataArray.find(el => el.name === key);

            return typeof data !== 'undefined' ? data.value : undefined;
        } else {
            if (this._dataArray.length === 0) {
                this.fetchData();
                return [];
            } else {
                return this._dataArray;
            }
        }
    }

    /** Forces a data download. Function implementation in subclasses */
    fetchData(): void { }

    /** Sets the value of a data item by key. */
    setData(key: string, newValue: string | number): void;

    /** Sets data for each key-value pair in the provided object. */
    setData(keyValue: Object): void;

    /** Sets the value of a data item by key or for each key-value pair in the provided object. */
    setData(keyOrKeyValuePair: string | Object, newValue?: string | number | undefined): void {
        if (typeof keyOrKeyValuePair === 'string') {
            let dataValue: DataItem | undefined = this._dataArray.find(data => data.name === keyOrKeyValuePair);

            if (typeof dataValue !== 'undefined') {
                const oldValue: DataItem | undefined = Object.assign({}, dataValue);
                dataValue.value = <string | number>newValue;

                this._dataChanged.next([ oldValue, dataValue ]);
            }
        } else {
            for (let key in keyOrKeyValuePair) {
                let dataValue: DataItem | undefined = this._dataArray.find(data => data.name === key);

                if (typeof dataValue !== 'undefined') {
                    const oldValue: DataItem | undefined = Object.assign({}, dataValue);
                    dataValue.value = (<any>keyOrKeyValuePair)[key];

                    this._dataChanged.next([ oldValue, dataValue ]);
                }
            }
        }
    }

    /** Returns the layer ID. */
    get id(): string { return this._id; }

    /** Returns the dynamic layer index. */
    get dynamicLayerIndex(): string { return this._dynamicLayerIndex; }

    /** Sets the index for the dynamic layer */
    set dynamicLayerIndex(idx: string) {
        this._dynamicLayerIndex = idx;
    }

    /** Returns the name of the layer.  */
    get name(): string { return this._name; }

    /** Sets the name of the layer. This updates the name throughout the viewer. */
    set name(name: string) {
        // TODO: currently does not work for dynamic children. need to decide how to move forward with this  ?
        // Setting the name seems to be more legend based than directly layer based and may possibly need to be moved
        // to a different part of the API as opposed to a layer modification
        // http://fgpv-vpgf.github.io/fgpv-vpgf/api/classes/_index_d_.rv.ui.legendentry.html#settitle (appropriate place it seems)
        this._name = name;
        this.layerI.name = name;
    }

    set nameChanged(observable: Observable<LayerNode>) {
        this._nameChanged = observable;
        this._nameChanged.subscribe(layer => {
            if (this.id === layer.id) {
                this.name = layer.name || '';
            }
        });
    }

    /**
     * Emits whenever the layer name is changed.
     * @event nameChanged
    */
    get nameChanged(): Observable<LayerNode> {
        return this._nameChanged;
    }

    /** Returns the opacity of the layer on the map from 0 (hidden) to 100 (fully visible) */
    get opacity(): number { return this._opacity; }

    /** Sets the opacity value for the layer. */
    set opacity(opacity: number) {
        this._opacity = opacity;
        this.layerI.setOpacity(opacity);
    }

    set opacityChanged(observable: Observable<LayerNode>) {
        this._opacityChanged = observable;
        this._opacityChanged.subscribe(layer => {
            if (this.id === layer.id) {
                const opacity = this.layerI.opacity;
                this.opacity = opacity;
            }
        });
    }

    /**
     * Emits whenever the layer opacity is changed.
     * @event opacityChanged
    */
    get opacityChanged(): Observable<LayerNode> {
        return this._opacityChanged;
    }

    /** Returns true if the layer is currently visible, false otherwise. */
    get visibility(): boolean { return this._visibility; }

    /** Sets the visibility to visible/invisible. */
    set visibility(visibility: boolean) {
        this._visibility = visibility;
        this.layerI.setVisibility(visibility);
    }

    set visibilityChanged(observable: Observable<LayerNode>) {
        this._visibilityChanged = observable;
        this._visibilityChanged.subscribe(layer => {
            if (this.id === layer.id) {
                const visibility = this.layerI.visibility;
                this.visibility = visibility;
            }
        });
    }

    /**
     * Emits whenever the layer visibility is changed.
     * @event visibilityChanged
    */
    get visibilityChanged(): Observable<LayerNode> {
        return this._visibilityChanged;
    }

    /** Recursively calls callback for every data item. */
    forEachData(callback: (data: DataItem) => void): void {
        this._dataArray.forEach(callback);
    }

    /** Removes the data with the given key, or all data if key is undefined. */
    removeData(key: string | undefined): void {
        if (typeof key !== 'undefined') {
            let allData: Array<DataItem> = this.getData();
            let dataIndex: number = this._dataArray.findIndex(el => el.name === key);

            if (dataIndex !== -1) {
                const value: string | number = (<any>this._dataArray)[key];
                allData.splice(dataIndex, 1);

                this._dataRemoved.next([{ name: key, value: value }]);
            }
        } else {
            const copyData: Array<DataItem> = this._dataArray;
            this._dataArray = [];

            this._dataRemoved.next(copyData);
        }
    }

    /** Exports the layer to a GeoJSON object. */
    toGeoJson(callback: (obj: Object) => void): void {
        // TODO: complete this function  ?
    }
}

export interface DataItem {
    name: string,
    value: string | number
}