---
nav: technical
---

# High Level Architecture Summary

<p align="center">
  ![](assets/images/overall_architecture_v3.png)Figure 1.
</p>

## RAMP Application

The RAMP Core Application consists of the primary codebase to run the application and manage the user interface on the host webpage.

This is an Angular application (v1.7.5), with the majority of the code being JS ES6 flavour.

### Core Modules

These modules contain things that are key to the application, and are generally used application-wide. Examples include application loading, state management, and configuration management.  It can also be home to modules that don't fit in any of the other specialized areas, such as the bookmarking service.

### Geo Modules

These modules contain things related to the geographic aspects of the application client. Generally speaking, these modules should be interacting with `GeoAPI` and classes defined there.

### Layout Modules

These modules contain things related to the physical layout of the application on the page.

### UI Modules

These modules contain things related to the inteface of the various elements of the application, and the logic to manage their state and function. Here you will find the majority of the Angular directives.

## RAMP API

This contains the classes and logic to allow the host page to interact with the RAMP application in a controlled manner.

These modules are written in Typescript.

### Legacy API

This is the older API that was officially supported in versions of RAMP prior to `v3.0.0`. It remains functional to facilitate migration to `v3`, but will be decomissioned at `v3.1.0`

## RAMP Features

This contains plugins that come pre-bundled with RAMP. Think of them as default plugins for items that are considered essential or highly desirable in most sites.

These modules are written in Typescript.

## Other RAMP Items

### RAMP Scripts

Contains various scripts related to application build and upgrading older formats to the current application.

### RAMP Content

This contains images and fonts used by the application, as well as sample pages and configurations which are used for application testing.

### RAMP Docs

Contains the online documentation source. The content is in markdown and html formats.

### RAMP Locales

Contains locale specific information. Primarily all the application text, but also can contain Help and About screen content.

## GeoAPI

This library acts as a wrapper to the various geospatial libraries and APIs used to power RAMP. It exists as a separate codebase, but is primarily written to be consumed by RAMP. It generally provides stateless functions and classes that the core viewer can instantiate.

It is written in JS ES6.

## Library Comparison Chart

| Library       | Location                                                                   | Framework                               | Flavour    | Owner                      |
|---------------|----------------------------------------------------------------------------|-----------------------------------------|------------|----------------------------|
| RAMP Core     | [Github fgpv-vpgf](https://github.com/fgpv-vpgf/fgpv-vpgf/tree/master/src) | [Angular 1.7.5](https://angularjs.org/) | JS ES6     | RAMP                       |
| RAMP API      | [Github fgpv-vpgf](https://github.com/fgpv-vpgf/fgpv-vpgf/tree/master/api) |                                         | TypeScript | RAMP                       |
| GeoAPI        | [Github geoApi](https://github.com/fgpv-vpgf/geoApi)                       |                                         | JS ES6     | RAMP                       |
| ESRI JS API   | [js.arcgis.com](https://developers.arcgis.com/javascript/3/)               | [DOJO](https://dojotoolkit.org/)        | JS         | [ESRI](https://esri.ca)    |
| Plugins       | [Github plugins](https://github.com/fgpv-vpgf/plugins)                     |                                         | TypeScript | RAMP                       |
| External Libs | [npm](https://www.npmjs.com/)                                              |                                         | JS         | [Node](https://nodejs.org) |
| Build Tool    | [Github fgpv-vpgf](https://github.com/fgpv-vpgf/fgpv-vpgf)                 | [Webpack](https://webpack.js.org/)      | JSON       | RAMP                       |
