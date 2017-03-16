### Focus Management

To be accessible and WCAG 2 compliant, the viewer needs to support keyboard users as well as mice-wielding ones (by extension, dual-class power users who use both devices also need to be thought of). The focus manager is therefore responsible for allowing users to navigate through the viewer seamlessly, making content easy to reach no matter what input device is used.

### Element Attributes

| Name | Description |
| **** | *********** |
| rv-trap-focus         |  Once focus enters an element or child of this element, focus movement is restricted within it. If focus is at the end of the trap, it is moved to the first focusable element in the trap. Focus can only leave if the focus manager is disabled, or the entire trapped element is not focusabled (i.e. is hidden, destroyed). The value must be the viewers HTML id. This can be used on elements whos HTML is rendered outside the viewers HTML so that focus manager includes it as part of the viewers focus movement flow.
| rv-focus-status       |  Added to the main viewer HTML element with a value of either NONE, INACTIVE, WAITING, ACTIVE to signify the current focus state of the viewer. This is useful for outside libraries to see the current state of any given viewer.
| rv-ignore-focusout    |  Normally the focus manager attempts to recover from a loss of focus by moving back through its history. This attribute disables this behaviour so no recovery is initiated.
| rv-focus-init         |  Allows the use of focus() on the viewer element with this attribute or any of its children if focus is not current on the element or any of its children. This allows outside libraries to set initial focus normally, yet restricts them on subsequent movement attempts.
| rv-focus-member | Declares an element and all its children are a part of the viewer. Unlike rv-focus-trap, focus is not trapped inside these elements. The most common use case is for elements rendered outside the viewers DOM structure where we do not want to control focus - we only wish to recognize that it is a part of the viewer so that action taken within it do not deactivate the focus manager.  |


#### Important concepts you should know

Before we go into how it works, there are some key concepts you'll need to be aware of that affect all parts of the viewer:

- The `$rootElement` has an `rv-trap-focus` property set in `bootstrap.js` (more on this later)
- Any element which is not a descendent of `$rootElement` but should be considered a part of the viewer must have an `rv-trap-focus` property set with a value equal to the `$rootElement` id property
- The javascript prototype functions `focus`, `preventDefault`, `stopPropagation`, and `stopImmediatePropagation` are disabled for all elements and descendents of an `rv-trap-focus`.
    - To set focus, use `element.rvFocus()`
    - `preventDefault`, `stopPropagation`, and `stopImmediatePropagation` can be used by passing an extra parameter `true` as in `element.preventDefault(true)`. You should never prevent or stop the bubbling of `mousedown`,`keydown` or `keyup` as they are needed for the focus manager to work effectively.
- The tabindex of all browser focusable elements inside a viewer is set to -1. You should not set or rely on tabindex for proper tab order.
- A tabindex of -2 is a special value which indicates that the viewer element is focusable.
- A tabindex of -3 is a special value which indicates that the viewer element is not only focusable, it is focusable through the focus() prototype property which is usually restricted. This is useful for granting outside libraries focus access to a specific element.

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