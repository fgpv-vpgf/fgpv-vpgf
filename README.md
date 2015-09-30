# fgpv-vpgf

[![Join the chat at https://gitter.im/fgpv-vpgf/fgpv-vpgf](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/fgpv-vpgf/fgpv-vpgf?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Federal Geospatial Platform Visualiser / Visualisateur pour la Plateforme géospatiale fédérale

## Getting Started

Requirements:

- [NodeJS](https://nodejs.org/)
- Bower `npm install -g bower`
- Gulp `npm install -g gulp`

Running a local build:

0. Checkout the repo
0. Switch to the develop branch (master is for stable, released code)
0. Run `npm install` to install dependencies
0. Run `gulp serve` to build and launch a dev server

We use a fork and pull model for contributions, see our [contributing guidelines](https://github.com/fgpv-vpgf/fgpv-vpgf/blob/develop/CONTRIBUTING.md) for more details.

## Gulp Tasks

### Code Analysis

- `gulp vet`

    Performs static code analysis on all javascript files. Runs jshint and jscs.

- `gulp vet --verbose`

    Displays all files affected and extended information about the code analysis.

- `gulp plato`

    Performs code analysis using plato on all javascript files. Plato generates a report in the reports folder.

### Testing

- `gulp test`

    Runs all unit tests using karma runner, jasmine, and sinon with phantomjs. Depends on vet task, for code analysis. Can specify additional browser to run tests in karma.config.js.

- `gulp test --coverage`

    Additionally generates a test coverage report.

- `gulp test:auto`

    Runs a watch to run all unit tests.

### Cleaning Up

- `gulp clean`

    Remove all files from the build and temp folders.

- `gulp clean-sass`

    Remove all styles from the temp folder.

### Styles

- `gulp sass`

    Compile sass files to CSS, add vendor prefixes, and copy to the temp folder.

### Serving Development Code

- `gulp serve:dev`

    Serves the development code. The goal of building for development is to do it as fast as possible, to keep development moving efficiently. This task vet JS code and serves all code from the source folders and compiles SASS to CSS in a temp folder. Reload on file change.

- `gulp serve:dev --test`

    Runs unit tests on file change as well.
