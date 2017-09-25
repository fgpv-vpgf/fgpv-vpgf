Scale-dependent layers will only render data on the map at certain zoom levels. For example, [CESI/CESI_Air_Ozone ](http://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/CESI_Air_Ozone/MapServer) has four scale-depended layers:

- [zoom level 1](http://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/CESI_Air_Ozone/MapServer/1) (1)
  - **Min Scale: **73957339
  - **Max Scale: **25000001
- [zoom level 2](http://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/CESI_Air_Ozone/MapServer/2) (2)
  - **Min Scale: **25000000
  - **Max Scale: **5000001
- [zoom level 3](http://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/CESI_Air_Ozone/MapServer/3) (3)
  - **Min Scale: **5000000
  - **Max Scale: **100001
- [zoom level 4](http://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/CESI_Air_Ozone/MapServer/4) (4)
  - **Min Scale: **100000
  - **Max Scale: **9028

### Behaviour

When added to the map, only `zoom level 1` layer is visible on the map, with other being out of scale. Out-of-scale layers are rendered with a `zoom in` or `zoom out` toggle instead of the regular visibility toggle.

![](https://i.imgur.com/gk8JRrl.png)

This toggle will zoom the map to the level where its data is visible. The direction of zoom (in or out), depends whether the current zoom level is below or above the visible scale of the layer.

[CESI/CESI_Air_Ozone ](http://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/CESI_Air_Ozone/MapServer) is designed to have only one of the child layers visible at a time, so as the map zooms in, the layer become visible and out-of-scale one after another:

![](https://i.imgur.com/CUbNxSo.png)
![](https://i.imgur.com/4CIjE1o.png)
![](https://i.imgur.com/E6AqmOg.png)
![](https://i.imgur.com/oRIYu0g.png)

If the layer's visibility is toggled off, it will be displayed with an empty visibility checkbox even if the layer is out of scale. If the layer is made visible, the visibility toggle will be replace the `zoom in/out` button to indicate its out-of-scale status:

![scale_dep 2](https://user-images.githubusercontent.com/2285779/30815682-dfafbbe8-a1e1-11e7-9f06-2acba957861f.gif)