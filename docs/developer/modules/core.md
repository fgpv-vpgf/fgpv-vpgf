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

