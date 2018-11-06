# Plugins

This repo contains plugins for the RAMP viewer built by the core team.

## Contributing

We use the fork and pull model for contributions. Commits pushed to your forked repo are built using travis-ci.org and deployed as a GitHub page.

For example, commit `5ea8ac3126957a8d2999ea4f9fed209e6080b935` would be deployed to https://your_github_username.github.io/plugins/5ea8ac3126957a8d2999ea4f9fed209e6080b935

Steps to get started:

1. Fork this repo
2. Run `npm run init`
3. Create a **personal access token** on GitHub with the `repo` top level scope selected.
4. Sign in to travis-ci.org with your GitHub account
5. Activate travis on the forked repo by visiting https://travis-ci.org/your_github_username/plugins
6. On the travis settings page (https://travis-ci.org/your_github_username/plugins/settings) create an environment variable named `GITHUB_TOKEN` and the value being your GitHub access token.
    > travis-ci uses this token to deploy the build back to your forked repo. It is not accessible outside of travis-ci

This repo contains a master **node_modules** folder as well as an individual one for each plugin to keep things tidy. Run the command `npm run update` often to install/update all module folders.

## Run code locally with sample files

`npm run serve` will start the dev server. Open a browser and input address **http://localhost:6001**.

Example: **http://http://localhost:6001/enhancedTable/samples/et-index.html**.

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

## bin/test/ramp

Samples include the RAMP viewer files found in the **bin/test/ramp** folder. Please update these files if you have made changes in RAMP.
