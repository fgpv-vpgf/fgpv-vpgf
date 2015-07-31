/* global browser, element, by */

/* https://github.com/angular/protractor/blob/master/docs/toc.md */

describe('my app', function () {
    'use strict';

    /*it('should automatically redirect to /view1 when location hash/fragment is empty', function () {
        browser.get('index.html');
        expect(browser.getLocationAbsUrl()).toMatch('/view1');
    });*/

    describe('view1', function () {
        beforeEach(function () {
            browser.get('index-protractor.html');
        });

        it('should render view1 when user navigates to /view1', function () {
            expect(element.all(by.css('md-whiteframe')).first().getText()).
                toMatch(/I'm .*/);
        });

    });

    /*describe('view2', function () {

        beforeEach(function () {
            browser.get('index.html#/view2');
        });

        it('should render view2 when user navigates to /view2', function () {
            expect(element.all(by.css('[ng-view] p')).first().getText()).
              toMatch(/partial for view 2/);
        });

    });*/

});
