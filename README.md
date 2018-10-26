# Plugins

This repo contains plugins for the RAMP viewer built by the core team.

## Installing/Updating node_modules

This repo contains a master **node_modules** folder as well as an individual one for each plugin to keep things tidy. Run the command `npm run update` to install/update all module folders.

## Run code locally with sample files

`npm run serve` will start the dev server. Open a browser and input address **http://localhost:6001**.

Any static file in `areaOfInterest/samples`, `enhancedTable/samples`, or `libs` can be accessed by appending its name to the url, such as **http://localhost:6001/et-index.html**.

## Run local selenium test suite

`npm run test` will start the selenium server included with this repo. To ensure selenium has been installed correctly run the `npm run update` command.

## Writing tests

Tests follow the [Page Object Pattern](https://martinfowler.com/bliki/PageObject.html). General page information not related to a plugin can go inside `tests/ramp.page.js`. Specific page information for a plugin goes into the page file in the plugins `tests` directory. Any file in a plugins `tests` directory that end with a `.spec.js` will be tested.

The testing framework is [Jasmine](https://jasmine.github.io/tutorials/your_first_suite.html). Selenium bindings to individual browsers are handled by [webdriverio](http://webdriver.io/api.html). Currently tests are only executed in Chrome with more browsers to be added soon.

Webdriver: http://webdriver.io/api.html
Jasmine: https://jasmine.github.io/tutorials/your_first_suite.html
PageObject: https://martinfowler.com/bliki/PageObject.html

## Building distribution files

`npm run build` will output all plugins to the `dist` folder.

## libs/ramp

Samples include the RAMP viewer files found in the **libs/ramp** folder. Please update these files if you have made changes in RAMP.
