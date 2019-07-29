# Plugins ![](https://img.shields.io/npm/v/@fgpv/rv-plugins.svg)

Plugins for [RAMP](https://github.com/fgpv-vpgf/fgpv-vpgf) supported by the core developer team.

## Documentation

https://fgpv-vpgf.github.io/plugins/master/docs/#/

## Local Development

1. Run `npm link path/to/plugins/folder` from within your RAMP folder.
2. When you're done making changes to plugins, run `npm run build` from within the plugins repo.
3. Start the RAMP dev server by running `npm run serve` from within the RAMP repo.

Repeat steps 2 & 3 whenever you've made changes to plugin code, then reload the page.

All plugin samples can be found at **http://localhost:6001/samples/plugins** while the RAMP dev server is running.

You can unlink at any time `npm unlink @fgpv/rv-plugins`

## Publishing a release

`npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease]` will create a version commit and tag then push the tag `upstream` for publishing to npm.

## Build distribution files

`npm run build` will output all plugins to the `dist` folder.

## RAMP viewer code

Samples and automated testing use the ramp viewer code found in `bin/test/ramp`.

## Contributing

This project uses the fork and pull model. Once forked, run `npm i` from the project root directory to setup for first time use.

### Running locally

`npm run serve` will start a dev server. Open a browser and navigate to **http://localhost:6001**.

Example: **http://http://localhost:6001/enhancedTable/samples/et-index.html**.

### Testing locally

`npm run test` will start a local selenium server and run tests in Chrome.

### Writing tests

Tests follow the [Page Object Pattern](https://martinfowler.com/bliki/PageObject.html). General page information not related to a plugin can go inside `bin/test/ramp.page.js`. Specific page information for a plugin goes into the page file in the plugins `tests` directory. Any file in a plugins `tests` directory that end with a `.spec.js` will be tested.

The testing framework is [Jasmine](https://jasmine.github.io/tutorials/your_first_suite.html). Selenium bindings to individual browsers are handled by [webdriverio](http://webdriver.io/api.html). Currently tests are only executed in Chrome locally, however cloud testing will be more rigorous.

Webdriver: http://webdriver.io/api.html
Jasmine: https://jasmine.github.io/tutorials/your_first_suite.html
PageObject: https://martinfowler.com/bliki/PageObject.html

## Hosted builds

Commits pushed to your forked repo can be built using travis-ci.org and deployed as a GitHub page. For example, commit `5ea8ac3126957a8d2999ea4f9fed209e6080b935` would be deployed to https://your_github_username.github.io/plugins/5ea8ac3126957a8d2999ea4f9fed209e6080b935.

There are a few steps you'll need to make for this to work:

Steps to get started:

1. Create a **personal access token** on GitHub with the `repo` scope selected.
2. Sign in to travis-ci.org with your GitHub account
3. Activate travis on your (forked) repo by visiting: https://travis-ci.org/your_github_username/plugins
4. On the travis settings page (https://travis-ci.org/your_github_username/plugins/settings) create an environment variable named `GITHUB_TOKEN` with the value of your GitHub access token.
    > travis-ci uses this token to deploy the build back to your forked repo. It is not accessible outside of travis-ci and remains private.
