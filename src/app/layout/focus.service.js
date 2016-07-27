(() => {

    /**
     * @module focusService
     * @memberof app.layout
     *
     * @description
     * `focusService` manages element focus support across the application.
     */
    angular
        .module('app.layout')
        .factory('focusService', focusService);

    function focusService($rootElement, $rootScope, $mdDialog, storageService) {
        // last known element with focus that is a descendent of $rootElement

        let firstFocusable;
        let lastFocusable;

        let linkedList = [];
        let focusHistory = [];
        let restoreFromHistory = [];
        // prevents infinite looping when setting focus from within focusin/focusout listeners
        let lockFocus = false;
        // tracks focus directional movement
        let isForward = true;
        let lastFocusElement;

        let dlg = $mdDialog;
        let focusStatus;

        $(document).on('mousemove', event => {
            $(document).off('mousemove');
            setStatus('RESET');
        });

        setStatus('NOT_ACTIVE');

        const service = {
            createLink,
            setPanelFocus,
            setFocusElement,
            previousFocus
        };

        return service;

        function setStatus(status) {
            focusStatus = status;
            switch (focusStatus) {

                case 'RESET':
                    $(document).off('focusout', _activeDocFocusoutCB);
                    $(window).off('blur', undoRestore);
                    $(window).off('focus', restore);
                    $rootElement.off('keydown', _waitingKeydownCB);
                    $rootElement.off('focusout', _activeRootFocusoutCB);
                    $rootElement.off('focusin', _inactiveFocusinCB);
                    $rootElement.off('focusin', _activeRootFocusinCB);
                    break;

                case 'NOT_ACTIVE':
                    $rootElement.on('focusin', _inactiveFocusinCB);
                    break;

                case 'WAITING':
                    $rootElement.off('focusin', _inactiveFocusinCB);
                    $rootElement.on('keydown', _waitingKeydownCB);
                    break;

                case 'ACTIVE':
                    $(window).on('blur', undoRestore);
                    $(window).on('focus', restore);
                    $(document).on('focusout', _activeDocFocusoutCB);
                    $rootElement.on('focusout', _activeRootFocusoutCB);
                    $rootElement.on('focusin', _activeRootFocusinCB);
                    break;
            }
        }

        function confirmFocus() {
            setStatus('WAITING');
            dlg.show({
                controller: () => {
                    const self = this;
                },
                locals: {
                    display: 5
                },
                template: `<div style="padding: 20px;">
                            <h3 style="margin:0;">Hit Spacebar to lock focus on the map</h3>
                            <h3 style="margin:0;">Or, hit tab again to skip</h3>
                            <h3 style="margin:0;">To exit map, hit shift Q</h3>
                            </div>`,
                clickOutsideToClose: false,
                escapeToClose: false,
                controllerAs: 'self',
                disableParentScroll: false,
                bindToController: true,
                parent: storageService.panels.shell,
                focusOnOpen: false
            });
        }

        // credit: http://stackoverflow.com/questions/8901854/jquery-find-the-next-inputtext-element-after-a-known-element
        function getNextExternalFocusable() {

            firstFocusable = $rootElement.find('button:visible, [tabindex]:visible').first();
            lastFocusable = $rootElement.find('button:visible, [tabindex]:visible').last();

            //assume you know where you are starting from
            var $startElement = lastFocusable;

            //get all text inputs
            var $inputs = $('button:visible, a:visible, [tabindex]:visible');

            //search inputs for one that comes after starting element
            for (var i = 0; i < $inputs.length; i++) {
                if (isAfter($inputs[i], $startElement)) {
                    var nextInput = $inputs[i];
                    return $(nextInput);
                }
            }

            //is element before or after
            function isAfter(elA, elB) {
                return ($('*').index($(elA).last()) > $('*').index($(elB).first()));
            }
        }

        function restore(reset = true) {
            _restore(focusHistory, restoreFromHistory, reset);
        }

        function undoRestore() {
            _restore(restoreFromHistory, focusHistory, false);
        }

        /**
         * Restores focus to the most recently focused element which:
         *      - is a descendant of $rootElement
         *      - is focusable
         *
         * @function _restore
         */
        function _restore(fromList, toList, reset) {
            toList = reset ? [] : toList;
            if (fromList.length > 0) {
                let focusElem = fromList.pop();
                toList.unshift(focusElem);

                lockFocus = true;
                focusElem.focus();

                // detect if the focus has changed; focus is unchanged if the target
                // element is not focusable
                if (!focusElem.is(':focus')) {
                    _restore(fromList, toList, false); // continue moving back through history until focus is changed
                } else {
                    focusHistory.push(focusElem) // focus change successful; this is our new actively focused elemment
                }
            }
        }

        /**
         * Creates a link between the actively focused element and the provided targetElement. Focus then moves
         * between the two elements regardless of their DOM position or tabindex
         * @function createLink
         * @param {Object}  targetElement  the jQuery element focus moves to
         */
        function createLink(targetElement) {

            if (focusHistory.length > 0) {
                let activeElement = focusHistory[focusHistory.length - 1];
                linkedList = linkedList.filter(bundle =>
                    !bundle.source.is(targetElement) && !bundle.source.is(activeElement) &&
                    !bundle.target.is(targetElement) && !bundle.target.is(activeElement)
                );

                linkedList.push({
                    source: activeElement,
                    target: targetElement
                });

                if (!activeElement.is(':focus')) {
                    $rootScope.$applyAsync(() => {
                        lockFocus = true;
                        activeElement.focus();
                    });
                }
            }
        }

        /**
         * Sets focus on the first visible button in panel named panelName
         * @function setPanelFocus
         * @param  {String} panelName the name of the panel to set focus on
         */
        function setPanelFocus(panelName) {
            const firstButton =  $rootElement.find(`[rv-state="${panelName}"] button`).filter(':visible').first();
            if (typeof firstButton !== 'undefined') {
                $rootScope.$applyAsync(() => firstButton.focus());
            }
        }

        /**
         * Saves a focusable element
         * @private
         * @function setFocusElement
         * @param  {Object} element a focusable element
         */
        function setFocusElement(element) {
            lastFocusElement = element;
        }

        /**
         * Changes focus to the last saved focusable element
         * @private
         * @function previousFocus
         */
        function previousFocus() {
            $rootScope.$applyAsync(() => lastFocusElement.focus());
        }



        // -------------------------------------------------------------------
        // ---------- EVENT LISTENER LOGIC FUNCTIONS BELOW -------------------
        // -------------------------------------------------------------------

        function _activeDocFocusoutCB(event) {
            if (RV.lastFocusManager === $rootElement.attr('id') && event.relatedTarget === null) {
                restore();
            }
        }

        function _activeRootFocusoutCB(event) {
            // so we don't bubble up to our document focusout watcher
            // event.stopPropagation();

            // this is used to determine which viewer (if there is more than one) should take
            // control of focus if it is going to be assigned to body by the browser
            RV.lastFocusManager = $rootElement.attr('id');

            if (event.relatedTarget === null) {
                restore(false);

            } else if (event.target === firstFocusable[0] && !isForward) {
                lastFocusable.focus();

            } else if (event.target === lastFocusable[0] && isForward) {
                firstFocusable.focus();
            }
        }



        function _activeRootFocusinCB(event) {
            if (!lockFocus) {
                let targetElement = $(event.target);

                // check if the element is already in our history; if so remove it and all
                // superceding elements from the history
                for (let i = 0; i < focusHistory.length; i++) {
                    if (focusHistory[i].is(targetElement)) {
                        focusHistory.length = i;
                        break;
                    }
                }

                let sourceType = isForward ? 'source' : 'target';
                let targetType = isForward ? 'target' : 'source';
                let link = linkedList.find(bundle => $(event.relatedTarget).is(bundle[sourceType]));

                // link exists between the two elements, override default focus behaviour
                if (typeof link !== 'undefined' && !link[targetType].is(':focus')) {
                    $rootScope.$applyAsync(() => {
                        lockFocus = true;
                        link[targetType].focus();
                    });

                } else {
                    focusHistory.push(targetElement);
                }
            }

            lockFocus = false;
        }


        function _inactiveFocusinCB(event) {
            return !$.contains($rootElement[0], event.relatedTarget) ? confirmFocus() : null;
        }

        function _waitingKeydownCB(event) {


            firstFocusable = $rootElement.find('button:visible, [tabindex]:visible').first();
            lastFocusable = $rootElement.find('button:visible, [tabindex]:visible').last();

            const setInactive = () => {
                event.preventDefault();
                setStatus('RESET');
                dlg.hide();
                getNextExternalFocusable().focus();
                setStatus('NOT_ACTIVE');
            };

            if (focusStatus === 'ACTIVE' && event.which === 13 && event.shiftKey) {
                setInactive();

            } else if (focusStatus === 'WAITING' && event.which === 13 && !event.shiftKey) {
                setStatus('ACTIVE');
                dlg.hide();

            } else if (focusStatus === 'WAITING' && event.which === 9) {
                setInactive();
            }

            // detect focus direction is reversed
            isForward = event.which === 9 ? !event.shiftKey : isForward;
        }
    }
})();
