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

import { Observable, Subject, BehaviorSubject } from 'rxjs/Rx';
import { DynamicLayerEntryNode } from 'api/schema';

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
    private _nameChanged: Subject<LayerInterface>;

    protected _opacity: number;
    private _opacityChanged: Subject<LayerInterface>;

    protected _visibility: boolean;
    private _visibilityChanged: Subject<LayerInterface>;

    // the viewerLayer is the layerRecord and the layerProxy is the proxy or child proxy if dynamic
    protected _viewerLayer: any;
    protected _layerProxy: any;

    protected _attributesAdded: BehaviorSubject<Array<Attribute>>;
    protected _attributesChanged: Subject<Array<Attribute>>;
    protected _attributesRemoved: Subject<Array<Attribute>>;

    /** Sets the layers viewer map instance. */
    constructor(mapInstance: any) {
        this._mapInstance = mapInstance;

        this._nameChanged = new Subject();
        this._opacityChanged = new Subject();
        this._visibilityChanged = new Subject();

        this._nameChanged.subscribe(layer => this._name = layer.name || '');
        this._opacityChanged.subscribe(layer => this._opacity = layer.opacity);
        this._visibilityChanged.subscribe(layer => this._visibility = layer.visibility);

        this._attributeArray = [];
        this._attributesAdded = new BehaviorSubject(this._attributeArray);
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
                // TODO: need a counter observable while actually downloading the attributes
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
        const oldName: string = this._layerProxy.name;

        // TODO: currently does not work for dynamics since no setter for LayerInterface, so using layerRecord instead.
        // need to decide how to move forward with this  ?
        // Setting the name seems to be more legend based than directly layer based and may possibly need to be moved
        // to a different part of the API as opposed to a layer modification
        // http://fgpv-vpgf.github.io/fgpv-vpgf/api/classes/_index_d_.rv.ui.legendentry.html#settitle (appropriate place it seems)
        this._name = name;
        this._viewerLayer.name = name;

        if (this._layerIndex === undefined) {
            this._viewerLayer.config.name = name;
        }

        if (oldName !== name) {
            this._nameChanged.next(this._layerProxy);
        }
    }

    /**
     * Emits whenever the layer name is changed.
     * @event nameChanged
     */
    get nameChanged(): Observable<LayerInterface> {
        return this._nameChanged.asObservable();
    }

    /** Returns the opacity of the layer on the map from 0 (hidden) to 100 (fully visible) */
    get opacity(): number { return this._opacity; }

    /** Sets the opacity value for the layer. */
    set opacity(opacity: number) {
        const oldOpacity: number = this._layerProxy.opacity;

        this._opacity = opacity;
        this._layerProxy.setOpacity(opacity);

        if (this._layerIndex !== undefined) {
            const childNode = this._viewerLayer.config.layerEntries.find((l: DynamicLayerEntryNode) => l.index === this._layerIndex);
            childNode.state.opacity = opacity;
        } else {
            this._viewerLayer.config.state.opacity = opacity;
        }

        if (oldOpacity !== opacity) {
            this._opacityChanged.next(this._layerProxy);
        }
    }

    /**
     * Emits whenever the layer opacity is changed.
     * @event opacityChanged
     */
    get opacityChanged(): Observable<LayerInterface> {
        return this._opacityChanged.asObservable();
    }

    /** Returns true if the layer is currently visible, false otherwise. */
    get visibility(): boolean { return this._visibility; }

    /** Sets the visibility to visible/invisible. */
    set visibility(visibility: boolean) {
        const oldVisibility: boolean = this._layerProxy.visibility;

        this._visibility = visibility;
        this._layerProxy.setVisibility(visibility);

        if (this._layerIndex !== undefined) {
            const childNode = this._viewerLayer.config.layerEntries.find((l: DynamicLayerEntryNode) => l.index === this._layerIndex);
            childNode.state.visibility = visibility;
        } else {
            this._viewerLayer.config.state.visibility = visibility;
        }

        if (oldVisibility !== visibility) {
            this._visibilityChanged.next(this._layerProxy);
        }
    }

    /**
     * Emits whenever the layer visibility is changed.
     * @event visibilityChanged
     */
    get visibilityChanged(): Observable<LayerInterface> {
        return this._visibilityChanged.asObservable();
    }

    /** Recursively calls callback for every attribute item. */
    forEachAttribute(callback: (attrib: Attribute) => void): void {
        this._attributeArray.forEach(callback);
    }

    /** Removes the attributes with the given key, or all attributes if key is undefined. */
    removeAttributes(key: string | undefined): void {
        if (typeof key !== 'undefined') {
            let allAttribs: Array<Attribute> = this.getAttributes();

            let allKeyAttribs: Array<Attribute> = this.getAttributes(key);
            allKeyAttribs.forEach(attrib => {
                let atrribIndex: number = this._attributeArray.findIndex(el => el.id === key);

                if (atrribIndex !== -1) {
                    const value: string | number = this._attributeArray[atrribIndex].value;
                    allAttribs.splice(atrribIndex, 1);
                }
            });

            this._attributesRemoved.next(allKeyAttribs);
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

interface LayerInterface {
    name: string,
    opacity: number,
    visibility: boolean
}
