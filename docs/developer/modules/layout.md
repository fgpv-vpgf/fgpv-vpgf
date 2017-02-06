This module handles the layout of the application, application-wide state transitions, and events.

## animation.service.js

Wraps most GSAP (GreenSock Animation Platform) based animations so that for IE or touch devices, the animation time frame is set to almost zero to improve performance.

## layout.service.js

Primarily useful for its `currentLayout` method which returns the string `small`, `medium`, or `large` depending on the viewers width. This is then used to determine what type of layout to display, such as mobile, tablet, or desktop layouts.

## shell.directive.js

A directive which covers all visible parts of the layout. This directive is also executed before any others. 

## tooltip.decorator.js

Changes the default angular material tooltip behavior such that when touch mode is activated, tooltips are hidden except for long presses. 