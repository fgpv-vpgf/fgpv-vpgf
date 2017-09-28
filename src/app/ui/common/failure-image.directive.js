const templateUrl = require('./failure-image.html');

angular
    .module('app.ui')
    .directive('rvFailureImage', rvFailureImage);

/**
 * `rvFailureImage` directive body. Displays a image in the case of data failure.
 *
 * @return {object} directive body
 */

function rvFailureImage(configService) {
    const directive = {
        restrict: 'E',
        link,
        templateUrl,
        controller: () => {},
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    function link (scope) {
        const self = scope.self;
        configService.onEveryConfigLoad(config => {
            self.failureImageUrl = config.ui.failureFeedback.failureImageUrl;
            self.failureMessage = config.ui.failureFeedback.failureMessage;
        });
    }
}
