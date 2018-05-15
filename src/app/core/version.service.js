const moment = window.moment;

/**
 * @name version
 * @memberof app.core
 * @constant
 * @description
 *
 * The 'version' constant service provides current version numbers and the timestap.
 */
angular
    .module('app.core')
    .constant('version', {
        major: RVersion.major,
        minor: RVersion.minor,
        patch: RVersion.patch,
        hash: RVersion.gitHash.substring(0, 9),
        get timestamp() {
            return moment.tz(RVersion.timestamp, moment.tz.guess()).format('YYYY-MM-DD HH:mm:ss');
        }
    });
