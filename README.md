# Plugins

This repo contains plugins for the RAMP viewer built by the core team.

## Updating node_modules

This repo contains a master **node_modules** folder as well as an individual one for each plugin to keep things tidy. Run the command `npm run update` to install/update all module folders.

## Testing code locally with sample files

`npm run serve` will start the dev server. Open a browser and input address **http://localhost:6001**.

Any static file in `areaOfInterest/samples`, `enhancedTable/samples`, or `libs` can be accessed by appending its name to the url, such as **http://localhost:6001/et-index.html**.

## Building distribution files

`npm run build` will output all plugins to the `dist` folder.

## libs/ramp

Samples include the RAMP viewer files found in the **libs/ramp** folder. Please update these files if you have made changes in RAMP.
