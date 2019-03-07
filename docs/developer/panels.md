---
nav: dev
---

# Panels

The panels api allows you to watch, control, and create panels within the ramp viewer.

Panels created through the api as well as default panels can be found in the `mapI.panelRegistry` array.


## Default panels
Default panels are created by the viewer and are a core part of the user experience. The following table lists all default panels and their available actions:

| id       	| description                            	| openable 	| closeable 	|
|----------	|----------------------------------------	|----------	|-----------	|
| details  	| Information about an identify request. 	| No       	| Yes       	|
| settings 	| Settings for the selected layer.       	| No       	| Yes       	|
| meta     	| Layer metadata, if available.          	| No       	| Yes       	|
| toc      	| The main legend.                       	| Yes      	| Yes       	|
| geo      	| The search functionality.              	| Yes      	| Yes       	|
| file     	| Import a file based layer.             	| Yes      	| Yes       	|
| service  	| Import a service based layer.          	| Yes      	| Yes       	|

<p align="center">
  ![](assets/images/api/panel-intro.png)Figure 1.
</p>


## Creating a panel
```js
const panelCSS = {
    top: '0px',
    left: '410px',
    right: '0px',
    bottom: '50%',
    padding: '0px 16px 16px 16px'
};

const myPanel = mapI.newPanel('panelName', panelCSS, '<div>Panel body HTML.</div>');
```

Only the first argument in `newPanel` is required (the ID of the panel). Panel CSS can also be set on `myPanel.panelContents`.

```js
myPanel.panelContents.css({
    top: '0px',
    left: '410px',
    right: '0px',
    bottom: '50%',
    padding: '0px 16px 16px 16px'
});
```

See figure 1. above which shows the rough layout of this custom panel.

## Body content
The contents of a panel body can be set with the `setBody` method which accepts either an HTML `string`, an `HTMLElement`, or a `JQuery<HTMLElement>`.

```js
myPanel.setBody('<div>Panel content. . .</div>');
```

The content is normalized to a `JQuery<HTMLElement>` and gets **compiled with Angular**. This allows you to use angular materials (https://material.angularjs.org/latest/) natively, or define and use your own angular controller.

### Custom Angular directives
You can define and use your own Angular controllers in two steps:

1. Define your controller name and function
    ```js
    mapI.agControllerRegister('MyPanelCtrl', function() {
        // controller logic goes here. . .
    })
    ```
2. Use it in your content
   ```js
   myPanel.setBody('<div ng-controller="MyPanelCtrl as ctrl">My HTML content</div>');
   ```

More information: https://angularjs.org/

## Finding by ID

You can find a panel with a given id by iterating through the `mapI.panelRegistry` array.

```js
const tocPanel = mapI.panelRegistry.find(p => p.id === 'toc');
```

## Controls
Controls appear near the top of a panel and can include action buttons, a title, and custom elements. Controls are defined as part of an array passed to the `setControls` method.


```js
myPanel.setControls('X', '<input type="text" name="searchbar">');
```

This adds two controls to the panels header - a close button and an HTML input box. The `X` is a special case along with `T` that creates a close and toggle button respectively.


## Watching a panel

You can subscribe to the following streams available on a panel instance:

| stream name     	| description                                                        	|
|-----------------	|--------------------------------------------------------------------	|
| opening         	| The panel is becoming visible.                                     	|
| closing         	| The panel is becoming invisible.                                   	|
| positionChanged 	| The position of the panel relative to the ramp viewer has changed. 	|
| widthChanged    	| The width of the panel has changed.                                	|
| heightChanged   	| The height of the panel has changed.                               	|

```js
myPanel.opening.subscribe(function() {
    console.log('My panel is opening.');
};
```

## Open / Close

```js
myPanel.open();
myPanel.close();
```