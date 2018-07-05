import domtoimage from 'dom-to-image';
const gifshot = require('gifshot');
const FileSaver = require('file-saver');

const templateUrl = require('./slider-bar.html');

/**
 * @module rvSliderBar
 * @module app.ui
 * @restrict E
 * @description
 *
 * The `rvSliderBar` directive creates the slider bar
 *
 */
angular
    .module('app.ui')
    .directive('rvSliderBar', rvSliderBar);

function rvSliderBar() {
    const directive = {
        restrict: 'E',
        templateUrl,
        scope: { },
        controller: Controller,
        controllerAs: 'self',
        bindToController: true
    };

    return directive;

    /*********/

    function Controller($interval, $timeout, sliderService) {
        'ngInject';
        const self = this;

        self.play = play;
        self.pause = pause;
        self.step = step;
        self.refresh = refresh;
        self.lock = lock;

        self.isPlaying = false;
        self.isLocked = true;

        self.gif = false;

        let playInterval;

        // get map node + width and height
        const node = document.getElementsByClassName('rv-esri-map')[0];
        const width = node.offsetWidth;
        const height = node.offsetHeight;

        let gifImages = [];

        /**
         * Start play animation.
         *
         * @function play
         */
        function play() {
            self.isPlaying = !self.isPlaying;
            gifImages = [];

            // if export gif is selected, take a snapshot
            if (self.gif) { takeSnapShot(false); }

            // start play
            playInterval = $interval(playInstant, self.selectedDelay);
        }

        /**
         * Start play animation.
         *
         * @function play
         */
        function playInstant() {
            // if export gif is selected, take a snapshot and use timeout to take it just before the next move
            // so definition query has finished
            if (self.gif) $timeout(() => { takeSnapShot(false); }, self.selectedDelay - 500);

            if (sliderService.stepSlider('up')) {
                if (self.gif) $timeout(() => { takeSnapShot(true); }, self.selectedDelay - 500);
                pause();
            }
        }

        /**
         * Take a screen shot of the map. If the animation is stop, generate the gif.
         *
         * @function takeSnapShot
         * @private
         * @param {Boolean} stop true if animation stop; false otherwise
         */
        function takeSnapShot(stop) {
            domtoimage.toPng(node, { bgcolor: 'white' }).then(dataUrl => {
                gifImages.push(dataUrl);

                if (stop) {
                    self.gif = false;

                    gifshot.createGIF({
                        'images': gifImages,
                        'interval': self.selectedDelay,
                        'gifWidth': width,
                        'gifHeight': height
                    }, obj => {
                        if (!obj.error) {
                            FileSaver.saveAs(dataURItoBlob(obj.image), 'fgpv-slider-export.gif' );
                        }
                    });
                }
            }).catch(error => {
                console.error('Not able to get screen shot!', error);
            });
        }

        /**
         * Stop play animation.
         *
         * @function pause
         */
        function pause() {
            // if export gif is selected, take a snapshot
            if (self.gif) { takeSnapShot(true); }

            self.isPlaying = !self.isPlaying;
            $interval.cancel(playInterval);
        }

        /**
         * Step slider.
         *
         * @function step
         * @param {String} direction up or down
         */
        function step(direction) {
            sliderService.stepSlider(direction);
        }

        /**
         * Refresh slider.
         *
         * @function refresh
         */
        function refresh() {
            sliderService.refreshSlider();
        }

        /**
         * Lock slider left anchor.
         *
         * @function lock
         */
        function lock () {
            self.isLocked = !self.isLocked;
            sliderService.lock(self.isLocked);
        }

        /**
         * Conver dataURI to blob.
         *
         * @function dataURItoBlob
         * @param {String} dataURI data to save
         * @return {Object} blob the blob to save
         */
        function dataURItoBlob(dataURI) {
            // https://stackoverflow.com/questions/46405773/saving-base64-image-with-filesaver-js
            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
            const byteString = atob(dataURI.split(',')[1]);

            // separate out the mime component
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

            // write the bytes of the string to an ArrayBuffer
            const ab = new ArrayBuffer(byteString.length);

            // create a view into the buffer
            const ia = new Uint8Array(ab);

            // set the bytes of the buffer to the correct values
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // write the ArrayBuffer to a blob, and you're done
            const blob = new Blob([ab], { type: mimeString });

            return blob;
        }
    }
}