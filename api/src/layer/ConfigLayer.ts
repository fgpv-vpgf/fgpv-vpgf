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

import { BaseLayer, Attribute } from 'api/layer/BaseLayer';
import Map from 'api/Map';
import { InitialLayerSettings } from 'api/schema';
import { Observable, Subject } from 'rxjs/Rx';
import { DynamicLayerEntryNode } from 'api/schema';

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
 * const myConfigLayer = RZ.mapById("<id>").layers.addLayer(layerJson)
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
     * Requires a schema valid JSON config layer snippet, map instance where the layer is added and viewer layer record.
     * If it is a dynamic layer, then the layer index must also be provided and used to get the proxy.
     */
    constructor(config: JSONConfig, mapInstance: any, layerRecord: any, layerIndex?: number) {
        super(mapInstance);

        this._id = config.id;
        this._name = config.name;
        this._opacity = config.state && typeof config.state.opacity !== 'undefined' ? config.state.opacity : 1;
        this._visibility = config.state && typeof config.state.visibility !== 'undefined' ? config.state.visibility : true;
        this._catalogueUrl = config.catalogueUrl || '';
        this._layerType = config.layerType;
        this._viewerLayer = layerRecord;

        if (this._layerType === layerTypes.ESRI_DYNAMIC) {
            this._layerIndex = layerIndex;
            this._layerProxy = layerRecord.getChildProxy(layerIndex);
        } else {
            this._layerProxy = layerRecord.getProxy();
        }
    }

    /** The viewer downloads attributes when needed - call this function to force an attribute download. The `attributes_added` event will trigger when the download is complete. */
    fetchAttributes(): void {
        const attribs = this._layerProxy.attribs;

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

    /** If layer out of scale, zooms in / out to a scale level where the layer is visible */
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

interface JSONConfig {
    id: string;
    name: string;
    catalogueUrl?: string;
    layerType: string;
    state?: InitialLayerSettings;
}

interface AttribObject {
    features: Array<FeaturesArray>,
    oidIndex: Object
}

interface FeaturesArray {
    attributes: Object
}
