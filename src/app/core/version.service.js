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
        timestamp: RVersion.timestamp
    });
