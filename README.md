# fgpv-vpgf

[![Join the chat at https://gitter.im/fgpv-vpgf/fgpv-vpgf](https://img.shields.io/badge/GITTER-join%20chat-green.svg?style=flat-square)](https://gitter.im/fgpv-vpgf/fgpv-vpgf?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Code Climate](https://codeclimate.com/github/fgpv-vpgf/fgpv-vpgf/badges/gpa.svg)](https://codeclimate.com/github/fgpv-vpgf/fgpv-vpgf)
[![Issue Count](https://codeclimate.com/github/fgpv-vpgf/fgpv-vpgf/badges/issue_count.svg)](https://codeclimate.com/github/fgpv-vpgf/fgpv-vpgf)

[![Dependency Status](https://david-dm.org/fgpv-vpgf/fgpv-vpgf.svg?style=flat-square)](https://david-dm.org/fgpv-vpgf/fgpv-vpgf)
[![devDependency Status](https://david-dm.org/fgpv-vpgf/fgpv-vpgf/dev-status.svg?style=flat-square)](https://david-dm.org/fgpv-vpgf/fgpv-vpgf#info=devDependencies)

Federal Geospatial Platform Visualiser / Visualisateur pour la Plateforme géospatiale fédérale

## Getting Started

Requirements:

- [NodeJS](https://nodejs.org/)

Running a local build:

0. Checkout the repo
0. Switch to the develop branch (master is for stable, released code)
0. Run `npm install` to install dependencies
0. Run `npm run serve` to build and launch a dev server

We use a fork and pull model for contributions, see our [contributing guidelines](https://github.com/fgpv-vpgf/fgpv-vpgf/blob/develop/CONTRIBUTING.md) for more details.

### [Interactive Schema Documentation](https://fgpv-vpgf.github.io/schema-to-docs/)

### Generating Local Builds

- `npm run build`

    Builds development code and places it in the `build` directory. Performs eslint, SASS -> CSS, and babel compilation

- `npm run build -- --env.prod`

    Builds production code and places it in the `build` directory. Performs same steps as development builds, but also places a zipped file of the build in the `dist` directory.


### Serving Development Code

- `npm run serve`

    Serves the development code. Reloads on file change.

- `npm run serve -- --env.prod`

    Serves the production code. Reloads on file change.

### Optional Flags

To run these flags, prefix with `--` then `--env.` as in `npm run serve -- --env.prod` where `prod` is a flag.

- `geoLocal`
    Replaces geoApi from npm node_module with a local geoApi repo folder located by ../geoApi

- `geoLocal="path/to/geoApi"`
    Same as no argument `geoLocal` but uses the provided path to local folder

- `useMap`
    Creates full independent source maps files for `development` code only. Build time will increase.
