---
nav: dev
---

# A guide for developers

This guide is intended for web developers who are interested in using the RAMP API to modify or develop new functionality for the RAMP viewer and for map authors who want to customize RAMP or the host page for their own needs. 

This guide will first outline any required or optional knowledge you should have before getting started. After that we'll cover some **basic RAMP concepts** you should know, introduce the **RAMP API** and the concept of **RAMP plugins**. We'll finish this introduction with a look at the various UI components and their names. We recommend you read this entire page so that you'll have a basic understanding of the major parts of RAMP and how to continue reading these docs on more advanced topics that pertain to your interests and project requirements. 

## Knowledge needed

This guide assumes you have a moderate to advanced level of **JavaScript** experience and have worked with **HTML** and **CSS**. 

You'll also benefit with basic knowledge of **jQuery** and **RxJS**. 

> It's ok if you've never heard of RxJS - it's a type of event system the RAMP API uses. The only RxJS concept you need to know is **subscribing to observables** (see link below). 

Finally, the RAMP API, plugins, and the technical documentation are all written in **TypeScript** - a superset of typed JavaScript that compiles to plain JavaScript. While you don't have to use TypeScript yourself, it helps to be able to read TypeScript code when looking at examples and referencing our plugin repo code.

Resources:

- jQuery: https://api.jquery.com/
- TypeScript in 5 minutes: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
- RxJS Subscription: http://reactivex.io/rxjs/manual/overview.html#subscription

## Basic RAMP concepts

### Host page

A host page is an HTML webpage which displays one or more RAMP viewers. At a minimum it must:
- include the jQuery v3+ library (https://jquery.com/download/)
- include the **rv-main.js** and **rv-styles.css** RAMP files (available for download on our releases: https://github.com/fgpv-vpgf/fgpv-vpgf/releases)
- contains all necessary browser polyfills for whichever browsers you wish to support
- contain one or more ramp map elements each with a:
  - property `is="rv-map"` which RAMP uses as an element locator to initialize a viewer instance
  - property `rv-config="path to config json"` with the value being a source path to the RAMP configuration file


### Config file and schema

The host pages RAMP element(s) must define an `rv-config` property which contains a source url to the maps config file. This source url can contain `[lang]` which RAMP replaces with the currently active language identifier, usually **en-CA** or **fr-CA**. So `rv-config="config.[lang].json"` would cause RAMP to fetch a **config.en-CA.json** file for an english version of the map and **config.fr-CA.json** for french in the same directory as the host page.

A schema file is available in our GitHub repo (https://github.com/fgpv-vpgf/fgpv-vpgf/blob/master/schema.json). Be sure to select the correct branch/tag in GitHub for the version of RAMP you'll be using. You can use this file as a general reference for all available options or to be fed into an automated schema validator tool.


## API introduction

TODO: [Documentation: API Introduction #3277](https://github.com/fgpv-vpgf/fgpv-vpgf/issues/3277)

## Plugin introduction

TODO: [Documentation: Plugins Introduction #3279](https://github.com/fgpv-vpgf/fgpv-vpgf/issues/3279)

## Terminology and UI component diagram

TODO: [Need to have a UI component breakdown with terminology #972](https://github.com/fgpv-vpgf/fgpv-vpgf/issues/972)

## Legacy API

TODO: [Documentation: Legacy API Notes #3280](https://github.com/fgpv-vpgf/fgpv-vpgf/issues/3280)