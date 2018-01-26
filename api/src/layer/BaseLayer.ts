import { Observable, Subject } from 'rxjs/Rx';
import { LayerNode } from 'api/schema';

/**
 * Represents a base layer implementation that will be extended by ConfigLayer and SimpleLayer
 */
export class BaseLayer {
    protected _mapInstance: any;

    protected _attributeArray: Array<Attribute>;
    protected _id: string;

    // index required when reloading dynamic layers to differentiate between children since id is same for all of them
    protected _layerIndex: number | undefined;

    protected _name: string;
    private _nameChanged: Observable<LayerNode>;

    protected _opacity: number;
    private _opacityChanged: Observable<LayerNode>;

    protected _visibility: boolean;
    private _visibilityChanged: Observable<LayerNode>;

    // slight inconsistency between dynamic layers and other types of layers
    // the viewerLayer for dynamics is the 'LayerInterface' whereas for others its the 'LayerRecord'
    protected _viewerLayer: any;

    protected _attributesAdded: Subject<Array<Attribute>>;
    protected _attributesChanged: Subject<Array<Attribute>>;
    protected _attributesRemoved: Subject<Array<Attribute>>;

    /** Sets the layers viewer map instance. */
    constructor(mapInstance: any) {
        this._mapInstance = mapInstance;
        this._attributeArray = [];
        this._attributesAdded = new Subject();
        this._attributesChanged = new Subject();
        this._attributesRemoved = new Subject();
    }

    /**
     * Emits whenever one or more attributes are added.
     * @event attributesAdded
     */
    get attributesAdded(): Observable<Array<Attribute>> {
        return this._attributesAdded.asObservable();
    }

    /**
     * Emits whenever an existing attribute entry is updated.
     * @event attributesChanged
     */
    get attributesChanged(): Observable<Array<Attribute>> {
        return this._attributesChanged.asObservable();
    }

    /**
     * Emits whenever attributes are removed.
     * @event attributesRemoved
     */
    get attributesRemoved(): Observable<Array<Attribute>> {
        return this._attributesRemoved.asObservable();
    }

    /** Returns the viewer layer instance. Type any for convenience  */
    get layerI(): any {
        return this._viewerLayer;
    }

    /** Returns all values of the requested attribute by id, or an empty array if the attribute id does not exist. */
    getAttributes(key: string): Array<Attribute>;

    /** Returns all attributes. If applicable, this will pull attributes from a server, however an empty array will still be
     * returned if no prior attributes existed. Use the `attributes_added` event to determine when pulled attribute ares ready. */
    getAttributes(): Array<Attribute>;

    /** If key provided, returns the requested attributes by id, or an empty array if the attribute id does not exist. Else returns all attributes */
    getAttributes(key?: string): Array<Attribute> {
        let attributes: Array<Attribute>;

        if (typeof key !== 'undefined') {
            return this._attributeArray.filter(el => el.id === key);
        } else {
            if (this._attributeArray.length === 0) {
                this.fetchAttributes();
                return [];
            } else {
                return this._attributeArray;
            }
        }
    }

    /** Forces an attribute download. Function implementation in subclasses */
    fetchAttributes(): void { }

    /** Sets the value of an attribute item by key. */
    setAttributes(key: string, newValue: string | number): void;

    /** Sets attributes for each key-value pair in the provided object. */
    setAttributes(keyValue: Object): void;

    /** Sets the value of an attribute item by key or for each key-value pair in the provided object. */
    setAttributes(keyOrKeyValuePair: string | Object, newValue?: string | number | undefined): void {
        if (typeof keyOrKeyValuePair === 'string') {
            let attribValue: Attribute | undefined = this._attributeArray.find(attrib => attrib.id === keyOrKeyValuePair);

            if (typeof attribValue !== 'undefined') {
                const oldValue: Attribute | undefined = Object.assign({}, attribValue);
                attribValue.value = <string | number>newValue;

                this._attributesChanged.next([ oldValue, attribValue ]);
            }
        } else {
            for (let key in keyOrKeyValuePair) {
                let attribValue: Attribute | undefined = this._attributeArray.find(attrib => attrib.id === key);

                if (typeof attribValue !== 'undefined') {
                    const oldValue: Attribute | undefined = Object.assign({}, attribValue);
                    attribValue.value = (<any>keyOrKeyValuePair)[key];

                    this._attributesChanged.next([ oldValue, attribValue ]);
                }
            }
        }
    }

    /** Returns the layer ID. */
    get id(): string { return this._id; }

    /** Returns the layer index. */
    get layerIndex(): number | undefined { return this._layerIndex; }

    /** Returns the name of the layer.  */
    get name(): string { return this._name; }

    /** Sets the name of the layer. This updates the name throughout the viewer. */
    set name(name: string) {
        // TODO: currently does not work for dynamic children. need to decide how to move forward with this  ?
        // Setting the name seems to be more legend based than directly layer based and may possibly need to be moved
        // to a different part of the API as opposed to a layer modification
        // http://fgpv-vpgf.github.io/fgpv-vpgf/api/classes/_index_d_.rv.ui.legendentry.html#settitle (appropriate place it seems)
        this._name = name;
        this._viewerLayer.name = name;

        // this._viewerLayer.initialConfig.name = name;    // run this by James, won't work for dynamics without layerRecord  ?
                                                        // even then it won't work correctly, need to think of something else
    }

    set nameChanged(observable: Observable<LayerNode>) {
        this._nameChanged = observable;
        this._nameChanged.subscribe(layer => {
            if (this.id === layer.id && this.name !== layer.name) {
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
        this._viewerLayer.setOpacity(opacity);

        // this._viewerLayer.initialConfig.state.opacity = opacity;    // run this by James, won't work for dynamics without layerRecord  ?
                                                                    // even then it won't work correctly, need to think of something else
    }

    set opacityChanged(observable: Observable<LayerNode>) {
        this._opacityChanged = observable;
        this._opacityChanged.subscribe(layer => {
            if (this.id === layer.id && this.opacity !== this._viewerLayer.opacity) {
                const opacity = this._viewerLayer.opacity;
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
        this._viewerLayer.setVisibility(visibility);

        // this._viewerLayer.initialConfig.state.visibility = visibility;  // run this by James, won't work for dynamics without layerRecord  ?
                                                                        // even then it won't work correctly, need to think of something else
                                                                        // infinite loop if subscribe and don't specify visibility has to be different ???
    }

    set visibilityChanged(observable: Observable<LayerNode>) {
        this._visibilityChanged = observable;
        this._visibilityChanged.subscribe(layer => {
            if (this.id === layer.id && this.visibility !== this._viewerLayer.visibility) {
                const visibility = this._viewerLayer.visibility;
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

    /** Recursively calls callback for every attribute item. */
    forEachAttribute(callback: (attrib: Attribute) => void): void {
        this._attributeArray.forEach(callback);
    }

    /** Removes the attribute with the given key, or all attributes if key is undefined. */
    removeAttributes(key: string | undefined): void {
        if (typeof key !== 'undefined') {
            let allAttribs: Array<Attribute> = this.getAttributes();
            let atrribIndex: number = this._attributeArray.findIndex(el => el.id === key);

            if (atrribIndex !== -1) {
                const value: string | number = this._attributeArray[atrribIndex].value;
                allAttribs.splice(atrribIndex, 1);
                this._attributesRemoved.next([{ id: key, value: value }]);
            }
        } else {
            const copyAttribs: Array<Attribute> = this._attributeArray;
            this._attributeArray = [];

            this._attributesRemoved.next(copyAttribs);
        }
    }

    /** Exports the layer to a GeoJSON object. */
    toGeoJson(callback: (obj: Object) => void): void {
        // TODO: complete this function  ?
    }
}

export interface Attribute {
    id: string,
    value: string | number
}
