import Map from 'api/map';
import * as GEO from 'api/geometry';
import ConfigLayer from 'api/layer/ConfigLayer';
import { Subject } from 'rxjs/Rx';
import * as $ from "jquery";

const mapInstances: Array<Map> = [];

const layerTypes = {
    ESRI_DYNAMIC: 'esriDynamic',
    ESRI_FEATURE: 'esriFeature',
    ESRI_IMAGE: 'esriImage',
    ESRI_TILE: 'esriTile',
    OGC_WMS: 'ogcWms'
}

class RZ {
    /**
     * Emits an instance of the map class whenever a new map is added to the viewer.
     * */
    mapAdded: Subject<Map> = new Subject();

    /**
     * Emits an instance of the map class whenever a new layer is added to the viewer.
     * */
    layerAdded: Subject<LayerAndMap> = new Subject();

    /**
     * Emits an instance of the map class whenever an existing layer is removed.
     * */
    layerRemoved: Subject<LayerAndMap> = new Subject();

    /** Loads and executes a javascript file from the provided url. */
    loadExtension(url: string): void {
        $.getScript(url);
    }
    /** Returns the map class */
    get Map(): typeof Map { return Map; }
    get mapInstances(): Array<Map> { return mapInstances; }
    /** Contains all geography related classes. */
    get GEO() { return GEO };

    /** Returns the different layer classes */
    get LAYER(): Object {
        return {
            ConfigLayer
        }
    }

    mapById(id: string): Map | undefined {
        return this.mapInstances.find(mi => mi.id === id);
    }
}

const RZInstance = new RZ();
interface EnhancedWindow extends Window {
    RZ: RZ
};

(<EnhancedWindow>window).RZ = (<EnhancedWindow>window).RZ ? (<EnhancedWindow>window).RZ : RZInstance;

RZInstance.mapAdded.subscribe(mapInstance => {
    let index: number = mapInstances.findIndex(map => map.id === mapInstance.id);

    if (index !== -1) {
        mapInstances[index] = mapInstance;
    } else {
        mapInstances.push(mapInstance);
    }
});

RZInstance.layerAdded.subscribe((layerAndMap) => {
    const map = RZInstance.mapById(layerAndMap.mapId);

    if (map) {
        let index: number;

        if (layerAndMap.layer.type === layerTypes.ESRI_DYNAMIC) {
            index = map.layers.findIndex(layer =>
                layer.id === layerAndMap.layer.id &&
                layer.dynamicLayerIndex === layerAndMap.layer.dynamicLayerIndex);
        } else {
            index = map.layers.findIndex(layer => layer.id === layerAndMap.layer.id);
        }

        if (index !== -1) {
            map.layers[index] = layerAndMap.layer;      // modify this after when LayerGroup completed  ?
        } else {
            map.layers.push(layerAndMap.layer);     // modify this after when LayerGroup completed  ?
        }
    }
});

RZInstance.layerRemoved.subscribe((layerAndMap) => {
    const map = RZInstance.mapById(layerAndMap.mapId);

    if (map) {
        let index: number;

        // removing dynamic layers does not actually remove the layer if another child is still present  ?
        if (layerAndMap.layer.type === layerTypes.ESRI_DYNAMIC) {
            index = map.layers.findIndex(layer => layer.id === layerAndMap.layer.layerId && layer.dynamicLayerIndex === layerAndMap.layer.dynamicLayerIndex);
        } else {
            index = map.layers.findIndex(layer => layer.id === layerAndMap.layer.layerId);
        }

        if (index !== -1) {
            map.layers.splice(index, 1);    // modify this after when LayerGroup completed  ?
        }
    }
});

interface LayerAndMap {
    layer: any,     // can't use type 'ConfigLayer' because layerRemoved takes 'layerRecord' instead which doesn't have layerId
    mapId: string
}