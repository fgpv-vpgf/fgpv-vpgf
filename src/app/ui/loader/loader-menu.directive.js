const templateUrl = require('./loader-menu.html');

/**
 * @module rvLoaderMenu
 * @memberof app.ui
 * @restrict E
 * @description
 *
 * The `rvLoaderMenu` directive description.
 * TODO: add description
 *
 */
angular
    .module('app.ui')
    .directive('rvLoaderMenu', rvLoaderMenu);

function rvLoaderMenu() {
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

function Controller(stateManager, appInfo, $timeout, $rootElement) {
    'ngInject';
    const self = this;

    // TODO: need a better way to determine if the layer loader is active or not
    self.state = stateManager.state;
    self.appID = appInfo.id;

    self.openFileLoader = openFileLoader;
    self.openServiceLoader = openServiceLoader;

    // Initialize loader panels
    let mApi = appInfo.mapi;
    mApi.panels.fileLoader.body = $('<rv-loader-file></rv-loader-file>');
    mApi.panels.serviceLoader.body = $('<rv-loader-service></rv-loader-service>');
    // When legend toggles back open, close the loaders
    mApi.panels.legend.opening.subscribe(() => {
        mApi.panels.fileLoader.close();
        mApi.panels.serviceLoader.close();
    });

    mApi.panels.fileLoader.opening.subscribe(() => {
        mApi.mapI.setAppbarTitle(mApi.panels.fileLoader, 'import.file.title');
    });
    mApi.panels.fileLoader.closing.subscribe(() => {
        mApi.mapI.releaseAppbarTitle(mApi.panels.fileLoader);
    });
    mApi.panels.serviceLoader.opening.subscribe(() => {
        mApi.mapI.setAppbarTitle(mApi.panels.serviceLoader, 'import.service.title');
    });
    mApi.panels.serviceLoader.closing.subscribe(() => {
        mApi.mapI.releaseAppbarTitle(mApi.panels.serviceLoader);
    });

    function openFileLoader() {
        mApi.panels.fileLoader.open();
        setFocus('#fileLoader');
    }

    function openServiceLoader() {
        mApi.panels.serviceLoader.open();
        setFocus('#serviceLoader');
    }

    /**
     * Sets focus on the close button when panel open.
     *
     * @function setFocus
     * @private
     * @param   {Object}    name     the class name to find button to focus on
     */
    function setFocus(name) {
        $timeout(() => {
            $rootElement.find(`${name} .rv-header-float button`).first().rvFocus();
        }, 0);
    }
}
