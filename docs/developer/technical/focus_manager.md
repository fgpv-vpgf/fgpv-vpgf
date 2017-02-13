### Focus Management

To be accessible and WCAG 2 compliant, the viewer needs to support keyboard users as well as mice-wielding ones (by extension, dual-class power users who use both devices also need to be thought of). The focus manager is therefore responsible for allowing users to navigate through the viewer seamlessly, making content easy to reach no matter what input device is used.

#### Important concepts you should know

Before we go into how it works, there are some key concepts you'll need to be aware of that affect all parts of the viewer:

- The `$rootElement` has an `rv-trap-focus` property set in `bootstrap.js` (more on this later)
- Any element which is not a descendent of `$rootElement` but should be considered a part of the viewer must have an `rv-trap-focus` property set with a value equal to the `$rootElement` id property
- The javascript prototype functions `focus`, `preventDefault`, `stopPropagation`, and `stopImmediatePropagation` are disabled for all elements and descendents of an `rv-trap-focus`.
    - To set focus, use `focusService.setFocus(myElement)`
    - `preventDefault`, `stopPropagation`, and `stopImmediatePropagation` can be used by passing an extra parameter `true` as in `$('#myElement').preventDefault(true)`. You should never prevent or stop the bubbling of `mousedown`,`keydown` or `keyup` as they are needed for the focus manager to work effectively.
- The tabindex of all focusable elements inside the viewer (except for the map) is set to -1. You should not set or rely on tabindex for proper tab order.

#### rv-trap-focus

An element with this property ensures that focus will not leave, unless the element itself is destroyed or hidden. When the last element is reached and the `tab` key is pressed the first focusable element is focused. 

#### How it works

When focus reaches the viewer in an embedded page, a dialog appears asking if the user would like to enter the viewer, or provides the option to skip over it. In full screen viewers, or when navigated to by mouse, the viewer is activated automatically. If the user chooses to skip the viewer, the tab key moves focus to the next element outside the viewer. Since all viewer elements have a tabindex of `-1`, this is handled natively by the browser itself. If the user chooses to enter the viewer, the focus manager intercepts all tab key presses and handles the focus movement.

It's common for focused elements to be destroyed or hidden during normal viewer use such as when a panel is closed or a menu disappears. When this happens, the last known focusable element is automatically focused. 

To escape the viewer the user must press `escape` + `tab`. This disables focus management and the tab key naturally moves to the next focusable element outside the viewer. Mouse clicking outside the viewer also disables it.

#### When to use the focus manager

There are two instances you should use the focus manager:

- When a user action (like a click or keypress) changes the viewer and you'd like focus moved to some other area of the viewer. A common scenario is when a dialog opens and you'd like focus moved to the close button.
- When you want to override the default focus movement behaviour between two elements. This is done automatically in table of contents when you select `settings` and the settings panel opens. A link between the toc layer and the setting panel has been created. 