const templateURLs = {
    about: require('./about-dialog.html'),
    share: require('./share-dialog.html')
};

/**
 * @ngdoc service
 * @module sideNavigationService
 * @memberof app.ui
 *
 * @description
 * The `sideNavigationService` service provides access and controls the side navigation menu.
 *
 */
angular
    .module('app.ui')
    .factory('sideNavigationService', sideNavigationService);

/**
 * `sideNavigationService` exposes methods to close/open the side navigation panel.
 * @param  {object} $mdSidenav
 * @return {object} service object
 */
// need to find a more elegant way to include all these dependencies
function sideNavigationService($mdSidenav, $rootScope, $rootElement, configService, events,
    stateManager, basemapService, fullScreenService, exportService, storageService, helpService, reloadService,
    translations, $mdDialog, pluginService) {

    const service = {
        open,
        close,
        controls: {},
        ShareController,
        AboutController
    };

    service.controls = {
        layers: {
            type: 'link',
            label: 'appbar.tooltip.layers',
            icon: 'maps:layers',
            isChecked: () => stateManager.state.mainToc.active,
            action: () => {
                service.close();
                stateManager.setActive('mainToc');
            }
        },
        basemap: {
            type: 'link',
            label: 'nav.label.basemap',
            icon: 'maps:map',
            action: () => {
                service.close();
                basemapService.open();
            }
        },
        export: {
            type: 'link',
            label: 'sidenav.label.export',
            icon: 'community:export',
            action: () => {
                service.close();
                exportService.open();
            }
        },
        share: {
            type: 'link',
            label: 'sidenav.label.share',
            icon: 'social:share',
            action: () => {
                service.close();

                $mdDialog.show({
                    controller: service.ShareController,
                    controllerAs: 'self',
                    templateUrl: templateURLs.share,
                    parent: storageService.panels.shell,
                    disableParentScroll: false,
                    clickOutsideToClose: true,
                    fullscreen: false,
                    onShowing: (scope, element) => (scope.element = element.find('.side-nav-summary'))
                }).then(() => ($rootElement.find('.rv-shareLink').select()));
            }
        },
        about: {
            type: 'link',
            label: 'sidenav.label.about',
            icon: 'action:info_outline',
            action: () => {
                service.close();

                $mdDialog.show({
                    controller: service.AboutController,
                    controllerAs: 'self',
                    templateUrl: templateURLs.about,
                    parent: storageService.panels.shell,
                    disableParentScroll: false,
                    clickOutsideToClose: true,
                    fullscreen: false
                });
            }
        },
        fullscreen: {
            type: 'link',
            label: 'sidenav.label.fullscreen',
            icon: 'navigation:fullscreen',
            isHidden: false,
            isChecked: fullScreenService.isExpanded,
            action: () => fullScreenService.toggle(false)
        },
        touch: {
            type: 'link',
            label: 'sidenav.label.touch',
            icon: 'action:touch_app',
            isChecked: () => $rootElement.hasClass('rv-touch'),
            action: () => $rootElement.toggleClass('rv-touch')
        },
        help: {
            type: 'link',
            label: 'sidenav.label.help',
            icon: 'community:help',
            action: () => {
                service.close();
                helpService.open();
            }
        },
        language: {
            type: 'group',
            label: 'sidenav.label.language',
            icon: 'action:translate',
            children: []
        },
        plugins: {
            type: 'group',
            label: 'sidenav.menu.plugin',
            isHidden: true,
            icon: 'action:settings_input_svideo',
            children: []
        }
    };

    init();

    pluginService.onCreate(window.rvPlugins.backToCart, plugin => {
        service.controls.plugins.children.push({
            type: 'link',
            label: plugin.buttonLabel,
            action: plugin.onClick
        });
        service.controls.plugins.isHidden = false;
    });

    return service;

    function ShareController(scope, $mdDialog, $rootElement, $http, configService) {
        'ngInject';
        const self = this;

        // url cache to avoid unneeded API calls
        const URLS = {
            short: undefined,
            long: undefined
        };

        self.switchChanged = switchChanged;
        self.close = $mdDialog.hide;

        getLongLink();

        // fetch googleAPIKey - if it exists the short link switch option is shown
        configService.onEveryConfigLoad(conf =>
            (self.googleAPIUrl = conf.googleAPIKey ?
                `https://www.googleapis.com/urlshortener/v1/url?key=${conf.googleAPIKey}` : null)
        );

        /**
        * Handles onClick event on URL input box
        * @function switchChanged
        * @param    {Boolean}    value   the value of the short/long switch option
        */
        function switchChanged(value) {
            self.linkCopied = false;
            return value ? getShortLink() : getLongLink();
        }

        /**
        * Fetches a long url from the page if one has not yet been cached
        * @function getLongLink
        */
        function getLongLink() {
            if (typeof URLS.long === 'undefined') { // no cached url exists
                // eslint-disable-next-line no-return-assign
                RV.getMap($rootElement.attr('id')).getBookmark().then(bookmark =>
                    URLS.long = self.url = window.location.href.split('?')[0] + '?rv=' + String(bookmark))
                    .then(() => (selectURL()));
            } else { // cache exists
                self.url = URLS.long;
                selectURL();
            }
        }

        /**
        * Fetches a short url from the Google API service if one has not yet been cached
        * @function getShortLink
        */
        function getShortLink() {
            // no cached url exists - making API call
            if (typeof URLS.short === 'undefined') {
                $http.post(self.googleAPIUrl, { longUrl: self.url })
                    .then(r => {
                        URLS.short = self.url = r.data.id;
                        selectURL();
                    })
                    .catch(() => (URLS.short = undefined)); // reset cache from failed API call);
            // cache exists, API call not needed
            } else {
                self.url = URLS.short;
                selectURL();
            }
        }

        /**
        * Select URL in input box
        * @function selectURL
        */
        function selectURL() {
            if (scope.element !== undefined) {
                scope.element.find('.rv-shareLink').select();
            }
        }
    }

    function AboutController(scope, $mdDialog, $sanitize, $http, configService) {
        'ngInject';
        const self = this;

        self.close = $mdDialog.hide;

        // get about map description from markdown or config file
        configService.onEveryConfigLoad(config => {
            if (config.ui.about.isMarkdown) {
                self.about = config.ui.about.content;
            } else {
                useMarkdown(config.ui.about.folderName).then(html => { self.about = html; });
            }
        });

        /**
         * Takes a folder path, fetches markdown files and parses them.
         * @param {String} foldername path to the markdown files
         * @return {Promise} a promise resolving to rendered HTML
         */
        function useMarkdown(foldername) {
            const renderer = new marked.Renderer();
            // make it easier to use images in markdown by prepending path to href if href is not an external source
            // this avoids the need for ![](help/images/myimg.png) to just ![](myimg.png). This overrides the default image renderer completely.
            renderer.image = (href, title) => {
                if (href.indexOf('http') === -1) {
                    href = `about/${foldername}/images/` + href;
                }
                return `<img src="${href}" alt="${title}">`;
            };

            const mdLocation = `about/${foldername}/${configService.getSync.language}.md`;
            return $http.get(mdLocation).then(r => marked(r.data, { renderer }));
        }
    }

    /**
     * Opens side navigation panel.
     * @function open
     */
    function open() {
        $mdSidenav('left')
            .open()
            .then(() => $('md-sidenav[md-component-id="left"] button').first().rvFocus());
    }

    /**
     * Closes side navigation panel.
     * @function close
     */
    function close() {
        return $mdSidenav('left').close();
    }

    /**
     * Set up initial mapnav cluster buttons.
     * Set up language change listener to update the buttons and language menus when a new config is loaded.
     *
     * @function init
     * @private
     */
    function init() {
        configService.onEveryConfigLoad(config => {
            // all menu items should be defined in the config's ui section
            // should we account for cases when the export url is not specified, but export option is enabled in the side menu thought the config and hide it ourselves?
            // or just let it failed
            // or do these checks together with layer definition validity checks and remove export from the sidemenu options at that point
            service.controls.export.isHidden = typeof config.services.exportMapUrl === 'undefined';
            service.controls.plugins.isHidden = service.controls.plugins.children.length === 0;

            // generate the language selector menu;
            const langs = config.languages;
            service.controls.language.children = langs.map(l =>
                ({
                    type: 'link',
                    label: translations[l].lang[l.substring(0, 2)],
                    action: switchLanguage,
                    isChecked: isCurrentLanguage,
                    value: l
                }));
        });

        /**
         * Switches the language to the language represented by the sidemenu language control object.
         *
         * @function switchLanguage
         * @param {Object} control sidemenu language control object
         * @private
         */
        function switchLanguage(control) {
            // reload service with the new language and close side panel
            reloadService.loadNewLang(control.value);
            service.close();
        }

        /**
         * Checks if the provided sidemenu language control object represents the currently selected language
         *
         * @function isCurrentLanguage
         * @private
         * @param {Object} control sidemenu language control object
         * @return {Boolean} true is sidemenu language control object represents the currently selected language
         */
        function isCurrentLanguage(control) {
            return control.value === configService.getSync.language;
        }
    }
}
