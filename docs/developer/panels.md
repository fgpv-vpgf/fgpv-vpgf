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
const myPanel = mapI.createPanel('panelName');
```

## Position & size
A panels size and position are defined as a CSS style on the `panelContents` property.

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

## Content
The contents of a panel can be set via the `content` property on a panel instance. You must wrap your HTML `string`, `HTMLElement`, or `JQuery<HTMLElement>` in a panel container before assigning it to the `content` property.

```js
const content = new myPanel.container('string, HTMLElement, or JQuery<HTMLElement>')
```

This container normalizes the input into a `JQuery<HTMLElement>` and **compiles it with Angular within the viewers scope**. This allows you to use angular materials (https://material.angularjs.org/latest/) natively, or define and use your own angular controller.

```js
myPanel.content = new myPanel.container('<div>My HTML content</div>');
```

### Custom Angular directives
Since panel content is passed through an angular compiler (version 1) you can define and use your own controllers. There are two steps required to use a custom controller.

1. Define your controller name and function
    ```js
    mapI.agControllerRegister('MyPanelCtrl', function() {
        // controller logic goes here. . .
    })
    ```
2. Use it in your content
   ```js
    myPanel.content = new myPanel.container('<div ng-controller="MyPanelCtrl as ctrl">My HTML content</div>');
   ```

More information: https://angularjs.org/

## Finding by ID

You can find a panel with a given id by iterating through the `mapI.panelRegistry` array.

```js
const tocPanel = mapI.panelRegistry.find(p => p.id === 'toc');
```

## Controls
Controls appear near the top of a panel and can include action buttons, a title, and custom elements. Controls are defined as part of an array on the `controls` property of a panel instance. 


```js
myPanel.controls = ['X', new myPanel.container('<input type="text" name="searchbar">')];
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