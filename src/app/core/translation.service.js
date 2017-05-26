/**
 * @name translationService
 * @memberof app.core
 * @description
 *
 * The 'translationService' service is provided to $translateProvider as a custom language loader.
 * It allows translations to be added by plugins at any point in the application life cycle.
 */
angular
    .module('app.core')
    .factory('translationService', translationService);

function translationService($q, translations, $translate) {
    const translationData = translations;

    return options => {
        // default custom loader implementation returns a promise which resolves with language translation data
        if (options.action === 'loader') {
            return $q(resolve => {
                resolve(translationData[options.key]);
            });

        // add translations to existing languages
        } else {
            Object.keys(options).forEach(key => {
                if (translationData[key]) {
                    if (!translationData[key].plugin) {
                        translationData[key].plugin = {};
                    }
                    Object.assign(translationData[key].plugin, options[key].plugin);
                    $translate.refresh();
                }
            });
        }
    };
}
