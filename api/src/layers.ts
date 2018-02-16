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

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { DynamicLayerEntryNode, InitialLayerSettings } from 'api/schema';
import Map from 'api/Map';

const layerTypes = {
    ESRI_DYNAMIC: 'esriDynamic',
    ESRI_FEATURE: 'esriFeature',
    ESRI_IMAGE: 'esriImage',
    ESRI_TILE: 'esriTile',
    OGC_WMS: 'ogcWms'
}

/**
 * Represents a base layer implementation that will be extended by ConfigLayer and SimpleLayer
 */
export class BaseLayer {
    /** @ignore */
    _mapInstance: any;

    /** @ignore */
    _attributeArray: Array<Object>;

    /** @ignore */
    _id: string;

    // index required when reloading dynamic layers to differentiate between children since id is same for all of them
    /** @ignore */
    _layerIndex: number | undefined;

    // the name of the OID field for the layer
    /** @ignore */
    _primaryAttributeKey: string;

    /** @ignore */
    _name: string;
    private _nameChanged: Subject<string>;

    /** @ignore */
    _opacity: number;
    private _opacityChanged: Subject<number>;

    /** @ignore */
    _visibility: boolean;
    private _visibilityChanged: Subject<boolean>;

    // the viewerLayer is the layerRecord and the layerProxy is the proxy or child proxy if dynamic
    /** @ignore */
    _viewerLayer: any;
    /** @ignore */
    _layerProxy: any;

    protected _attributesAdded: BehaviorSubject<Array<Object>>;
    protected _attributesChanged: Subject<ChangedAttribs>;
    protected _attributesRemoved: Subject<Array<Object>>;

    /** Sets the layers viewer map instance. */
    constructor(mapInstance: any) {
        this._mapInstance = mapInstance;

        this._nameChanged = new Subject();
        this._opacityChanged = new Subject();
        this._visibilityChanged = new Subject();

        this._nameChanged.subscribe(name => this._name = name || '');
        this._opacityChanged.subscribe(opacity => this._opacity = opacity);
        this._visibilityChanged.subscribe(visibility => this._visibility = visibility);

        this._attributeArray = [];
        this._attributesAdded = new BehaviorSubject(this._attributeArray);
        this._attributesChanged = new Subject();
        this._attributesRemoved = new Subject();
    }

    /**
     * Emits whenever one or more attributes are added.
     * @event attributesAdded
     */
    get attributesAdded(): Observable<Array<Object>> {
        return this._attributesAdded.asObservable();
    }

    /**
     * Emits whenever an existing attribute entry is updated.
     * @event attributesChanged
     */
    get attributesChanged(): Observable<ChangedAttribs> {
        return this._attributesChanged.asObservable();
    }

    /**
     * Emits whenever attributes are removed.
     * @event attributesRemoved
     */
    get attributesRemoved(): Observable<Array<Object>> {
        return this._attributesRemoved.asObservable();
    }

    /** Returns attributes by id, or undefined if the id does not exist. */
    getAttributes(attributeKey: number): Object | undefined;

    /** Returns attributes for all ids. If applicable, this will pull attributes from a server, however an empty array will still be
     * returned if no prior attributes existed. Use the `attributes_added` event to determine when pulled attributes are ready. */
    getAttributes(): Array<Object>;

    /** If key provided, returns the requested attributes by id, or undefined if the id does not exist. Else returns all attributes. */
    getAttributes(attributeKey?: number): Object | undefined | Array<Object> {
        let attributes: Array<Object>;

        if (typeof attributeKey !== 'undefined') {
            return this._attributeArray.find(el => (<any>el)[this._primaryAttributeKey] === attributeKey);
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

    /** Forces an attribute download. Function implementation in subclasses. */
    fetchAttributes(): void { }

    /** Sets the attribute object to value provided using the attributeKey. */
    setAttributes(attributeKey: number, value: Object): void;

    /** Sets the field inside attribute to the value provided using the attributeKey. */
    setAttributes(attributeKey: number, fieldName: string, value: string | number): void;

    /** Sets the entire attribute or sets an individual field inside attribute using attributeKey provided. */
    setAttributes(attributeKey: number, valueOrFieldName: Object | string, value?: string | number): void {
        if (typeof valueOrFieldName === 'string') {
            let attribValue: Object | undefined = this._attributeArray.find(attrib =>
                (<any>attrib)[this._primaryAttributeKey] === attributeKey);

            if (typeof attribValue !== 'undefined') {
                const oldValue: Object = Object.assign({}, attribValue);
                (<any>attribValue)[valueOrFieldName] = value;

                this._attributesChanged.next({ attributesBeforeChange: oldValue, attributesAfterChange: attribValue });
            }
        } else {
            let index: number = this._attributeArray.findIndex(attrib =>
                (<any>attrib)[this._primaryAttributeKey] === attributeKey);

            if (index !== -1) {
                const oldValue: Object = Object.assign({}, this._attributeArray[index]);

                Object.keys(this._attributeArray[index]).forEach(key => {
                    (<any>this._attributeArray[index])[key] = (<any>valueOrFieldName)[key];
                });

                this._attributesChanged.next({ attributesBeforeChange: oldValue, attributesAfterChange: this._attributeArray[index] });
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

        if (oldName !== name && this._layerIndex === undefined) {
            this._nameChanged.next(name);
        }
    }

    /**
     * Emits whenever the layer name is changed.
     * @event nameChanged
     */
    get nameChanged(): Observable<string> {
        return this._nameChanged.asObservable();
    }

    /** Returns the opacity of the layer on the map from 0 (hidden) to 100 (fully visible). */
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
            this._opacityChanged.next(opacity);
        }
    }

    /**
     * Emits whenever the layer opacity is changed.
     * @event opacityChanged
     */
    get opacityChanged(): Observable<number> {
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
            this._visibilityChanged.next(visibility);
        }
    }

    /**
     * Emits whenever the layer visibility is changed.
     * @event visibilityChanged
     */
    get visibilityChanged(): Observable<boolean> {
        return this._visibilityChanged.asObservable();
    }

    /** Removes the attributes with the given key, or all attributes if key is undefined. */
    removeAttributes(attributeKey: number | undefined): void {
        if (typeof attributeKey !== 'undefined') {
            let allAttribs: Array<Object> = this.getAttributes();

            let keyAttrib: Object | undefined = this.getAttributes(attributeKey);
            if (keyAttrib !== undefined) {
                let atrribIndex: number = this._attributeArray.findIndex(el => (<any>el)[this._primaryAttributeKey] === attributeKey);
                allAttribs.splice(atrribIndex, 1);

                this._attributesRemoved.next([ keyAttrib ]);
            }
        } else {
            const copyAttribs: Array<Object> = this._attributeArray;
            this._attributeArray = [];

            this._attributesRemoved.next(copyAttribs);
        }
    }

    /** Exports the layer to a GeoJSON object. */
    toGeoJson(callback: (obj: Object) => void): void {
        // TODO: complete this function
    }
}

/**
 * A config layer instance is created automatically for every layer in the viewers configuration. You can also create them outside the config.
 *
 * Note that `ConfigLayer` instances cannot control geometry.
 *
 * @example Listen for layer attributes to be downloaded <br><br>
 *
 * ```js
 * myConfigLayer.attributesAdded.subscribe(function (attribs) {
 *  if (attribs) {
 *      console.log('Got our attributes');
 *      console.log(attribs);
 *      // attributes loaded, do stuff here
 *  }
 * });
 *
 * myConfigLayer.fetchAttributes();  // an asynchronous attribute download. will resolve and display in the console 'Got our attributes' followed by the attributes
 * ```
 */
export class ConfigLayer extends BaseLayer {
    /** @ignore */
    _catalogueUrl: string;
    /** @ignore */
    _layerType: string;

    /**
     * Requires a schema valid JSON config layer snippet, map instance where the layer is added and viewer layer record.
     * If it is a dynamic layer, then the layer index must also be provided and used to get the proxy.
     */
    constructor(config: JSONConfig, mapInstance: any, layerRecord: any, layerIndex?: number) {
        super(mapInstance);

        this._layerType = config.layerType;

        if (this._layerType === layerTypes.ESRI_DYNAMIC) {
            this._layerIndex = layerIndex;
            this._layerProxy = layerRecord.getChildProxy(layerIndex);
        } else {
            this._layerProxy = layerRecord.getProxy();
        }

        this._viewerLayer = layerRecord;
        this._id = config.id;
        this._name = config.name;
        this._catalogueUrl = config.catalogueUrl || '';

        this._opacity = this._layerProxy.opacity;
        this._visibility = this._layerProxy.visibility;
        this._primaryAttributeKey = this._layerProxy.oidField;
    }

    /** The viewer downloads attributes when needed - call this function to force an attribute download if not downloaded previously.
     * The `attributes_added` event will trigger when the download is complete (if a download was forced). */
    fetchAttributes(): void {
        const attribs = this._layerProxy.attribs;

        if (attribs) {
            attribs.then((attrib: AttribObject) => {
                // the attributes were previously downloaded, do not reupdate the array and do not trigger `attributes_added`
                if (this._attributeArray.length > 0) {
                    return;
                }

                // attributes not previously downloaded, after forcing the download, populates the array and triggers event
                Object.keys(attrib.oidIndex).forEach(id => {
                    const index: number = (<any>attrib.oidIndex)[id];
                    const attribs = attrib.features[index].attributes;

                    this._attributeArray.push(attribs);
                });

                this._attributesAdded.next(this._attributeArray);
            }).catch((e: string) => {
                console.error(e);
                this._attributeArray = [];
                this._attributesAdded.next(this._attributeArray);   // errored out, do we want to broadcast a different event  ?
                return;
            });
        } else {
            this._attributeArray = [];
            this._attributesAdded.next(this._attributeArray);   // no attribs, do we want to broadcast a different event  ?
        }
    }

    /** Returns the catalogue URL. */
    get catalogueUrl(): string { return this._catalogueUrl; }

    /** Returns the underlying layer type such as esriFeature, esriDynamic, and ogcWms. */
    get type(): string { return this._layerType; }

    /** Returns the name of the key being used for the attributes OID field. */
    get attributeKey(): string { return this._primaryAttributeKey; }

    /** Pans to the layers bounding box. */
    panToBoundary(): void {
        this._layerProxy.zoomToBoundary(this._mapInstance.instance);
    }

    // /**
    //  * Layer conditions limit the information from a layer that gets displayed on the map and populated as data.
    //  *
    //  * Layer conditions can not be set for file layers
    //  *
    //  * @example
    //  *
    //  * ```js
    //  * var layerDefs = "OBJECTID <= 100 and STATE_NAME='Kansas'";
    //  * mapServiceLayer.setLayerConditions(layerDefs);
    //  * ```
    //  */
    // setLayerConditions(layerDefinition: string): void {
    //     // TODO: need to see how to apply values in table correctly  ?
    //     if (!this._viewerLayer.isFileLayer() && this._viewerLayer.config.table) {
    //         if (this._layerType === layerTypes.ESRI_DYNAMIC) {
    //             this._layerProxy.setDefinitionQuery(layerDefinition);

    //             const childNode = this._viewerLayer.config.layerEntries.find((l: DynamicLayerEntryNode) => l.index === this._layerIndex);

    //             childNode.initialFilteredQuery = layerDefinition;
    //             childNode.filter = childNode.table.applied = (layerDefinition !== '');
    //         } else if (this._layerType === layerTypes.ESRI_FEATURE) {
    //             this._layerProxy.setDefinitionQuery(layerDefinition);

    //             this._viewerLayer.config.initialFilteredQuery = layerDefinition;
    //             this._viewerLayer.config.filter = this._viewerLayer.config.table.applied = (layerDefinition !== '');
    //         }
    //     }
    // }

    /** If layer out of scale, zooms in / out to a scale level where the layer is visible. */
    zoomToScale(): void {
        const mapScale = this._mapInstance.instance.getScale();
        const isOffScale = this._layerProxy.isOffScale(mapScale);

        if (isOffScale.offScale) {
            const mapInstance = this._mapInstance.instance;
            const lods = this._mapInstance.selectedBasemap.lods;
            const zoomIn = isOffScale.zoomIn;

            this._layerProxy.zoomToScale(mapInstance, lods, zoomIn);
        }
    }
}

/**
 * #### Under Consideration
 * - To expose the events `geometry_added`, `geometry_removed`. These could only fire for `SimpleLayer` instances in this group.
 *
 * A layer group created for every map instance consisting of all layers on that map. Layers can be added through the viewers configuration,
 * import options and also externally.
 *
 * @example Create a ConfigLayer for some map instance <br><br>
 *
 * ```js
 * const layerJson = {
 *   "id": "myLayer1",
 *   "name": "An Incredible Layer",
 *   "layerType": "esriFeature",
 *   "controls": [
 *     "remove"
 *   ],
 *   "state": {
 *     "visibility": false,
 *     "boundingBox": false
 *   },
 *   "url": "http://example.com/MapServer/URL"
 * };
 *
 * const myConfigLayer = RZ.mapById('<mapID>').layers.addLayer(layerJSON);
 * ```
 */
export class LayerGroup {
    /** @ignore */
    _mapI: Map
    /** @ignore */
     _layersArray: Array<BaseLayer> = [];

    private _layerAdded: Subject<BaseLayer>;
    private _layerRemoved: Subject<BaseLayer>

    private _attributesAdded: Subject<LayerAndAttribs>; // Subject vs BehaviourSubject  ? How to initalize BehaviourSubject if that is the best option
    private _attributesChanged: Subject<LayerAndChangedAttribs>;
    private _attributesRemoved: Subject<LayerAndAttribs>;

    private _click: Subject<BaseLayer>;

    /** Sets the layer groups api map instance. */
    constructor(mapInstance: Map) {
        this._mapI = mapInstance;

        this._layerAdded = new Subject();
        this._layerRemoved = new Subject();

        this._attributesAdded = new Subject();
        this._attributesChanged = new Subject();
        this._attributesRemoved = new Subject();

        this._click = new Subject();
    }

    /** Returns all layers in the group. */
    get allLayers(): Array<BaseLayer> {
        return this._layersArray;
    }

    /**
     * Emits whenever a layer is added to the group.
     * @event layerAdded
     */
    get layerAdded(): Observable<BaseLayer> {
        return this._layerAdded.asObservable();
    }

    /**
     * Emits whenever a layer is removed from the group.
     * @event layerRemoved
     */
    get layerRemoved(): Observable<BaseLayer> {
        return this._layerRemoved.asObservable();
    }

    /**
     * Emits whenever one or more attributes are added for a layer in the group.
     * @event attributesAdded
     */
    get attributesAdded(): Observable<LayerAndAttribs> {
        return this._attributesAdded.asObservable();
    }

    /**
     * Emits whenever an existing attribute entry is updated for a layer in the group.
     * @event attributesChanged
     */
    get attributesChanged(): Observable<LayerAndChangedAttribs> {
        return this._attributesChanged.asObservable();
    }

    /**
     * Emits whenever attributes are removed for a layer in the group.
     * @event attributesRemoved
     */
    get attributesRemoved(): Observable<LayerAndAttribs> {
        return this._attributesRemoved.asObservable();
    }

    /**
     * Emits whenever a layer is clicked on the legend.
     * @event click
     */
    get click(): Observable<BaseLayer> {
        return this._click.asObservable();
    }

    // /** Adds the provided layer instance to the group, and returns the instance. */
    // addLayer(layer: BaseLayer): BaseLayer;

    // /** Providing a layer json snippet returns a `ConfigLayer`.*/
    // addLayer(layerJSON: JSON): ConfigLayer;

    // /** Providing a string layer name will instantiate and return an empty `SimpleLayer` */
    // addLayer(layerName: string): SimpleLayer;

    // /** Adds GeoJSON layers to the group. Give this method a parsed JSON. The imported layers are returned. Throws an exception if the GeoJSON could not be imported. */
    // addLayer(geoJson: Object): Array<SimpleLayer>;

    // /** Loads GeoJSON from a URL, and adds the layers to the group. Invokes callback function once async layer loading is complete. */
    // addLayer(url: string, callback?: (layers: Array<SimpleLayer>) => void): void;

    /** Providing a layer json snippet creates a `ConfigLayer`.*/
    addLayer(layerJSON: JSON): void {       // change return type after if we want to return something  ?
        this._mapI.mapI.addConfigLayer(layerJSON);
    }

    /** Removes a layer from the group. */
    removeLayer(layer: BaseLayer): void;

    /** Removes the layer with the provided id from the group. */
    removeLayer(id: string | number): void;

    /** Removes the layer from the group using the provided layer itself, or by id. */
    removeLayer(layerOrId: BaseLayer | string | number): void {
        if (isLayerObject(layerOrId)) {
            if (layerOrId.layerIndex !== undefined) {
                this._mapI.mapI.removeApiLayer(layerOrId.id, layerOrId.layerIndex.toString());
            } else {
                this._mapI.mapI.removeApiLayer(layerOrId.id);
            }
        } else {
            // if id provided is for dynamic layer, this will remove all the children as well
            // currently no way to remove an individual child through an id, may need the use of an optional second parameter
            // similar to how it is done a few lines above
            // TODO: decide how to move forward with this
            this._mapI.mapI.removeApiLayer(layerOrId.toString());
        }
    }

    /** Checks whether the given layer is in the group. */
    contains(layer: BaseLayer): boolean;

    /** Checks whether the given layer by id is in the group. */
    contains(id: string | number): boolean;

    /** Checks whether the given layer is in the group using the provided layer itself, or by id. */
    contains(layerOrId: BaseLayer | string | number): boolean {
        if (isLayerObject(layerOrId)) {
            return this._layersArray.find(layer => layer === layerOrId) !== undefined;
        } else {
            return this._layersArray.find(layer => layer.id === layerOrId.toString()) !== undefined;
        }
    }

    /** Returns any layers with the given ID, if they exist in the group. Otherwise returns empty array.
     *
     * Note: IDs 1234 and '1234' are equivalent. Either can be used to look up layers.
     *
     * Note: For dynamic layers, all of its children have the same id.
     */
    getLayersById(id: number | string): Array<BaseLayer> {
        return this._layersArray.filter(layer => layer.id === id.toString());
    }

    /** Returns all layers of a given type.
     *
     * @example <br><br>
     *
     * ```js
     * const listOfConfigLayers = mapInstance.layers.getLayersByType(RZ.LAYERS.ConfigLayer);
     * ```
     */
    getLayersByType(type: ConfigLayer): Array<BaseLayer> {   // add SimpleLayer as option for parameter type after  ?
        return this._layersArray.filter(layer => layer instanceof (<any>type));
    }

    /** Exports the layers in the group to a GeoJSON object. */
    toGeoJson(callback: (obj: Object) => void): void {
        // TODO: complete this function
    }
}

function isLayerObject(layerOrId: BaseLayer | string | number): layerOrId is BaseLayer {
    return layerOrId instanceof BaseLayer;
}

interface LayerInterface {
    name: string,
    opacity: number,
    visibility: boolean
}

interface JSONConfig {
    id: string;
    name: string;
    catalogueUrl?: string;
    layerType: string;
}

interface AttribObject {
    features: Array<FeaturesArray>,
    oidIndex: Object
}

interface FeaturesArray {
    attributes: Object
}

interface LayerAndAttribs extends FeaturesArray {
    layer: BaseLayer,
}

interface ChangedAttribs {
    attributesBeforeChange: Object,
    attributesAfterChange: Object
}

interface LayerAndChangedAttribs extends ChangedAttribs {
    layer: BaseLayer
}
