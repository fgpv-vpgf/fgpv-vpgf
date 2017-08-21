const templateUrl = require('./theme-selector.html');

/**
 * @module rvSidenav
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvSidenav` directive displays a basemap selector. Its template uses a content pane which is loaded into the `other` panel opening on the right side of the screen. Selector groups basemaps by projection.
 *
 */
angular
    .module('app.ui')
    .directive('rvThemeSelector', rvThemeSelector);

function rvThemeSelector() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: {},
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;
}

function Controller(sideNavigationService, version, configService, $mdSidenav, $rootScope, themeService) {
    'ngInject';
    const self = this;
    const ref = {
        themes: [
            {
                name: 'Extreme Weather',
                image: 'https://i.imgur.com/W6NAXiy.png',
                description: 'Extreme weather includes unexpected, unusual, unpredictable severe or unseasonal weather; weather at the extremes of the historical distribution—the range that has been seen in the past.',
                items: [
                    'Summer Days',
                    'Coldest Minumim Temperature',
                    'Warmest Maximum Temperature',
                    'Tropical Nights',
                    'Very Hot Days (+30C)',
                    'Very Cold Days (-30C)'
                ],
                action: themeService.showExtreme,
                expanded: false
            },
            {
                name: 'Temperature',
                image: 'https://i.imgur.com/LXfLifi.png',
                description: 'Extreme weather includes unexpected, unusual, unpredictable severe or unseasonal weather; weather at the extremes of the historical distribution—the range that has been seen in the past.',
                items: [
                    'Minimum Temperature',
                    'Maximum Temperature',
                    'Mean Temperature'
                ],
                action: themeService.showTemp,
                expanded: false
            },
            {
                name: 'Precipitation',
                image: 'https://i.imgur.com/rsRbpaZ.png',
                description: 'Extreme weather includes unexpected, unusual, unpredictable severe or unseasonal weather; weather at the extremes of the historical distribution—the range that has been seen in the past.',
                items: [
                    'Heavy Precipitation Days (20mm)',
                    'Heavy Precipitation Days (10mm)',
                    'Precipitation'
                ],
                action: themeService.showPrecipitation,
                expanded: false
            },
            {
                name: 'Agricultural',
                image: 'https://i.imgur.com/UbTvtBW.png',
                description: 'Extreme weather includes unexpected, unusual, unpredictable severe or unseasonal weather; weather at the extremes of the historical distribution—the range that has been seen in the past.',
                items: [
                    'Moisture Budget',
                    'Evapotranspiration',
                    'Growing Degree Days (Base 15 °C)',
                    'Growing Degree Days (Base 10 °C)',
                    'Growing Degree Days (Base 5 °C)',
                    'Potato Days',
                    'Corn Heat Units',
                    'Date of Last Spring Frost',
                    'Date of First Fall Frost',
                    'Frost-Free Season'
                ],
                action: themeService.showAgriculture,
                expanded: false
            },
            {
                name: 'Engineering',
                image: 'https://i.imgur.com/Dsfhj36.png',
                description: 'Extreme weather includes unexpected, unusual, unpredictable severe or unseasonal weather; weather at the extremes of the historical distribution—the range that has been seen in the past.',
                items: [
                    'Cooling Degree Days',
                    'Icing Days',
                    'Frost Days',
                    'Freeze-Thaw Days'
                ],
                action: themeService.showEngineering,
                expanded: false
            },
            {
                name: 'Historical Trends',
                image: 'https://i.imgur.com/1vYyzdR.png',
                description: 'Extreme weather includes unexpected, unusual, unpredictable severe or unseasonal weather; weather at the extremes of the historical distribution—the range that has been seen in the past.',
                items: [
                    'trends in Mean Temperature'
                ],
                action: themeService.showTrends,
                expanded: false
            }
        ]
    };

    // expose sidemenu config to the template
    configService.onEveryConfigLoad(config =>
        (self.uiConfig = config.ui));

    self.service = sideNavigationService;

    self.version = version;

    self.themes = ref.themes;
    $rootScope.selectedTheme = ref.themes[0];

    self.rootScope = $rootScope;

    self.close = () => $mdSidenav('middle').close();
}
