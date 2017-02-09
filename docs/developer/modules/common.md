The common module has a mix of functionality that is used in various other modules. You should add **generic** functionality in this module if it could be used by 2 or more other modules.

# formatters.filter.js

Custom angular filters can be added here. Currently this file includes date formatting and url detection in strings.

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