// GLOBAL VENDOR IMPORTS
// import 'jquery';
import 'angular';
import 'angular-aria';
import 'angular-animate';
import 'angular-material';
import 'angular-messages';
import 'angular-sanitize';
import 'angular-translate';
import 'dotjem-angular-tree/src/directives/dxTree.js';
import 'angular-translate-loader-static-files';
import 'gsap/TweenLite.js';
import 'gsap/TimelineLite.js';
import 'gsap/CSSPlugin.js';
import 'gsap/EaselPlugin.js';
import 'gsap/ScrollToPlugin.js';
import 'script-loader!datatables.net';
import 'script-loader!datatables.net-buttons';
import 'script-loader!datatables.net-buttons/js/buttons.html5.js';
import 'script-loader!datatables.net-buttons/js/buttons.print.js';
import 'script-loader!datatables.net-colreorder';
import 'script-loader!datatables.net-scroller';
import 'script-loader!datatables.net-select';

// APPLICATION MAIN IMPORTS
import './api-loader';
import './app-seed';
import './global-registry.js';
import './geo/geo.module.js';
import './core/core.module.js';
import './layout/layout.module.js';
import './ui/ui.module.js';
import './ui/ui-loader.js';
import './core/core-loader.js';
import './geo/geo-loader.js';
import './layout/layout-loader.js';
import './app.module.js';
import './focus-manager.js';
import '../plugins/core/back-to-cart.js';
import '../plugins/core/coord-info.js';
import '../content/styles/main.scss';


// HACKS
// hoverintent is a function consuming the jQuery object where it adds a prototype method hoverIntent.
import hoverintent from 'jquery-hoverintent';
hoverintent($);
