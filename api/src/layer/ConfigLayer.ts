import { BaseLayer, DataItem } from 'api/layer/BaseLayer';
import Map from 'api/Map';
import { InitialLayerSettings } from 'api/schema';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Rx';
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
 * myConfigLayer.addListener('state_changed', function(stateName) {
 *  if (stateName === 'rv-loaded') {
 *    // layer has loaded, do stuff here
 *  }
 * });
 * ```
 */
export default class ConfigLayer extends BaseLayer {
    private _catalogueUrl: string;
    private _layerType: string;

    private _state: string;
    private _stateChanged: Observable<LayerAndState>

    /** Requires a schema valid JSON config layer snippet and a map instance where the layer is added */
    constructor(config: JSONConfig, mapInstance: any) {
        super(mapInstance);

        this._id = config.id;
        this._name = config.name;
        this._opacity = config.state && typeof config.state.opacity !== 'undefined' ? config.state.opacity : 1;
        this._visibility = config.state && typeof config.state.visibility !== 'undefined' ? config.state.visibility : true;
        this._catalogueUrl = config.catalogueUrl || '';
        this._layerType = config.layerType;
    }

    /** Returns the state of the layer.  */
    get state(): string { return this._state; }

    set stateChanged(observable: Observable<LayerAndState>) {
        this._stateChanged = observable;
        this._stateChanged.subscribe(layerAndState => {
            if (this.id === layerAndState.layer.layerId && layerAndState.state && this._state !== layerAndState.state) {
                this._state = layerAndState.state;
            }
        });
    }

    /**
     * Emits whenever the layer state changes.
     *
     * The state can be one of 'rv-error', 'rv-bad-projection', 'rv-loading', 'rv-refresh', and 'rv-loaded'.
     * This event is always fired at least once with 'rv-loading' as the first state type.
     *
     * @event nameChanged
    */
    get stateChanged(): Observable<LayerAndState> {
        return this._stateChanged;
    }

    /** The viewer downloads data when needed - call this function to force a data download. The `data_added` event will trigger when the download is complete. */
    fetchData(): void {
        let attribs;
        if (this._layerType === layerTypes.ESRI_DYNAMIC) {
            attribs = this.layerI.attribs;
        } else {
            attribs = this.layerI.getProxy().attribs;
        }

        if (attribs) {
            attribs.then((data: any) => {
                this._dataArray = [];
                data.features.forEach((feat: any) => {
                    Object.keys(feat.attributes).forEach(key =>
                        this._dataArray.push({
                            name: key,
                            value: feat.attributes[key]
                        })
                    );
                });

                this._dataAdded.next(this._dataArray);
            });
        }
    }

    /** Returns the catalogue URL */
    get catalogueUrl(): string { return this._catalogueUrl; }

    /** Returns the underlying layer type such as esriFeature, esriDynamic, and ogcWms. */
    get type(): string { return this._layerType; }

    /** Pans to the layers bounding box */
    panToBoundary(): void {
        this.layerI.zoomToBoundary(this.mapI.instance);
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
        // need to see how to apply values in table correctly  ?
        if (this._layerType === layerTypes.ESRI_DYNAMIC) {
            const parentNode = this.layerI._source._parent;
            if (!parentNode.isFileLayer() && parentNode.config.table) {
                this.layerI.setDefinitionQuery(layerDefinition);

                const idx = this.layerI.itemIndex;

                // loose equality since type can be either string or number
                const childNode = parentNode.config.layerEntries.find((l: any) => l.index == idx);

                childNode.initialFilteredQuery = layerDefinition;

                childNode.filter = childNode.table.applied = (layerDefinition !== '');
            }
        } else if (this._layerType === layerTypes.ESRI_FEATURE) {
            if (!this.layerI.isFileLayer() && this.layerI.config.table) {
                this.layerI.setDefinitionQuery(layerDefinition);
                this.layerI.config.initialFilteredQuery = layerDefinition;

                this.layerI.config.filter = this.layerI.config.table.applied = (layerDefinition !== '');
            }
        }
    }

    /** Zooms to the minimum layer scale */
    zoomToScale(): void {
        let minScale;
        if (this._layerType === layerTypes.ESRI_DYNAMIC) {
            minScale = this.layerI._source._parent._layer.minScale;
        } else {
            minScale = this.layerI._layer.minScale;
        }

        if (minScale === 0) {
            const minTileScale = this.mapI.selectedBasemap.lods[0].scale;
            this.mapI.instance.setScale(minTileScale);
        } else {
            this.mapI.instance.setScale(minScale);
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
