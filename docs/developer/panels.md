# Panels

The **panels** API allows you to **create**, **control**, and **watch** panels within the RAMP viewer. Any content not a part of the visual map is in a panel.

## Types

There are three different types of panel:

1. **Dialog** - Opens over all other panels and disables all interaction with the viewer (via a transparent backdrop).
   > these are best for getting the immediate attention of a user - either to act on the information provided in the panel, or to input information required by you.
2. **Closeable** - Has a close button in its header, opens over **persistent** panels and under a dialog.
   > this is the most common panel type. It has a wide range of uses, and allows the user to close it when not needed. A good use case is for displaying intermittent data such as an identify click result.
3. **Persistent** - Has no close button in its header, opens under all other panel types.
   > great for relaying a constant stream of information to the user, such as providing geographic coordinates of a clicked map point. It is also the perfect spot for interactive map controls like a time slider (for time enabled layers).

## Create

First we'll create a new panel instance:

```js
var myPanel = mapI.panels.create('uniquePanelID');
```

### Adding content

Next we add some content:

```js
myPanel.body = '<div><h3>Hello!</h3><md-button id="mypanel-btn1" class="md-raised md-primary">Click me!</md-button></div>';
```

<p class="warning">
  The panel body must only have one top level element. In the example above the `h3` and `md-button` elements are wrapped in a `div` element. This is required by the angular compiler to properly render multiple directives (like `md-button`) in a given element.

  To learn more about the Angular v1.7.5 compiler please see: https://docs.angularjs.org/api/ng/service/$compile (very bottom of page)
</p>

### Open

If we do nothing else and run `myPanel.open()` you'll be greeted to a **dialog** panel.

### Persistent

The reason our panel is a dialog panel is because we didn't define a position for it. Since RAMP doesn't know where we'd like our panel to appear, or how wide/tall it should be, it opens it as a standard sized **dialog** panel.

Let's set a position for our panel then proceed to open it:

```js
myPanel.element.css({
  top: '0px',
  left: '410px',
  bottom: '50%',
  width: '600px'
});

myPanel.open();
```

Now our panel appears next to the legend panel, taking up half the viewers height, and a width of 600 pixels. Setting any one of `top`, `bottom`, `left`, `right`, `width`, or `height` css properties turns a panel from a dialog type to a persistent or closeable type.

### Closeable

There's one last thing we need to do if we'd like to make our panel closeable by the user:

```js
var closeBtn = myPanel.header.closeButton;
```

That's it! `closeBtn` is a `JQuery<HTMLElement>` type, which means you can also listen for custom events:

```js
closeBtn.on('click', function() {
  // ... do something with the click
});
```

Note: The panel is closed automatically when the close button is clicked, so you don't have to add that logic manually.

### Toggleable

To add a toggle button (hide/show panel body) to the header add this:

```js
var toggleBtn = myPanel.header.toggleButton;
```

## Control

### Custom header buttons

Of course you can also define your own header controls:

```js
const customBtn = new myPanel.Button('Custom Btn');

customBtn.$.on('click', function() {
    window.alert('You clicked the custom button!');
});

myPanel.header.append(customBtn);
```

Instead of `append` you can also `prepend`.

<p class="tip">
  Don't forget the `$` (or `element`) after `customBtn`! That's how you access the `JQuery<HTMLElement>` instead of the panel button class instance.
</p>

### Header title

To display a title in the panel header simply do: `myPanel.header.title = 'Some Title';`. You can also use translated text with `myPanel.header.title = '{{ 'plugins.myPluginName.panelTitle' | translate }}';`

### Keep panel open on offscreen

If your panel ever renders partially or fully outside the viewport, the default behaviour is to close the panel - **regardless of panel type**. This can happen either immediately when a panel is opened (its position is outside the viewer) or when a user resizes their window.

You can disable this so that your panel is always open with:

```js
myPanel.allowOffscreen = true;
```

### Close panel on overlay

It's possible the spot you've chosen for your panel conflicts with another panel which may or may not be open (or even created) when you go to open your panel. The default behaviour is to keep your panel open when another panel renders either partially or fully over yours.

To change this default behaviour:

```js
myPanel.allowUnderlay = false;
```

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
   myPanel.body = '<div ng-controller="MyPanelCtrl as ctrl">My HTML content</div>';
   ```

More information: https://angularjs.org/

### Finding by ID

You can find a panel with a given id by iterating through the `mapI.panels` array.

```js
const myPanel = mapI.panels.find(p => p.id === 'uniquePanelID');
```

### Closing & destroying

You can close a panel with `myPanel.close();`. If you don't plan on re-opening the panel, you should also call `myPanel.destroy();` which removes the panel from the dom, the panel list, and helps keep the ramp viewer performant. Once a panel is destroyed it cannot be opened again.

## Watch

You can subscribe to an individual panels opening and closing observable events:

```js
myPanel.opening.subscribe(function() {
    console.log('My panel is opening.');
};

myPanel.closing.subscribe(function() {
    console.log('My panel is closing.');
};
```

You can also subscribe to all panels opening and closing observable events:

```js
mapI.panelOpened.subscribe(function(panel) {
    console.log(`A panel with ID ${panel.id} is opening.`);
};

mapI.panelClosed.subscribe(function(response) {
    console.log(`A panel with ID ${response.panel.id} is closing.`);
};
```

### Closing response

When a panel is **opened** subscribers are given the opening panel instance. When a panel is **closed** however, it might not always be clear as to why. It could be that the user resized their window, and now your panel is offscreen. It could be that another panel opened over your panel. You may want to intervene in certain situations or handle the closing differently. For these reasons, closing subscribers will receive an object with the following interface:

```ts
  interface ClosingResponse {
    code: CLOSING_CODES;
    panel: Panel;
    otherPanel?: Panel;
}
```

The following are valid `CLOSING_CODES`:

```ts
enum CLOSING_CODES {
    OFFSCREEN = 'offscreen',
    OVERLAID = 'overlaid',
    CLOSEBTN = 'closebtn',
    CLICKEDOUTSIDE = 'clickedoutside',
    OTHER = 'other'
};
```

The `panel` property is the closing panel instance. The `otherPanel`, if defined, is another panel instance that is responsible for your panel closing. It is defined when the error code is `overlaid`, providing the overlaying panel instance. It may also be defined for `other` code.