const templateUrl = require('./failure-image.html');

angular.module('app.ui').directive('rvFailureImage', rvFailureImage);

/**
 * `rvFailureImage` directive body. Displays a image in the case of data failure.
 *
 * @return {object} directive body
 */

function rvFailureImage(configService) {
    const directive = {
        restrict: 'E',
        scope: {
            message: '='
        },
        link,
        templateUrl,
        controller: () => {},
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link(scope) {
        const self = scope.self;

        self.failureMessage = 'toc.error.resource.loadfailed';

        configService.onEveryConfigLoad(config => {
            self.failureImageUrl = config.ui.failureFeedback.failureImageUrl;
            if (typeof self.message !== 'undefined') {
                self.failureMessage = self.message;
            } else if (typeof config.ui.failureFeedback.failureMessage !== 'undefined') {
                self.failureMessage = config.ui.failureFeedback.failureMessage;
            }
        });
    }
}
