The core module is intended for **viewer specific** reusable functionality, which differs from the common module (now depreciated).

# bookmark.service.js

Encodes and decodes bookmarks. Able to provide an encoded bookmark based on the current viewer state as well as consume a bookmark, restoring state to match the provided bookmark

# config.service.js

This service is responsible for loading and parsing the supplied configuration.

# constant.service.js

As the name implies, this service should store constant values such as event names, bookmark versions, or translation names.

# core.run.js

Runs early during viewer startup, this file is mostly responsible for binding the viewers external API to the map. There are two phases here:

- preLoadApiBlock: Allows API calls to be exposed before map creation
- apiBlock: Allows API calls to be exposed after map creation

This file also initializes multi language support, and initializes RCS calls.

# debounce.service.js

Used for time limiting the rate at which a function is executed. It is useful to limit, for example, the number of clicks made on an element where there is a heavy compute cost associated with each click.

# plugin.service.js

Stores all currently registered plugins and manages a list of registered viewer components that which to be notified when a new plugin is registered.

# reload.service.js

There are instances where the viewer needs to be completely reloaded:
- A bookmark is provided
- Change of projection
- Language switch

This service handles these requests and reloads the map.

# translation.service.js

This is a custom loader implementation of [angular translate](https://angular-translate.github.io/). It is designed to support translations being added at any time, such as during plugin registration.


# formatters.filter.js

Custom angular filters can be added here. Currently this file includes:
- date formatting
- url and picture detection in strings

# graphics.service.js

Contains helper functions for working with svg and canvas objects.

# keycodes.constant.js

Often used for determining event key presses, this maps keyboard keys to their numerical values for easier readability.


***

There are three parent panel types; the main panel, the side panel, and the filters panel. Within these parent panels are child panels, such as the legend, settings, or datatables. Since multiple child panels can be open inside a parent panel, the following two files handles the animation and display of this functionality.

# statemanager.service.js

Apart from the display of panels, this service tracks the history of opened panels so that upon hitting the escape key, panels are closed in the order they were opened. Also provides useful methods for toggling panels open or closed, and allows callbacks to be registered and triggered when panels are opened/closed.

# displaymanager.service.js

As the name implies, this handles the display of panels as they are open and closed. More importantly:
- When closing a child panel with another child panel open underneath, the parent panel remains open while the child panel closes immediately.
- When a panel is closed, its data is also removed. Many watchers rely on this to signal a panel was closed.
- Handles the animation promises so that, for example, a child panel is not destroyed until after the parent panel is closed (to avoid the panel from going blank while it closes)
