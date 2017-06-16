This page is intended to help you assess the usefulness of this library for your project. It outlines our development goals, the libraries we use, and a brief introduction to the core components of the viewer itself.

## Design Goals

1. Accessible
  - Conforms to WCAG 2.0 level AA
  - Supports a wide variety of browsers (IE 11+, Firefox, and Chrome)
  - Mobile and tablet friendly design

2. Customizable
  - Config file lets you customize most aspects of the viewer
  - Plugin support allows functionality to be added without modifying project code
  - External API gives access to viewer data which can be used in plugins or on the host page
  - Easy to embed multiple maps in a page or have one take up the entire screen

3. Open Source
  - Project [managed on GitHub](https://github.com/fgpv-vpgf/fgpv-vpgf)
  - External contributions are welcome
  - Easy to report issues and suggestions as well as search existing ones

4. Easy to use and setup
  - Intuitive layout with context aware controls
  - Touch support available for iOS, Android and others
  - Include one JavaScript file on your page and copy/paste a few lines of code to get started

## Implementation

### Notable Viewer Libraries Used

- [AngularJS](https://angularjs.org/)
- [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/)
- [jQuery](https://jquery.com/)
- [DataTables](https://datatables.net/)
- [Angular Materials](https://material.angularjs.org/latest/)


### Project Tools

- [NodeJS](https://nodejs.org/en/)
- [Webpack](https://webpack.github.io/)
- [SASS](http://sass-lang.com/)

## Putting it all together

![](./images/overall_architecture.png)

This is only an overview, you should also read the {@tutorial modules} page for a more detailed look into each component.
