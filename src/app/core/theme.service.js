angular
.module('app.core')
.factory('themeService', themeService);

function themeService(configService, $interval) {

    const service = {
        showSomething
    };

    const visibleElements = {
        temperature: [
            'Temperatures',
            'Cities',
            'Treaties',
            'Municipalities',
            'Provinces'
        ],
        extremes: [
            'Very cold days',
            'Very hot days',
            'Tropical Nights',
            'Warmest Maximum',
            'Coldest Minimum',
            'Summer Days',
            'Cities',
            'Treaties',
            'Municipalities',
            'Provinces'
        ]
    };

    let config;

    return service;

    function showSomething(type) {
        reset().then(conf => {
            assembleElements(type).forEach(el => {
                el.css('display', 'block');
                el.find('li').css('display', 'block');
            });
        });
    }

    function assembleElements(type) {
        return visibleElements[type].map(rule => $(`rv-toc .rv-truncate-title-left:contains("${rule}")`).closest('li'));
    }

    function reset() {
        return configService.getAsync.then(conf => {
            config = conf;
            conf.map.layerRecords.forEach(lr => lr.setVisibility(false));
            // need to wait for toc to populate DOM
            return new Promise(resolver => {
                const intervalPromise = $interval(() => {
                    if ($('rv-toc .rv-truncate-title-left').length > 0) {
                        $interval.cancel(intervalPromise);
                        $('rv-toc .rv-truncate-title-left').closest('li').css('display', 'none');
                        resolver(conf);
                    }
                }, 750);
            });
        });
    }
}
