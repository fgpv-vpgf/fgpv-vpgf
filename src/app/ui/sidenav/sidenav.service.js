(() => {

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
        .module('app.ui.sidenav')
        .factory('sideNavigationService', sideNavigationService);

    /**
     * `sideNavigationService` exposes methods to close/open the side navigation panel.
     * @param  {object} $mdSidenav
     * @return {object} service object
     */
    function sideNavigationService($mdSidenav, globalRegistry) {
        /* jshint shadow:true */
        /* jshint unused:false */
        /*
         * Open and close are native browser functions for opening and closing windows.
         * To prevent JShint's "already defined" error, we use shadow and unused switches.
         */
        const service = {
            open,
            close,
            toggle,
            ShareController
        };

        return service;

        function ShareController($mdDialog, $rootElement, $http, configService) {
            'ngInject';
            const self = this;

            // url cache to avoid unneeded API calls
            const URLS = {
                short: undefined,
                long: undefined
            };

            self.bookmarkClicked = bookmarkClicked;
            self.switchChanged = switchChanged;
            self.close = $mdDialog.hide;

            getLongLink();

            // fetch googleAPIKey - if it exists the short link switch option is shown
            configService.getCurrent().then(conf =>
                self.googleAPIUrl = conf.googleAPIKey ?
                    `https://www.googleapis.com/urlshortener/v1/url?key=${conf.googleAPIKey}` : null
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
                    globalRegistry.getMap($rootElement.attr('id')).getBookmark().then(bookmark =>
                        URLS.long = self.url = window.location.href.split('?')[0] + '?rv=' + String(bookmark)
                    );
                } else { // cache exists
                    self.url = URLS.long;
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
                        .then(r => URLS.short = self.url = r.data.id)
                        .catch(() => URLS.short = undefined); // reset cache from failed API call);
                // cache exists, API call not needed
                } else {
                    self.url = URLS.short;
                }
            }

            /**
            * Handles onClick event on URL input box
            * @function bookmarkClicked
            * @param    {Object}    event   the jQuery onClick event
            */
            function bookmarkClicked(event) {
                // select/highlight the URL link
                $(event.currentTarget).select();
                // try to automatically copy link - if successful display message
                self.linkCopied = document.execCommand('copy');
            }
        }

        /**
         * Opens side navigation panel.
         * @function open
         */
        function open() {
            $mdSidenav('left')
                .open()
                .then(function () {
                    console.debug('close LEFT is done');
                });
        }

        /**
         * Closes side navigation panel.
         * @function close
         */
        function close() {
            return $mdSidenav('left').close();
        }

        // FIXME: write a proper toggle function
        /**
         * Toggles side navigation panel.
         *
         * @function toggle
         * @param  {object} argument [description]
         */
        function toggle(argument) {
            console.log(argument);
        }
    }
})();
