export declare module RV {

    /**
     * This event is fired when a new map instance is created.
     * @event map_added
     * @property {RV.Map} mapInstance
     */
    export const map_added: Event;

    export function addListener(eventName: string, handler: Function): MapsEventListener;
    export function addListenerOnce(eventName: string, handler: Function): MapsEventListener;

    /** A map instance is needed for every map on the page. To display `x` number of maps at the same time, you'll need `x` number of map instances,
     * with separate div containers for each one.
     *
     * @example <br><br>
     *
     * ```js
     * var mapInstance = new Map(document.getElementById('map'));
     * ```
     */
    export class Map extends MVCObject {
        /** Creates a new map inside of the given HTML container, which is typically a DIV element.
         * If opts is a string then it is considered to be a url to a json config snippet of a map.
        */
        constructor(mapDiv: HTMLElement, opts?: Object | JSON | string);

        /** Loads a partial config snippet (schema validated). Does not load layers.
         *
         * @see {@link RV.LAYER.ConfigLayer}
         */
        loadConfig(config: JSON): void;

        /**
         * Contains UI related functionality.
         *
         * @example #### Adding data tags on the side menu buttons for Google tag manager integration <br><br>
         *
         * ```js
         * $(mapInstance.ui.anchors.SIDE_MENU.GROUPS).find('button').each(function(node) {
         *     node.data('google-tag', '');
         * });
         * ```
         *
         * @example #### Opening the left side menu panel<br><br>
         *
         * ```js
         * mapInstance.ui.panels.getById('sideMenu').open();
         * ```
         *
         * @example #### Adding a map control button<br><br>
         * ```js
         * var controlDiv = document.createElement('div');
         * controlDiv.style.backgroundColor = '#fff'; // style as needed
         * $(mapInstance.ui.anchors.MAP_CONTROLS).appendChild(controlDiv);
         * ```
         */
        ui: {
            anchors: UI.anchorPoints;
            panels: UI.PanelRegistry;
            legend: UI.LegendEntry;
            basemaps: UI.Basemap;
            popup: UI.Popup;
        };

        /**
         * Every Map has a `layers` object by default, so there is no need to initialize one - even if the map has no layers.
         *
         * @example #### Add geoJSON & getting a layer by its ID <br><br>
         *
         * ```js
         * var mapInstance = new RV.Map(...);
         * mapInstance.layers.addGeoJson(...);
         * mapInstance.layers.getLayerById(...);
         * ```
         */
        layers: LAYER.LayerGroup;

        /** Returns the position displayed at the center of the map.  */
        setCenter(xy: RV.GEOMETRY.XY | RV.GEOMETRY.XYLiteral) : void;
        setZoom(zoom: number) : void;
        /** Changes the center of the map to the given XY. If the change is less than both the width and height of the map, the transition will be smoothly animated. */
        panTo(xy: RV.GEOMETRY.XY | RV.GEOMETRY.XYLiteral) : void;
        /** Changes the center of the map by the given distance in pixels. If the distance is less than both the width and height of the map, the transition will be smoothly animated.  */
        panBy(x: number, y: number) : void;
        getZoom(): number;
        getDiv(): HTMLElement;
        getCenter(): RV.GEOMETRY.XY;
        getBounds(): RV.GEOMETRY.XYBounds;
        /** Puts the map into full screen mode when enabled is true, otherwise it cancels fullscreen mode. */
        fullscreen(enabled: boolean) : void;

        /**
         * This event is fired when the viewport boundary changes.
         * @event bounds_changed
         * @property {RV.GEOMETRY.XYBounds} newBounds
         */
        bounds_changed: Event;

        /**
         * This event is fired when the map center property changes.
         * @event center_changed
         * @property {xy} newXY
         */
        center_changed: Event;

        /**
         * This event is fired when the user clicks on the map, but does not fire for clicks on panels or other map controls.
         * @event click
         * @property {Event.MouseEvent} event
         */
        click: Event;

        /**
         * This event is fired when the user double clicks on the map, but does not fire for double clicks on panels or other map controls.
         * @event doubleclick
         * @property {Event.MouseEvent} event
         */
        doubleclick: Event;

        /**
         * This event is fired when the user mouse downs over the map, but does not fire for movement over panels or other map controls.
         * @event mousedown
         * @property {Event.MouseEvent} event
         */
        mousedown: Event;

        /**
         * This event is fired when the user mouse ups over the map, but does not fire for movement over panels or other map controls.
         * @event mouseup
         * @property {Event.MouseEvent} event
         */
        mouseup: Event;


        /**
         * This event is fired when the users mouse moves over the map, but does not fire for movement over panels or other map controls.
         * @event mousemove
         * @property {Event.MouseEvent} event
         */
        mousemove: Event;

        /**
         * This event is fired when the maps zoom level changes.
         * @event zoom_changed
         * @property {number} zoom
         */
        zoom_changed: Event;
    }

    /** The MVCObject constructor is guaranteed to be an empty function, and so you may inherit from MVCObject by simply writing `MySubclass.prototype = new google.maps.MVCObject();`. Unless otherwise noted, this is not true of other classes in the API, and inheriting from other classes in the API is not supported. */
    export class MVCObject {
        /**
         * Adds the given listener function to the given event name.
         * Returns an identifier for this listener that can be used with RV.event.removeListener.
         *
         * @see {@link RV.event.addListener}
         * */
        addListener(eventName: string, handler: Function): MapsEventListener;
        /** Returns the value of the property specified by 'key' */
        get(key: string): any;
        /** Sets 'value' to 'key' on 'this'. */
        set(key: string, value?: any): MVCObject;
        /** Generic handler for state changes. Override this in derived classes to handle arbitrary state changes.
         * @example <br><br>
         * ```js
         * var m = new MVCObject();
         * m.changed = sinon.spy();
         * m.set('k', 1);
         * m.changed.should.have.been.calledOnce;
         * ```
        */
        changed(...args: any[]): void;
        /** Notify all observers of a change on this property. This notifies both objects that are bound to the object's property as well as the object that it is bound to. */
        notify(key: string): MVCObject;
        /** Sets a collection of key-value pairs. */
        setValues(values: any): MVCObject;
        /** Updates value of target.targetKey to this.key whenever it is updated.  */
        bindTo(key: string, target: MVCObject, targetKey?: string, noNotify?: boolean): MVCObject;
        /** Removes a binding. */
        unbind(key: string): MVCObject;
        /** Removes all bindings. */
        unbindAll(): MVCObject;
    }

    export interface MapsEventListener {
        /** Removes the listener. Calling listener.remove() is equivalent to RV.event.removeListener(listener). */
        remove(): void;
    }

    export class MVCArray<A> extends MVCObject {
        constructor(array?: Array<A>);
        /** Removes all elements from the array. */
        clear(): void;
        /** Iterate over each element, calling the provided callback. The callback is called for each element like: callback(element, index). */
        forEach(callback: (element: A, index: number) => void): void;
        /** Returns a reference to the underlying Array. Warning: if the Array is mutated, no events will be fired by this object. */
        getArray(): Array<A>;
        /** Returns the element at the specified index. */
        getAt(i:number): A;
        /** Returns the number of elements in this array. */
        getLength(): number;
        /** Inserts an element at the specified index. */
        insertAt(i: number, elem: A): void;
        /** Removes the last element of the array and returns that element. */
        pop(): A;
        /** Adds one element to the end of the array and returns the new length of the array. */
        push(elem: A): number;
        /** Removes an element from the specified index. */
        removeAt(i:number): A;
        /** Sets an element at the specified index. */
        setAt(i:number, elem: A): void;

        /**
         * This event is fired when insertAt() is called. The event passes the index that was passed to insertAt().
         * @event insert_at
         * @property {number} index
         */
        insert_at: Event;

        /**
         * This event is fired when removeAt() is called. The event passes the index that was passed to removeAt() and the element that was removed from the array.
         * @event remove_at
         * @property {number} index
         * @property {any} element
         */
        remove_at: Event;
        /**
         * This event is fired when setAt() is called. The event passes the index that was passed to setAt() and the element that was previously in the array at that index.
         * @event set_at
         * @property {number} index
         * @property {any} element
         */
        set_at: Event;
    }


    /**
     * ### BaseGeometry
     * Geometry types extend `BaseGeometry`, such as `Point`, `MultiPoint`, `LineString`, and `MultiLineString`.
     *
     * ### Geometry units
     * All geometry is calculated in x,y decimal degrees. In general `XYLiteral` and `XYBoundsLiteral` can be used in places where
     * `XY` and `XYBounds` are used and will be converted into their respective instance classes automatically.
     */
    export module GEOMETRY {

        /** A XYBounds instance represents a rectangle in geographical coordinates. */
        export class XYBounds {
            /** Constructs a rectangle from the points at its south-west and north-east corners. */
            constructor(sw?: XY | XYLiteral, ne?: XY | XYLiteral);
            /** Returns true if the given x,y decimal degrees is in this bounds. */
            contains(xy: XY | XYLiteral): boolean;
            equals(other:XYBounds | XYBoundsLiteral): boolean;
            /** Extends this bounds to contain the given point. */
            extend(point:XY|XYLiteral): XYBounds;
            /** Computes the center of this XYBounds. */
            getCenter(): XY;
            /** Returns the north-east corner of this bounds. */
            getNorthEast(): XY;
            /** Returns the south-west corner of this bounds. */
            getSouthWest(): XY;
            /** Returns true if this bounds shares any points with the other bounds. */
            intersects(other: XYBounds | XYBoundsLiteral): boolean;
            /** Returns if the bounds are empty. */
            isEmpty(): boolean;
            /** Converts to JSON representation. This function is intended to be used via JSON.stringify. */
            toJSON(): XYBoundsLiteral
            /** Converts to string. */
            toString(): string;
            /** Returns a string of the form "x_lo,y_lo,x_hi,y_hi" for this bounds, where "lo" corresponds to the southwest corner of the bounding box, while "hi" corresponds to the northeast corner of that box. */
            toUrlValue(precision?:number): string;
            /** Extends this bounds to contain the union of this and the given bounds. */
            union(other: XYBounds | XYBoundsLiteral): XYBounds;
        }

        /** Object literals are accepted in place of XYBounds objects throughout the API. These are automatically converted to XYBounds objects. All south, west, north and east must be set, otherwise an exception is thrown. */
        export interface XYBoundsLiteral {
            /** East x in decimal degrees. */
            east: number;
            /** North y in decimal degrees. */
            north: number;
            /** South y in decimal degrees. */
            south: number;
            /** West x in decimal degrees. */
            west: number;
        }
        export class CoordinatePoint {
            constructor(x: number, y: number);
            /** Compares two Points. */
            equals(other: Point): boolean;
            /** Returns a string representation of this Point. */
            toString(): string;
            /** The X coordinate */
            x: number;
            /** The Y coordinate */
            y: number;
        }

        export class XY  {
            /** Creates a XY object representing a geographic point. */
            constructor(y: number, x: number);
            /** Comparison function. */
            equals(other:XY): boolean;
            /** Returns y in deciamal degrees. */
            y(): number;
            /** Returns the longitude in degrees. */
            x(): number;
            /** Converts to JSON representation. This function is intended to be used via JSON.stringify. */
            toJSON(): XYLiteral;
            /** Converts to string representation. */
            toString(): string;
            /** Returns a string of the form "y,x" for this XY. We round the y/x values to 6 decimal places by default. */
            toUrlValue(precision?: number): string;
        }

        export interface XYLiteral {
            /** Latitude in degrees. */
            y: number;
            /** Longitude in degrees. */
            x: number;
        }

        /**
         * All geometry types must derive from this class. Not intented to be instantiated on its own.
         */
        export class BaseGeometry {
            constructor(id: string);
            /** Repeatedly invokes the given function, passing a point from the geometry to the function on each invocation. */
            forEachXY(callback: (xy: XY) => void): void;
            /** Returns the type of the geometry object. Possibilities are "Point", "MultiPoint", "LineString", or "MultiLineString". */
            getType(): string;
            /** Returns the geometry id. */
            getId(): string;
        }

        /** A Point geometry contains a single XY. */
        export class Point extends RV.GEOMETRY.BaseGeometry {
            /** Constructs a Point from the given XY or XYLiteral. */
            constructor(id: string | number, xy: RV.GEOMETRY.XY | RV.GEOMETRY.XYLiteral);
            /** Returns the contained XY. */
            get(): RV.GEOMETRY.XY;
            /** Returns the string "Point". */
            getType(): string;

            /** URL of icon to be displayed on the map. */
            icon: string;
        }

        /** A MultiPoint geometry contains a number of XYs. */
        export class MultiPoint extends RV.GEOMETRY.BaseGeometry {
            /** Constructs a MultiPoint from the given XYs or XYLiterals. */
            constructor(id: string | number, elements: Array<RV.GEOMETRY.XY | RV.GEOMETRY.XYLiteral>);
            /** Returns an array of the contained XYs. A new array is returned each time getArray() is called. */
            getArray(): Array<RV.GEOMETRY.XY>
            /** Returns the n-th contained XY. */
            getAt(n: number): RV.GEOMETRY.XY;
            /** Returns the number of contained XYs. */
            getLength(): number;
            /** Returns the string "MultiPoint". */
            getType(): string;
        }

        /** A LineString geometry contains a number of XYs. */
        export class LineString extends MultiPoint {
            /** Returns the string "LineString". */
            getType(): string;
        }

        /** A LinearRing geometry contains a number of y,x decimal degrees, representing a closed LineString. There is no need to make the first y,x equal to the last y,x. The LinearRing is closed implicitly. */
        export class LinearRing extends BaseGeometry {
            constructor(id: string | number, elements: Array<RV.GEOMETRY.XY | RV.GEOMETRY.XYLiteral>);
        }

        export class Polygon extends BaseGeometry {
            constructor(id: string | number, elements: Array<LinearRing>);
            /** Returns the string "Polygon". */
            getType(): string;
            /** Returns true iff the given point is within the polygon */
            contains(point: Point): boolean;
            /** Returns the total area of the polygon in the given unit */
            area(unit: string): number;
            /** Returns the perimeter of the polygon in the given unit */
            perimeter(unit: string): number;
        }

        export class MultiPolygon extends BaseGeometry {
            constructor(id: string | number, polygons: Array<Polygon>);
            /** Returns the string "MultiPolygon". */
            getType(): string;
            /** Returns true iff the given point is within any of the contained polygons */
            contains(point: Point): boolean;
            /** Returns the total area of all the polygons in the given unit */
            area(unit: string): number;
            /** Returns the perimeter of all the polygons in the given unit */
            perimeter(unit: string): number;
        }

        export class Annotation extends BaseGeometry {
            constructor(id: string | number, xy: RV.GEOMETRY.XY | RV.GEOMETRY.XYLiteral, text: string);
            /** Returns the string "Annotation". */
            getType(): string;
        }

        export class MultiAnnotation extends BaseGeometry {
            constructor(id: string | number, annotations: Array<Annotation>);
            /** Returns the string "MultiAnnotation". */
            getType(): string;
        }

        /** A MultiLineString geometry contains a number of LineStrings. */
        export class MultiLineString extends RV.GEOMETRY.BaseGeometry {
            /** Constructs a MultiLineString from the given LineStrings or arrays of positions. */
            constructor(id: string | number, elements: Array<LineString | Array<RV.GEOMETRY.XY | RV.GEOMETRY.XYLiteral>>);
            /** Returns an array of the contained LineStrings. A new array is returned each time getArray() is called. */
            getArray(): Array<LineString>;
            /** Returns the n-th contained LineString. */
            getAt(n:number): Array<LineString>;
            /** Returns the number of contained XYs. */
            getLength(): number;
            /** Returns the string "MultiLineString". */
            getType(): string;
        }
    }

    /**
     * There are two types of layers available, `ConfigLayer` and `SimpleLayer`.
     *
     * #### ConfigLayer
     *
     * All layers specified in the viewers configuration file will be available as `ConfigLayer` instances on the map object (`mapInstance.layers`).
     *
     * You can also create a `ConfigLayer` via the API by constructing it with a schema valid layer json object.
     *
     * @see {@link RV.LAYER.ConfigLayer} examples
     *
     * #### SimpleLayer
     *
     * Must be created programatically through the API. Unlike `ConfigLayer`, `SimpleLayer` instances have API control of their geometry.
     *
     * @see {@link RV.LAYER.SimpleLayer} examples
     *
     * #### LayerGroups & Layers
     *
     * Layers will in most cases reside in a `LayerGroup` - an array with special properties and events to make handling many of them easier.
     *
     * ```js
     * // lets create two layers with my magic wand
     * const myLayer1 = new RV.LAYER.SimpleLayer();
     * const myLayer2 = new RV.LAYER.SimpleLayer();
     *
     * const layerGroup1 = new RV.LAYER.LayerGroup();
     * layerGroup1.add(myLayer1);
     * layerGroup1.add(myLayer2);
     * ```
     *
     * #### Using layerGroups
     *
     * A `layerGroup` can define the list of available basemaps, layers on a map, or in a legend. Lets add a layer to the map and show it in the legend
     *
     * ```js
     * // show on the map
     * mapInstance.layers.addLayer(myLayer2);
     * myLayer2.setOpacity(0); // where did it go? It's hidden!
     * myLayer2.setOpacity(70); // that's better
     *
     * // Its not yet in the legend, lets add it
     * // TODO: Integrate legend with new layer types
     * //const specificLegendEntry = mapInstance.ui.legend.getById('legendGroup1');
     * //specificLegendEntry.add(myLayer2);
     *
     * // And lets add a custom element after it, just because we can...
     * var legendDiv = document.createElement('div');
     * $(legendDiv).html('Some text...');
     * specificLegendEntry.add(legendDiv);
     * ```
     *
     * The process is similar with basemaps.
     *
     */
    export module LAYER {

        export interface DataItem {
            name: string;
            value: string | number;
        }

        export class BaseLayer extends MVCObject {
            /** Recursively calls callback for every data item. */
            forEachData(callback: (data: DataItem) => void): void;
            /** Sets the value of a data item by key. */
            setData(key: string, newValue: any): void;
            /** Sets data for each key-value pair in the provided object. */
            setData(keyValue: Object): void;
            /** Returns the value of the requested data, or undefined if the data does not exist. */
            getData(key: string): any;
            /** Returns all data. If applicable, this will pull data from a server, however an empty array will still be
             * returned if no prior data existed. Use the `data_added` event to determine when pulled data is ready.
             */
            getData(): Array<DataItem>;
            /** Removes the data with the given key, or all data if key is undefined. */
            removeData(key: string | undefined): void;

            /**
             * This event is triggered whenever one or more data items are added.
             * @event data_added
             * @property {Array<DataItem>} data
             *
             */
            data_added: Event;

            /**
             * This event is triggered whenever an existing data entry is updated.
             * @event data_changed
             * @property {DataItem} dataBeforeChange
             * @property {DataItem} dataAfterChange
             *
             */
            data_changed: Event;

            /**
             * This event is triggered when data is removed.
             * @event data_removed
             * @property {Array<DataItem>} deletedData
             */
            data_removed: Event;

            /** Returns the name of the layer.  */
            getName(): string;
            /** Sets the name of the layer. This updates the name throughout the viewer. */
            setName(name: string): void;
            /** Returns the opacity of the layer on the map from 0 (hidden) to 100 (fully visible) */
            getOpacity(): number;
            /** Sets the opacity value.
             * @returns boolean true if opacity was set successfully, false otherwise (some layers or configurations may not support this)
             */
            setOpacity(opacity: number): boolean;
            /** Returns true if the layer is currently visible, flase otherwise. */
            getVisibility(): boolean;
            /** Sets the visibility to visible/invisible. */
            setVisibility(visibility: boolean): void;
            /** Exports the layer to a GeoJSON object. */
            toGeoJson(callback: (obj: Object) => void): void;
            /** Returns the layer ID. */
            getId(): string;

            /**
             * This event is triggered when the opacity changes.
             * @event opacity_changed
             */
            opacity_changed: Event;

            /**
             * This event is triggered when the visibility changes.
             * @event visibility_changed
             */
            visibility_changed: Event;
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
        export class ConfigLayer extends BaseLayer {
            /** Requires a schema valid JSON config layer snippet.  */
            constructor(config: JSON);
            /** Returns the underlying layer type such as esriFeature, esriDynamic, and ogcWms. */
            getType(): string;
            /** Zooms to the minimum layer scale */
            zoomToScale(): void;
            /** Pans to the layers bounding box */
            panToBoundary(): void;
            /** Returns the catalogue URL */
            getCatalogueUrl(): string;
            /** The viewer downloads data when needed - call this function to force a data download. The `data_added` event will trigger when the download is complete. */
            fetchData(): void;
            /** Layer definitions limit the information from a layer that gets displayed on the map and populated as data.
             *
             * @example
             *
             * ```js
             * var layerDefs = [];
             * layerDefs[5] = "STATE_NAME='Kansas'";
             * layerDefs[4] = "STATE_NAME='Kansas' and POP2007>25000";
             * layerDefs[3] = "STATE_NAME='Kansas' and POP2007>25000";
             * dynamicMapServiceLayer.setLayerDefinitions(layerDefs);
             * ```
            */
            setLayerDefinitions(layerDefinitions: Array<string>): void;

            /**
             * This event is fired when the layers state changes.
             *
             * The state can be one of 'rv-error', 'rv-bad-projection', 'rv-loading', 'rv-refresh', and 'rv-loaded'.
             * This event is always fired at least once with 'rv-loading' as the first state type.
             * @event state_changed
             * @property {string} stateName
             */
            state_changed: Event;
        }

        /**
         * A simple layer is one created programmatically via the API - without the use of a config construct.
         *
         * @example #### Create a SimpleLayer and draw a line<br><br>
         *
         * ```js
         * const mySimpleLayer = new RV.LAYER.SimpleLayer('myLayer1');
         * const lineGeo = new RV.LAYER.LineString('myLine', [{y: 81, x: 79}, {y: 51, x: 49}]);
         * mySimpleLayer.setGeometry(lineGeo);
         * ```
         */
        export class SimpleLayer extends BaseLayer {
            constructor(name: string);
            /** Returns the name of this layer. This is equivalent to calling `getId()` - `SimpleLayer` id's always match their name.
             *
             * @see {@link BaseLayer.getId}
             */
            getName(): string;

            /** Recursively calls callback for every geometry. */
            forEachGeometry(callback: (geometry: RV.GEOMETRY.BaseGeometry) => void): void;
            /** Sets the value of a data item by key. */
            setGeometry(geometry: RV.GEOMETRY.BaseGeometry): void;
            /** Returns the value of the requested data, or undefined if the data does not exist. */
            getGeometry(): Array<RV.GEOMETRY.BaseGeometry>;
            /**
             * Removes geometry
             * @param geometry any strings should reference a particular geometry instance with that ID. If undefined, all geometry is removed.
             */
            removeGeometry(geometry: Array<string> | string | undefined): void;

            /**
             * This event is triggered whenever geometry is added.
             * @event geometry_added
             * @property {Array<RV.GEOMETRY.BaseGeometry>} geometry
             *
             */
            geometry_added: Event;

            /**
             * This event is triggered whenever geometry is removed.
             * @event geometry_removed
             * @property {Array<RV.GEOMETRY.BaseGeometry>} geometry
             *
             */
            geometry_removed: Event;
        }

        /**
         * #### Under Consideration
         * - To expose the events `geometry_added`, `geometry_removed`. These could only fire for `SimpleLayer` instances in this group.
         */
        export class LayerGroup extends MVCObject {
            /** Adds the provided layer instance to the group, and returns the instance. */
            addLayer(layer: BaseLayer): BaseLayer;
            /** Providing a layer json snippet returns a `ConfigLayer`.*/
            addLayer(layerJSON: JSON): ConfigLayer;
            /** Providing a string layer name will instantiate and return an empty `SimpleLayer` */
            addLayer(layerName: string): SimpleLayer;
            /** Adds GeoJSON layers to the group. Give this method a parsed JSON. The imported layers are returned. Throws an exception if the GeoJSON could not be imported. */
            addLayer(geoJson: Object): Array<SimpleLayer>;
            /** Loads GeoJSON from a URL, and adds the layers to the group. Invokes callback function once async layer loading is complete. */
            addLayer(url: string, callback?: (layers: Array<SimpleLayer>) => void): void;
            /** Checks whether the given layer is in the group. */
            contains(layer: BaseLayer): boolean;
            /** Checks whether the given layer by id is in the group. */
            contains(id: string | number): boolean;
            /** Repeatedly invokes the given function, passing a layer in the group to the function on each invocation. The order of iteration through the layers is undefined. */
            forEach(callback: (layer: BaseLayer) => void): void;
            /** Returns the layer with the given ID, if it exists in the group. Otherwise returns undefined.
             *
             * Note that the IDs 1234 and '1234' are equivalent. Either can be used to look up the same layer.
             */
            getLayerById(id: number | string): BaseLayer | undefined;
            /** Returns all layers of a given type.
             *
             * @example <br><br>
             *
             * ```js
             * const listOfSimpleLayers = mapInstance.layers.getLayerByType(RV.LAYERS.SimpleLayer);
             * ```
             */
            getLayerByType(type: ConfigLayer | SimpleLayer): Array<BaseLayer>;
            /** Removes a layer from the group. */
            removeLayer(layer: BaseLayer): void;
            /** Removes the layer with the provided id from the group. */
            removeLayer(id: string | number): void;
            /** Exports the layers in the group to a GeoJSON object. */
            toGeoJson(callback: (object: Object) => void): void;

            /**
             * This event is fired when a layer is added to the group.
             * @event layer_added
             * @property {BaseLayer} layer
             */
            layer_added: Event;

            /**
             * This event is fired when a layer is removed to the group.
             * @event layer_removed
             * @property {BaseLayer} layerRemoved
             */
            layer_removed: Event;

            /**
             * This event is fired when a layer is clicked on the legend.
             * @event click
             * @property {BaseLayer} layerClicked
             */
            click: Event;

            /**
             * This event is triggered whenever one or more data items are added.
             * @event data_added
             * @property {BaseLayer} layer
             * @property {Array<DataItem>} data
             *
             */
            data_added: Event;

            /**
             * This event is triggered whenever an existing data entry is updated.
             * @event data_changed
             * @property {BaseLayer} layer
             * @property {DataItem} dataBeforeChange
             * @property {DataItem} dataAfterChange
             *
             */
            data_changed: Event;

            /**
             * This event is triggered when data is removed.
             * @event data_removed
             * @property {BaseLayer} layer
             * @property {Array<DataItem>} deletedData
             */
            data_removed: Event;
        }
    }

    /**
     * Defines UI component classes and interfaces.
     *
     * #### UI control
     *
     * We can open and close panels like:
     *
     * ```js
     * mapInstance.ui.panels.getById('left').open();
     * ```
     *
     * Of course we would be opening an empty panel. Lets try this again:
     * ```js
     * mapInstance.ui.panels.addListener('opened', function(panel) {
     *     if (panel.getId() === 'left')
     *         panel.setContent(aDivNode);
     * });
     *
     * mapInstance.ui.panels.getById('left').open();
     * ```
     *
     * We can also stop panels from opening or closing by listening to the `opening` and `closing` events like so:
     *
     * ```js
     * mapInstance.ui.panels.addListener('closing', function(panel, event) {
     *     if (panel.getId() === 'left')
     *         event.stop();
     * });
     * ```
     *
     * Apart from that, `mapInstance.ui.anchors` provides dom nodes of common places in the viewer you may want to edit or add.
     * Adding a custom map control is easy:
     *
     * ```js
     * $(mapInstance.ui.anchors.MAP_CONTROLS).append('<div>my control</div>');
     * ```
     * <br>
     */
    export module UI {

        /**
         * Defines a basemap which is selectable from the basemap panel once added to the map. For example:
         *
         * ```js
         * var myBasemap = new RV.UI.Basemap('My Custom Basemap', 'A personal favorite of mine.', [myLayer1, myLayer2]);
         * myBasemap.setActive(true); // make active so it is displayed when added.
         * mapInstance.set('basemaps', myBasemap);
         * ```
         *
         * @example <br><br>
         *
         * ```js
         * var firstBasemap = mapInstance.ui.basemaps.getLayerById(0);
         * firstBasemap.addListener('active_changed', function(isActive) {
         *     if (isActive) {
         *         firstBasemap.setName('Active Basemap');
         *     }
         * });
         * ```
         */
        export class Basemap extends LAYER.LayerGroup {
            constructor(name: string, layers: Array<RV.LAYER.BaseLayer> | RV.LAYER.BaseLayer, description?: string);
            getName(): string;
            setName(name: string): void;
            getDescription(): string;
            setDescription(desc: string): void;
            /** Returns true if this basemap is currently shown on the map. */
            isActive(): boolean;
            setActive(active: boolean): void;

            /**
             * @event name_changed
             * @property {string} name - The new name
             */
            name_changed: Event;

            /**
             * @event description_changed
             * @property {string} description - The new description
             */
            description_changed: Event;

            /**
             * @event active_changed
             * @property {string} isActive
             */
            active_changed: Event;
        }

        /** Dom nodes for places of interest around the viewer for easier selector location. */
        export interface anchorPoints {
            /** The side menu slide out panel */
            SIDE_MENU: {
                TITLE_IMAGE: Node;
                TITLE: Node;
                GROUPS: MVCArray<Node>;
                FOOTER: Node;
            };
            /** Map navigation controls found at bottom right. */
            MAP_CONTROLS: Node;
            /** Basemap - top right */
            BASEMAP: Node;
            /** Legend action bar containing import, show/hide all, and toggle open/closed */
            LEGEND_BAR: Node;
            /** Main legend section containing legend items */
            LEGEND: Node;
        }

        /**
         * @todo Discuss if we should add more panel locations?
         *
         * <br><br>
         * ```text
         * Panel types:
         *  sideMenu    -   Left siding menu panel
         *  legend      -   Legend panel
         *  import      -   Import wizard
         *  details     -   Layer details
         *  basemap     -   Basemap selector slider menu
         *
         * There are also top level types:
         *  left    -   contains legend, import, details
         *  center  -   datatables
         * ```
         */
        export class PanelRegistry {
            /** Returns a panel by the given id */
            getById(id: string): Panel | undefined;
            forEach(callback: (panel: Panel) => void): void;

            /**
             * This event is fired when a panel is fully open and content is finished rendering.
             * @event opened
             * @property {Panel} Panel
             */
            opened: Event;

            /**
             * This event is fired when a panel is fully closed.
             * @event closed
             * @property {Panel} Panel
             */
            closed: Event;

            /**
             * This event is fired before a panel starts to open. Calling `event.stop()` prevents the panel from opening.
             * @event opening
             * @property {Panel} Panel
             * @property {Event.StoppableEvent} event
             * @property {Node} content
             */
            opening: EVENT.StoppableEvent;

            /**
             * This event is fired before a panel starts to close. Calling `event.stop()` prevents the panel from closing.
             * @event closing
             * @property {Panel} Panel
             * @property {Event.StoppableEvent} event
             */
            closing: EVENT.StoppableEvent;
        }

        export class Popup {
            /** Opens a new popup in the viewer, closing one if open */
            open(): void;
            /** Closes the popup */
            close(): void;
            isOpen(): boolean;
            /** Returns the dom node of the popup content. */
            getContent(): Node;
            /**
             * You can provide a dom node to set as the popup content.
             */
            setContent(node: Node): void;

            /**
             * This event is fired when the popup is fully open.
             * @event opened
             */
            opened: Event;

            /**
             * This event is fired when the popup is fully closed.
             * @event closed
             */
            closed: Event;
        }

        /**
         * Note that opening legend when details is open will close details first. Events will be fired for auto closed panels.
         */
        export class Panel {
            /** Returns the panel identifier, can be "featureDetails", "legend", ... */
            getId(): string;
            /** Opens this panel in the viewer */
            open(): void;
            /** Closes this panel in the viewer */
            close(): void;
            isOpen(): boolean;
            /** Returns the dom node of the panel content. */
            getContent(): Node;
            /**
             * You can provide a dom node to set as the panels content.
             */
            setContent(node: Node): void;

            /**
             * This event is fired when the panel is fully open and content is finished rendering.
             * @event opened
             */
            opened: Event;

            /**
             * This event is fired when the panel is fully closed.
             * @event closed
             */
            closed: Event;

            /**
             * This event is fired before the panel starts to open. Calling `event.stop()` prevents the panel from opening.
             * @event opening
             * @property {Event.StoppableEvent} event
             * @property {Node} content
             */
            opening: EVENT.StoppableEvent;

            /**
             * This event is fired before the panel starts to close. Calling `event.stop()` prevents the panel from closing.
             * @event closing
             * @property {Event.StoppableEvent} event
             */
            closing: EVENT.StoppableEvent;
        }

        export class LegendEntry {

            constructor(id: string, title?: string);
            /** Displayed as the entry title in the legend.  */
            setTitle(title: string): void;
            /** Adds an entry to this legend block. */
            add(member: RV.LAYER.LayerGroup | Node | LegendEntry): void;
            /** Returns the dom node containing this legend entry. */
            getNode(): Node;
            /** Returns any descendents of this legend entry */
            getMembers(): RV.LAYER.LayerGroup | Node | LegendEntry;
            /** Returns the legendEntry with the specified id only if this or a member of this legendEntry has the id set. */
            getById(id: string): LegendEntry | undefined;
        }
    }

    /**
     * Contains all event functionality and classes.
     *
     * The following two statements are equivalent:
     *
     * ```js
     * mapInstance.addListener('bounds_changed', function() {...});
     * RV.EVENT.addListener(mapInstance, 'bounds_changed', function() {...});
     * ```
     *
     * Different event types are not available on all objects - for instance `mapInstance.addListenerOnce` is not valid, but you could instead write `RV.EVENT.addListenerOnce(mapInstance, ...);`
     *
     * Other functions such as `trigger` are mainly used by the viewer, but in advanced cases you may need to trigger events for the viewer to update.
     */
    export module EVENT {
        /** Cross browser event handler registration. This listener is removed by calling removeListener(handle) for the handle that is returned by this function. */
        export function addDomListener(instance: Object, eventName: string, handler: Function, capture?: boolean): MapsEventListener;
        /** Wrapper around addDomListener that removes the listener after the first event. */
        export function addDomListenerOnce(instance: Object, eventName: string, handler: Function, capture?: boolean): MapsEventListener;
        /** Adds the given listener function to the given event name for the given object instance. Returns an identifier for this listener that can be used with removeListener(). */
        export function addListener(instance: Object, eventName: string, handler: Function): MapsEventListener;
        /** Like addListener, but the handler removes itself after handling the first event. */
        export function addListenerOnce(instance:Object, eventName:string, handler:Function): MapsEventListener;
        /** Removes all listeners for all events for the given instance. */
        export function clearInstanceListeners(instance: Object): void;
        /** Removes all listeners for the given event for the given instance. */
        export function clearListeners(instance: Object, eventName: string): void;
        /** Removes the given listener, which should have been returned by addListener above. Equivalent to calling listener.remove(). */
        export function removeListener(listener: MapsEventListener): void;
        /** Triggers the given event. All arguments after eventName are passed as arguments to the listeners. */
        export function trigger(instance: Object, eventName: string, ...var_args: Array<any>): void;

        export class MouseEvent extends StoppableEvent {
            /** The y/x that was below the cursor when the event occurred. */
            xy: RV.GEOMETRY.XY;
        }

        export class StoppableEvent {
            /** Prevents this event from propagating further, and in some case preventing viewer action. */
            stop(): void;
        }
    }
}