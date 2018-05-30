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


import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { DynamicLayerEntryNode, InitialLayerSettings } from 'api/schema';
import { BaseGeometry } from 'api/geometry';
import Map from 'api/map';
import { RV } from './index';

const layerTypes = {
    ESRI_GRAPHICS: 'esriGraphics',
    ESRI_DYNAMIC: 'esriDynamic',
    ESRI_FEATURE: 'esriFeature',
    ESRI_IMAGE: 'esriImage',
    ESRI_TILE: 'esriTile',
    OGC_WMS: 'ogcWms'
};

/**
 * All layer types must derive from this class. Not intented to be instantiated on its own.
 *
 * TODO: Observe features / geometry clicks, mouseover, and mouseout events
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
    _nameChanged: Subject<string>;

    /** @ignore */
    _opacity: number;
    _opacityChanged: Subject<number>;

    /** @ignore */
    _visibility: boolean;
    _visibilityChanged: Subject<boolean>;

    /** @ignore */
    _queryable: boolean;
    _queryableChanged: Subject<boolean>;

    /** @ignore */
    _identifyBuffer: number | undefined;
    /** @ignore */
    _bufferChanged: Subject<number | undefined>;

    // the viewerLayer is the layerRecord and the layerProxy is the proxy or child proxy if dynamic
    /** @ignore */
    _viewerLayer: any;
    /** @ignore */
    _layerProxy: any;

    _attributesAdded: BehaviorSubject<Array<Object>>;
    _attributesChanged: Subject<ChangedAttribs>;
    _attributesRemoved: Subject<Array<Object>>;

    /** Sets the layers viewer map instance. */
    constructor(mapInstance: any) {
        this._mapInstance = mapInstance;

        this._nameChanged = new Subject();
        this._opacityChanged = new Subject();
        this._visibilityChanged = new Subject();
        this._queryableChanged = new Subject();
        this._bufferChanged = new Subject();

        this._nameChanged.subscribe(name => (this._name = name || ''));
        this._opacityChanged.subscribe(opacity => (this._opacity = opacity));
        this._visibilityChanged.subscribe(visibility => (this._visibility = visibility));
        this._queryableChanged.subscribe(queryable => (this._queryable = queryable));

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

    /** If key provided, returns the requested attributes by id, or undefined if the id does not exist. Else returns all attributes.
     *
     * TODO: add a counter observable when downloading the attributes.
     */
    getAttributes(attributeKey?: number): Object | undefined | Array<Object> {
        let attributes: Array<Object>;

        if (typeof attributeKey !== 'undefined') {
            return this._attributeArray.find(el => (<any>el)[this._primaryAttributeKey] === attributeKey);
        } else {
            if (this._attributeArray.length === 0) {
                this.fetchAttributes();
                return [];
            } else {
                return this._attributeArray;
            }
        }
    }

    /** Forces an attribute download. Function implementation in subclasses. */
    fetchAttributes(): void {}

    /** Sets the attribute object to value provided using the attributeKey. */
    setAttributes(attributeKey: number, value: Object): void;

    /** Sets the field inside attribute to the value provided using the attributeKey. */
    setAttributes(attributeKey: number, fieldName: string, value: string | number): void;

    /** Sets the entire attribute or sets an individual field inside attribute using attributeKey provided. */
    setAttributes(attributeKey: number, valueOrFieldName: Object | string, value?: string | number): void {
        if (typeof valueOrFieldName === 'string') {
            let attribValue: Object | undefined = this._attributeArray.find(
                attrib => (<any>attrib)[this._primaryAttributeKey] === attributeKey
            );

            if (typeof attribValue !== 'undefined') {
                const oldValue: Object = Object.assign({}, attribValue);
                (<any>attribValue)[valueOrFieldName] = value;

                this._attributesChanged.next({ attributesBeforeChange: oldValue, attributesAfterChange: attribValue });
            }
        } else {
            let index: number = this._attributeArray.findIndex(
                attrib => (<any>attrib)[this._primaryAttributeKey] === attributeKey
            );

            if (index !== -1) {
                const oldValue: Object = Object.assign({}, this._attributeArray[index]);

                Object.keys(this._attributeArray[index]).forEach(key => {
                    (<any>this._attributeArray[index])[key] = (<any>valueOrFieldName)[key];
                });

                this._attributesChanged.next({
                    attributesBeforeChange: oldValue,
                    attributesAfterChange: this._attributeArray[index]
                });
            }
        }
    }

    /** Returns the layer ID. */
    get id(): string {
        return this._id;
    }

    /** Returns the custom identify buffer size. Buffer size is the distance in screen pixels from the specified geometry within which identify is performed. */
    get identifyBuffer(): number | undefined {
        return this._identifyBuffer;
    }

    /**
     * Sets the buffer size of the layer to be used when identifying.
     *
     * NOTE: To use the default buffer size, set as undefined.
     * NOTE: For dynamics, the buffer size must be the same for all of the children. If one buffer value are updated, all children updated automatically.
    */
    set identifyBuffer(tolerance: number | undefined) {
        const oldBuffer: number | undefined = this._identifyBuffer;

        // if the tolerance value is defined and is less than 1, set it to 1 (smallest possible value)
        const toleranceToSet: number | undefined = tolerance && tolerance < 1 ? 1 : tolerance;

        // if dynamic layer, value is spread to other children in layer-registry.service, _createApiLayer()
        this._identifyBuffer = toleranceToSet;

        if (oldBuffer !== toleranceToSet) {
            this._bufferChanged.next(toleranceToSet);
        }
    }

    /**
     * Emits whenever the layer buffer value is changed.
     * @event bufferChanged
     */
    get bufferChanged(): Observable<number | undefined> {
        return this._bufferChanged.asObservable();
    }

    /** Returns the layer index. */
    get layerIndex(): number | undefined {
        return this._layerIndex;
    }

    /** Returns the name of the layer. */
    get name(): string {
        return this._name;
    }

    /** Sets the name of the layer. This updates the name throughout the viewer.
     *
     * TODO: allow setting of name for dynamic layers / children.
     */
    set name(name: string) {
        const oldName: string = this._layerProxy.name;

        // no setter for LayerInterface, so using layerRecord instead
        // need to decide how to move forward with this  ?
        // Setting the name seems to be more legend based than directly layer based and may possibly need to be moved
        // to a different part of the API as opposed to a layer modification
        // http://fgpv-vpgf.github.io/fgpv-vpgf/api/classes/_index_d_.rv.ui.legendentry.html#settitle (appropriate place it seems)
        this._name = name;
        this._viewerLayer.name = name;

        if (this._viewerLayer.config) {
            if (this._layerIndex === undefined) {
                this._viewerLayer.config.name = name;
            }
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
    get opacity(): number {
        return this._opacity;
    }

    /** Sets the opacity value for the layer. */
    set opacity(opacity: number) {
        const oldOpacity: number = this._layerProxy.opacity;

        this._opacity = opacity;
        this._layerProxy.setOpacity(opacity);

        if (this._viewerLayer.config) {
            if (this._layerIndex !== undefined) {
                const childNode = this._viewerLayer.config.layerEntries.find(
                    (l: DynamicLayerEntryNode) => l.index === this._layerIndex
                );
                childNode.state.opacity = opacity;
            } else {
                this._viewerLayer.config.state.opacity = opacity;
            }
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
    get visibility(): boolean {
        return this._visibility;
    }

    /** Sets the visibility to visible/invisible. */
    set visibility(visibility: boolean) {
        const oldVisibility: boolean = this._layerProxy.visibility;

        this._visibility = visibility;
        this._layerProxy.setVisibility(visibility);

        if (this._viewerLayer.config) {
            if (this._layerIndex !== undefined) {
                const childNode = this._viewerLayer.config.layerEntries.find(
                    (l: DynamicLayerEntryNode) => l.index === this._layerIndex
                );
                childNode.state.visibility = visibility;
            } else {
                this._viewerLayer.config.state.visibility = visibility;
            }
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

    /** Returns true if the layer is currently queryable, false otherwise. */
    get queryable(): boolean {
        return this._queryable;
    }

    /** Sets the queryable value to on/off. */
    set queryable(queryable: boolean) {
        const oldQueryable: boolean = this._layerProxy.query;

        this._queryable = queryable;
        this._layerProxy.setQuery(queryable);

        if (this._viewerLayer.config) {
            if (this._layerIndex !== undefined) {
                const childNode = this._viewerLayer.config.layerEntries.find(
                    (l: DynamicLayerEntryNode) => l.index === this._layerIndex
                );
                childNode.state.query = queryable;
            } else {
                this._viewerLayer.config.state.query = queryable;
            }
        }

        if (oldQueryable !== queryable) {
            this._queryableChanged.next(queryable);
        }
    }

    /**
     * Emits whenever the layer queryable value is changed.
     * @event queryableChanged
     */
    get queryableChanged(): Observable<boolean> {
        return this._queryableChanged.asObservable();
    }

    /** Removes the attributes with the given key, or all attributes if key is undefined. */
    removeAttributes(attributeKey?: number): void {
        if (typeof attributeKey !== 'undefined') {
            let allAttribs: Array<Object> = this.getAttributes();

            let index: number = this._attributeArray.findIndex(
                attrib => (<any>attrib)[this._primaryAttributeKey] === attributeKey
            );

            if (index !== -1) {
                const oldValue: Object = Object.assign({}, this._attributeArray[index]);

                Object.keys(this._attributeArray[index]).forEach(key => {
                    (<any>this._attributeArray[index])[key] = undefined;
                });

                allAttribs.splice(index, 1);

                this._attributesRemoved.next([oldValue]);
            }
        } else {
            const copyAttribs: Array<Object> = this._attributeArray.map(a => Object.assign({}, a));

            this._attributeArray.forEach(attrib => {
                Object.keys(attrib).forEach(key => {
                    (<any>attrib)[key] = undefined;
                });
            });

            this._attributeArray = [];

            this._attributesRemoved.next(copyAttribs);
        }
    }

    // /** Exports the layer to a GeoJSON object.
    //  *
    //  * TODO: complete this function.
    //  */
    // toGeoJson(callback: (obj: Object) => void): void {
    // }
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
     * Requires a map instance where the layer is added and viewer layer record.
     * If it is a dynamic layer, then the layer index must also be provided and used to get the proxy.
     */
    constructor(mapInstance: any, layerRecord: any, layerIndex?: number) {
        super(mapInstance);

        this._initLayerSettings(layerRecord, layerIndex);
    }

    /** The viewer downloads attributes when needed - call this function to force an attribute download if not downloaded previously.
     * The `attributes_added` event will trigger when the download is complete (if a download was forced). */
    fetchAttributes(): void {
        const attribs = this._layerProxy.attribs;

        if (attribs) {
            attribs
                .then((attrib: AttribObject) => {
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
                })
                .catch((e: string) => {
                    console.error(e);
                    this._attributeArray = [];
                    this._attributesAdded.next(this._attributeArray); // errored out, do we want to broadcast a different event  ?
                    return;
                });
        } else {
            this._attributeArray = [];
            this._attributesAdded.next(this._attributeArray); // no attribs, do we want to broadcast a different event  ?
        }
    }

    /** Returns the catalogue URL. */
    get catalogueUrl(): string {
        return this._catalogueUrl;
    }

    /** Returns the underlying layer type such as esriFeature, esriDynamic, and ogcWms. */
    get type(): string {
        return this._layerType;
    }

    /** Returns the name of the key being used for the attributes OID field. */
    get attributeKey(): string {
        return this._primaryAttributeKey;
    }

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

    /** Set the appropriate layer properties such as id, visibility and opacity. Called whenever layer is created or reloaded. */
    _initLayerSettings(layerRecord: any, layerIndex?: number): void {
        this.removeAttributes();

        this._layerType = layerRecord.config.layerType;

        if (this._layerType === layerTypes.ESRI_DYNAMIC) {
            this._layerIndex = layerIndex;
            this._layerProxy = layerRecord.getChildProxy(layerIndex);
        } else {
            this._layerProxy = layerRecord.getProxy();
        }

        this._viewerLayer = layerRecord;
        this._id = layerRecord.config.id;
        this._name = layerRecord.config.name;
        this._catalogueUrl = layerRecord.config.catalogueUrl || '';

        this._opacity = this._layerProxy.opacity;
        this._visibility = this._layerProxy.visibility;
        this._queryable = this._layerProxy.query;
        this._primaryAttributeKey = this._layerProxy.oidField;
    }
}

/**
 * A simple layer is one created programmatically via the API - without the use of a config construct.
 *
 * @example #### Draw a point for a SimpleLayer<br><br>
 *
 * ```js
 * const pointGeo = new RZ.GEO.Point('myPoint', 'www.someImage.com/abc.svg', [81, 79 ]);
 * mySimpleLayer.addGeometry(pointGeo);
 * ```
 */
export class SimpleLayer extends BaseLayer {
    /** @ignore */
    _geometryArray: Array<BaseGeometry>;

    _geometryAdded: Subject<Array<BaseGeometry>>;
    _geometryRemoved: Subject<Array<BaseGeometry>>;

    /** Sets the initial layer settings. The id is equivalent to the name. */
    constructor(layerRecord: any, mapInstance: any) {
        super(mapInstance);

        this._viewerLayer = layerRecord;
        this._layerProxy = layerRecord.getProxy();

        this._name = layerRecord.name;
        this._id = layerRecord.name;

        this._opacity = this._layerProxy.opacity;
        this._visibility = this._layerProxy.visibility;

        this._geometryArray = [];
        this._geometryAdded = new Subject();
        this._geometryRemoved = new Subject();

        this._geometryAdded.subscribe(geoArray => {
            geoArray.forEach(geometry => {
                geometry._hoverRemoved.subscribe(geoId => {
                    this._mapInstance.instance.removeHover(geoId);
                });
            });
        });

        this._visibilityChanged.subscribe(visibility => {
            if (!visibility) {
                this._mapInstance.instance.hoverRemoveOnToggle(this._id);
            }
        });
    }

    /** Returns the name of the layer. */
    get name(): string {
        return this._name;
    }

    /** Sets the name of the layer. Will also update the id to reflect this change, since the id is equivalent to the name. */
    set name(name: string) {
        const oldName: string = this._name;

        this._name = name;
        this._id = name;

        this._viewerLayer.name = name;

        if (oldName !== name) {
            this._nameChanged.next(name);
        }
    }

    /** Returns the value of the requested data, or an empty array if the data does not exist. */
    get geometry(): Array<BaseGeometry> {
        return this._geometryArray;
    }

    /**
     * Emits whenever geometry is added to the layer.
     * @event geometryAdded
     */
    get geometryAdded(): Observable<Array<BaseGeometry>> {
        return this._geometryAdded.asObservable();
    }

    /**
     * Emits whenever geometry is removed from the layer.
     * @event geometryRemoved
     */
    get geometryRemoved(): Observable<Array<BaseGeometry>> {
        return this._geometryRemoved.asObservable();
    }

    /** Adds the geometry to the layer. */
    addGeometry(geo: BaseGeometry | Array<BaseGeometry>): void {
        let geometries: Array<BaseGeometry>;
        if (geo instanceof Array) {
            geometries = geo;
        } else {
            geometries = [geo];
        }

        const geometriesAdded: Array<BaseGeometry> = [];

        geometries.forEach(geometry => {
            const index = this._geometryArray.findIndex(geo => geo.id === geometry.id);

            if (index === -1) {
                const spatialReference = this._mapInstance.instance.spatialReference;
                this._viewerLayer.addGeometry(geometry, spatialReference);
                this._geometryArray.push(geometry);
                geometriesAdded.push(geometry);
            } else {
                console.error('Attempting to add geometry with an id that has already been added.')
            }
        });

        if (geometriesAdded.length > 0) {
            this._geometryAdded.next(geometriesAdded);
        }
    }

    /**
     * If geometry specified, removes those items. Else removes all geometry.
     *
     * @param geometry any strings should reference a particular geometry instance with that ID. If undefined, all geometry is removed.
     */
    removeGeometry(ids?: Array<string> | string): void {
        if (typeof ids !== 'undefined') {
            if (typeof ids === 'string') {
                const index: number = this._geometryArray.findIndex(geo => geo.id === ids);

                if (index !== -1) {
                    const oldValue: BaseGeometry = this._geometryArray[index];

                    if (oldValue.hover) {
                        oldValue._hoverRemoved.next(oldValue._id);
                    }

                    // TODO: change this to remove geometry based on apiId instead of index since that was added to the graphic in geoApi
                    this._viewerLayer.removeGeometry(index);
                    this._geometryArray.splice(index, 1);
                    this._geometryRemoved.next([oldValue]);
                }
            } else {
                const geometriesRemoved: Array<BaseGeometry> = [];
                ids.forEach(id => {
                    const index: number = this._geometryArray.findIndex(geo => geo.id === id);

                    if (index !== -1) {
                        const oldValue: BaseGeometry = this._geometryArray[index];

                        if (oldValue.hover) {
                            oldValue._hoverRemoved.next(oldValue._id);
                        }

                        // TODO: change this to remove geometry based on apiId instead of index since that was added to the graphic in geoApi
                        this._viewerLayer.removeGeometry(index);
                        this._geometryArray.splice(index, 1);
                        geometriesRemoved.push(oldValue);
                    }
                });

                if (geometriesRemoved.length > 0) {
                    this._geometryRemoved.next(geometriesRemoved);
                }
            }
        } else {
            const copyGeometry: Array<BaseGeometry> = this._geometryArray;

            this._geometryArray.forEach(geo => {
                if (geo.hover) {
                    geo._hoverRemoved.next(geo._id);
                }

                // always remove first index because when we remove it from esri layer instance, it removes from array as well
                // so updated index will always be 0, and since we're removing all geometry, we can keep removing from start of array
                // TODO: change this to remove geometry based on apiId instead of index since that was added to the graphic in geoApi
                this._viewerLayer.removeGeometry(0);
            });
            this._geometryArray = [];
            this._geometryRemoved.next(copyGeometry);
        }
    }

    /** Returns the extent of an array of graphics. */
    getGraphicsBoundingBox(graphics: Array<Object>) {
        return this._viewerLayer.getGraphicsBoundingBox(graphics);
    };
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
    _mapI: Map;
    /** @ignore */
    _layersArray: Array<BaseLayer> = [];
    /** @ignore */
    _identifyMode: IdentifyMode = IdentifyMode.Details;

    _layerAdded: Subject<BaseLayer>;
    _layerRemoved: Subject<BaseLayer>;

    _attributesAdded: Subject<LayerAndAttribs>;
    _attributesChanged: Subject<LayerAndChangedAttribs>;
    _attributesRemoved: Subject<LayerAndAttribs>;

    _click: Subject<BaseLayer>;

    /** @ignore */
    _identify: Subject<any>;

    /** Sets the layer groups api map instance. */
    constructor(mapInstance: Map) {
        this._mapI = mapInstance;

        this._layerAdded = new Subject();
        this._layerRemoved = new Subject();

        this._attributesAdded = new Subject();
        this._attributesChanged = new Subject();
        this._attributesRemoved = new Subject();

        this._click = new Subject();
        this._identify = new Subject<any>();
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

    /**
     * Emits when a new identify session as soon as the identify is triggered.
     * The emitted event contains an array of IdentifyRequest objects, one for each layer in this layer group.
     *
     * @readonly
     * @type {Observable<IdentifySession>}
     * @event identify
     * @memberof LayerGroup
     */
    get identify(): Observable<IdentifySession> {
        return this._identify.asObservable();
    }

    /**
     * Specifies if the identify panel should be shown after the identify query completes.
     */
    set identifyMode(value: IdentifyMode) {
        this._identifyMode = value;
    }

    get identifyMode(): IdentifyMode {
        return this._identifyMode;
    }

    /** Providing a layer json snippet will instantiate and return a promise resolving to an array containing the `ConfigLayer(s)` created.*/
    addLayer(layerJSON: JSON): Promise<Array<ConfigLayer>>;

    /** Providing a string layer name will instantiate and return a promise resolving to an array containg the `SimpleLayer` created */
    addLayer(layerName: string): Promise<Array<SimpleLayer>>;

    // /**
    //  * Adds GeoJSON layers to the group. Give this method a parsed JSON. The imported layers are returned.
    //  * Throws an exception if the GeoJSON could not be imported.
    //  *
    //  * TODO: complete this function.
    //  */
    // addLayer(geoJson: Object): Array<SimpleLayer>;

    // /**
    //  * Loads GeoJSON from a URL, and adds the layers to the group.
    //  * Invokes callback function once async layer loading is complete.
    //  *
    //  * TODO: complete this function.
    //  */
    // addLayer(url: string, callback?: (layers: Array<SimpleLayer>) => void): void;

    /** Creates a `ConfigLayer` using a json snippet. Else creates a 'SimpleLayer' using the string. */
    addLayer(layerJSONOrName: JSON | string): Promise<Array<SimpleLayer | ConfigLayer>> {
        let promiseArray: Promise<Array<SimpleLayer | ConfigLayer>>;

        if (typeof layerJSONOrName === 'string') {
            promiseArray = this._mapI.mapI.addSimpleLayer(layerJSONOrName);
        } else {
            promiseArray = this._mapI.mapI.addConfigLayer(layerJSONOrName);
        }
        return promiseArray;
    }

    /** Removes a layer from the group. */
    removeLayer(layer: BaseLayer): void;

    /** Removes the layer with the provided id from the group. */
    removeLayer(id: string | number): void;

    /** Removes the layer from the group using the provided layer itself, or by id.
     *
     * TODO: decide how to move forward with removing dynamic children using id.
     */
    removeLayer(layerOrId: BaseLayer | string | number): void {
        if (isLayerObject(layerOrId)) {
            if (isSimpleLayer(layerOrId)) {
                layerOrId.removeGeometry();
                this._mapI.mapI.removeSimpleLayer(layerOrId._viewerLayer);
            } else if (layerOrId.layerIndex !== undefined) {
                this._mapI.mapI.removeApiLayer(layerOrId.id, layerOrId.layerIndex.toString());
            } else {
                this._mapI.mapI.removeApiLayer(layerOrId.id);
            }
        } else {
            const layer = this.getLayersById(layerOrId.toString())[0];
            if (isSimpleLayer(layer)) {
                layer.removeGeometry();
                this._mapI.mapI.removeSimpleLayer(layer._viewerLayer);
            } else {
                // if id provided is for dynamic layer, this will remove all the children as well
                // currently no way to remove an individual child through an id, may need the use of an optional second parameter
                // similar to how it is done a few lines above
                this._mapI.mapI.removeApiLayer(layerOrId.toString());
            }
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
    getLayersByType(type: ConfigLayer | SimpleLayer): Array<BaseLayer> {
        return this._layersArray.filter(layer => layer instanceof <any>type);
    }

    /** Sets the buffer size of all layers to be used when identifying. */
    setAllBuffers(tolerance: number | undefined): void {
        this._layersArray.forEach(layer => layer.identifyBuffer = tolerance);
    }

    // /** Exports the layers in the group to a GeoJSON object.
    //  *
    //  * TODO: complete this function.
    //  */
    // toGeoJson(callback: (obj: Object) => void): void {
    // }
}

function isLayerObject(layerOrId: BaseLayer | string | number): layerOrId is BaseLayer {
    return layerOrId instanceof BaseLayer;
}

function isSimpleLayer(layerOrId: BaseLayer | undefined): layerOrId is SimpleLayer {
    return layerOrId instanceof SimpleLayer;
}

interface LayerInterface {
    name: string;
    opacity: number;
    visibility: boolean;
}

interface JSONConfig {
    id: string;
    name: string;
    catalogueUrl?: string;
    layerType: string;
}

interface AttribObject {
    features: Array<FeaturesArray>;
    oidIndex: Object;
}

interface FeaturesArray {
    attributes: Object;
}

interface LayerAndAttribs extends FeaturesArray {
    layer: BaseLayer;
}

interface ChangedAttribs {
    attributesBeforeChange: Object;
    attributesAfterChange: Object;
}

interface LayerAndChangedAttribs extends ChangedAttribs {
    layer: BaseLayer;
}

export interface DataItem {
    name: string;
    value: string | number;
}

export interface IdentifyResult {
    data: DataItem[];
    name: string;
    oid: string;
    symbology: { svgcode: string }[];
}

export interface IdentifyRequest {
    sessionId: number;
    event: MouseEvent;
    layer: ConfigLayer;
    features: Promise<IdentifyResult[]>;
}

export interface IdentifySession {
    sessionId: number;
    event: MouseEvent;
    requests: IdentifyRequest[];
}

export enum IdentifyMode {
    /**
     * Display the identify results in the details panel and highlight them on the map.
     */
    Details = 'details',

    /**
     * Only highlight the identify results on the map.
     */
    Highlight = 'highlight',

    /**
     * The identify query will be run and results will be available through the `identify` API endpoint, but they will not be highlighted on the map or dispalayed in the details panel.
     */
    Silent = 'silent',

    /**
     * The identify query will not be run.
     */
    None = 'none'
}
