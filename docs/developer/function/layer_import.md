The "Layer Import Wizard" or `loader` (as it's referenced in the code), is a major piece of UI functionality which allows users to add data to a map instance. There are two way this can be done - through a service or a file.



## Importing Files

Main directive: __rvLoaderFile__ \
Services used: __layerSource, legendServcie__ \
Classes used: __LayerSourceInfo, LayerBlueprint__

The UI for importing files is a stepper (wizard), with three steps: file uploading, format selection, and configuration.



### File Upload

The user can select a file from a local disk using a file selector, drag'n'drop a file onto the layer import wizard, or enter an absolute URL to be loaded over the network. The file path and the HTML5 file object (if any) are then passed to the __layerSource__ service's __fetchFileInfo__ function to parse the data. __geoApi__ is called to analyze the file, test if it contains readable data, and, if possible, determine the file type (we can't just rely on file extension, but a most likely option will be preselected), along with smart defaults for each file type. After the data is read, a three __LayerSourceInfo__ objects are created for three supported file types: CSV, GeoJSON, and ShapeFile.

A __LayerSourceInfo__ contains a typed config for a Feature Layer and various extra options like lat/long field names or point colour that can be changed by the user, but are not found in the layer config class. Upfront validation is expensive and time consuming, so the user is tasked with correctly identifying the file type.

These three options are returned to the import wizard which proceeds to the next step.

_Note:_ when the user selects or drag'n'drops a file, file reading and validation happens automatically; when entering a file URL, the user needs to click the "Continue" button.



### File Type Selecting

At this step, the user confirms the preselect file type or choses a different one. Update clicking "Continue", the `validate` function is called on a corresponding __LayerSourceInfo__ object. geoApi does its best to check if the selected file type matches its content. If the check succeeds, the wizard moves the next step; if not, the user is informed about the error.

When a choice is made, the layer config of the __LayerSourceInfo__ object is saved. This is used to restore any user-made changes tp the config, if the configuration step is canceled.

_Note:_ validation is not perfect, and it's possible for a `json` file to be validated as a `csv` file.



### File Configuration

At this step, the user is given a chance to configure some aspects of the Feature layer being created.

##### CSV

- latitude and longitude fields

##### All Types

- layer name as it appears in the legend
- primary field to be used for hover tips
- colour that points will be rendered in



When the user click the "Continue" button, a __LayerFileBlueprint__ object is formed using the config from the __LayerSourceInfo__. Another validation step is run when geoApi tries to create an ESRI layer object from the underlying data.

If this is successful, as the final step, the wizard passed the __LayerFileBlueprint__ object to the __legendService__ to import. The __legendService__ will attempt to make a __LayerRecord__ object from the __LayerFileBlueprint__.

_Note:_ After multiple validations, the layer might still fail when added to the map. It seems there is no way to predict if the layer will load correctly apart from adding it to the map and trying to load it.



## Importing Services

Main directive: __rvLoaderService__\
Services used: __layerSource, legendServcie__\
Classes used: __LayerSourceInfo, LayerBlueprint__

The UI for importing services is a stepper (wizard), with three steps: service connection, service type selection,  and configuration.



### Service Connection

At this step, the user can enter service URL which will be passed to the __layerSource__ service's __fetchServiceInfo__ function to parse the data. There is a small validation step to ensure the user input is an actual URL and is not just some garbage text.

__fetchServiceInfo__ will call geoApi's __parseCapabilities__ function to check if the URL points to a WMS service. If it's not a WMS, the geoApi's prediction function (__predictLayerUrl__) is called to determine the service type. When the service type is determined, a number of __LayerSourceInfo__ objects is created according to these tables:

#### Map Server No Tile Support

| ESRI Layer Type / Endpoint | Feature | Raster  | Group   | Root    |
| -------------------------- | ------- | ------- | ------- | ------- |
| Tile                       | No      | No      | No      | No      |
| Dynamic                    | **Yes** | **Yes** | **Yes** | **Yes** |
| Feature                    | **Yes** | No      | No      | No      |
| Image                      | No      | No      | No      | No      |
| WMS                        | No      | No      | No      | No      |

#### Map Server Tile With Tile Support

| ESRI Layer Type / Endpoint | Feature | Raster  | Group   | Root    |
| -------------------------- | ------- | ------- | ------- | ------- |
| Tile                       | **Yes** | **Yes** | **Yes** | **Yes** |
| Dynamic                    | **Yes** | **Yes** | **Yes** | **Yes** |
| Feature                    | **Yes** | No      | No      | No      |
| Image                      | No      | No      | No      | No      |
| WMS                        | No      | No      | No      | No      |

#### Feature Server

| ESRI Layer Type / Endpoint | Feature | Group | Root |
| -------------------------- | ------- | ------ | ---- |
| Tile                       | No      | No     | No   |
| Dynamic                    | No      | No     | No   |
| Feature                    | **Yes** | No     | No   |
| Image                      | No      | No     | No   |
| WMS                        | No      | No     | No   |

#### Image Server

| ESRI Layer Type |         |
| --------------- | ------- |
| Tile            | No      |
| Dynamic         | No      |
| Feature         | No      |
| Image           | **Yes** |
| WMS             | No      |

A corresponding config object is created and wrapped into a __LayerSourceInfo__ object to provide user options like the primary field, or included sublayers.

All options are returned to the import wizard.

### Service Type Selection

At this step, the users choses the target layer type from the available choices. When a choice is made, the layer config of the __LayerSourceInfo__ object is saved. This is used to restore any user-made changes tp the config, if the configuration step is canceled.

_Note:_ If there is only a single target layer type option, it will be locked. This step becomes a simple notification. The user must still click the "Continue" button to proceed.



### Service Configuration

At this step, the user is given a chance to configure some aspects of the layer being created.

##### Feature

- layer name as it appears in the legend
- primary field to be used for hover tips

##### Dynamic

- sublayers to be included as the top level items in a legend group
- if a single sublayer is selected, the user can choose to not display this sublayer inside a group
  - if the dynamic service URL contained an index at the end, a corresponding sublayer will be preselected
  - the user has an shortcut option of selecting all sublayers or deselection currently selected
- group name as it appears in the legend (if more than one sublayer is selected, or the user chose to group a single sublayer)

##### WMS

- layer name as it appears in the legend
- sublayers to be included as the top level items in a wms legend block

When the user clicks the "Continue" button, a __LayerServiceBlueprint__ is created using the layer config from the user-configured __LayerSourceInfo__ object. This in turn is passed to the __legendService__ to import. The __legendService__ will attempt to make a __LayerRecord__ object.