import { BaseLayer, Attribute } from 'api/layer/BaseLayer';
import Map from 'api/Map';
import { InitialLayerSettings } from 'api/schema';
import { Observable, Subject } from 'rxjs/Rx';
import { LayerNode } from 'api/schema';

const layerTypes = {
    ESRI_DYNAMIC: 'esriDynamic',
    ESRI_FEATURE: 'esriFeature',
    ESRI_IMAGE: 'esriImage',
    ESRI_TILE: 'esriTile',
    OGC_WMS: 'ogcWms'
}

/**
 * A config layer instance is created automatically for every layer in the viewers configuration. You can also create them outside the config.
 *
 * Note that `ConfigLayer` instances cannot control geometry.
 *
 * @example Create a ConfigLayer <br><br>
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
 * const myConfigLayer = new RV.LAYER.ConfigLayer(layerJson);
 *
 * myConfigLayer.attributesAdded.subscribe(function (attribs) {
 *  if (attribs) {
 *      // attributes loaded, do stuff here
 *  }
 * });
 * ```
 */
export default class ConfigLayer extends BaseLayer {
    private _catalogueUrl: string;
    private _layerType: string;

    /**
     * Requires a schema valid JSON config layer snippet and a map instance where the layer is added.
     * The viewer layer instance must also be provided if created from viewers configuration.
     * If it is a dynamic layer, then the instance will be used to get the child layer index as well.
     */
    constructor(config: JSONConfig, mapInstance: any, viewerInstance?: any) {
        super(mapInstance);

        this._id = config.id;
        this._name = config.name;
        this._opacity = config.state && typeof config.state.opacity !== 'undefined' ? config.state.opacity : 1;
        this._visibility = config.state && typeof config.state.visibility !== 'undefined' ? config.state.visibility : true;
        this._catalogueUrl = config.catalogueUrl || '';
        this._layerType = config.layerType;

        if (viewerInstance) {
            this._viewerLayer = viewerInstance;

            if (this._layerType === layerTypes.ESRI_DYNAMIC) {
                this._layerIndex = parseInt(viewerInstance.itemIndex);
            }
        } else {    // layer created outside the config
            // TODO: figure out how to create a ConfigLayer instance from outside the config, similar to whats in example above  ?
        }
    }

    /** The viewer downloads attributes when needed - call this function to force an attribute download. The `attributes_added` event will trigger when the download is complete. */
    fetchAttributes(): void {
        let attribs;
        if (this._layerType === layerTypes.ESRI_DYNAMIC) {
            attribs = this._viewerLayer.attribs;
        } else {
            attribs = this._viewerLayer.getProxy().attribs;
        }

        if (attribs) {
            attribs.then((attrib: AttribObject) => {
                this._attributeArray = [];
                attrib.features.forEach((feat: FeaturesArray) => {
                    Object.keys(feat.attributes).forEach(key =>
                        this._attributeArray.push({
                            id: key,
                            value: (<any>feat.attributes)[key]
                        })
                    );
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

    /** Returns the catalogue URL */
    get catalogueUrl(): string { return this._catalogueUrl; }

    /** Returns the underlying layer type such as esriFeature, esriDynamic, and ogcWms. */
    get type(): string { return this._layerType; }

    /** Pans to the layers bounding box */
    panToBoundary(): void {
        this._viewerLayer.zoomToBoundary(this._mapInstance.instance);
    }

    /**
     * Layer conditions limit the information from a layer that gets displayed on the map and populated as data.
     *
     * Layer conditions can not be set for file layers
     *
     * @example
     *
     * ```js
     * var layerDefs = "OBJECTID <= 100 and STATE_NAME='Kansas'";
     * mapServiceLayer.setLayerConditions(layerDefs);
     * ```
     */
    setLayerConditions(layerDefinition: string): void {
        // TODO: need to see how to apply values in table correctly  ?
        if (this._layerType === layerTypes.ESRI_DYNAMIC) {
            const parentNode = this._viewerLayer._source._parent;     // avoid private variables
            if (!parentNode.isFileLayer() && parentNode.config.table) {
                this._viewerLayer.setDefinitionQuery(layerDefinition);

                const idx = this._layerIndex;

                // loose equality since type can be either string or number
                const childNode = parentNode.config.layerEntries.find((l: any) => l.index === idx);

                childNode.initialFilteredQuery = layerDefinition;

                childNode.filter = childNode.table.applied = (layerDefinition !== '');
            }
        } else if (this._layerType === layerTypes.ESRI_FEATURE) {
            if (!this._viewerLayer.isFileLayer() && this._viewerLayer.config.table) {
                this._viewerLayer.setDefinitionQuery(layerDefinition);
                this._viewerLayer.config.initialFilteredQuery = layerDefinition;

                this._viewerLayer.config.filter = this._viewerLayer.config.table.applied = (layerDefinition !== '');
            }
        }
    }

    /** Zooms to the minimum layer scale */
    zoomToScale(): void {   // may want to change function name and functionality  ?
        let minScale;
        if (this._layerType === layerTypes.ESRI_DYNAMIC) {
            minScale = this._viewerLayer._source._parent._layer.minScale;
        } else {
            minScale = this._viewerLayer._layer.minScale;
        }

        if (minScale === 0) {
            const minTileScale = this._mapInstance.selectedBasemap.lods[0].scale;
            this._mapInstance.instance.setScale(minTileScale);
        } else {
            this._mapInstance.instance.setScale(minScale);
        }
    }
}

interface JSONConfig {
    id: string;
    name: string;
    catalogueUrl?: string;
    layerType: string;
    state?: InitialLayerSettings;
}

interface LayerAndState {
    layer: any,     // can't use type 'LayerNode' because 'layerid' does not exist on instance
    state: string
}

interface AttribObject {
    features: Array<FeaturesArray>,
    oidIndex: Object
}

interface FeaturesArray {
    attributes: Object
}
