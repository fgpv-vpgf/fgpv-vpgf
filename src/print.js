/* globals define, exports */
;(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['esri/tasks/PrintParameters', 'esri/tasks/PrintTemplate',
     'esri/tasks/PrintTask'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('esri/tasks/PrintParameters'),
     require('esri/tasks/PrintTemplate'),
     require('esri/tasks/PrintTask'));
  } else {
    root.printService = factory(root.PrintParameters);
  }

}(this, function (PrintParameters, PrintTemplate, PrintTask) {
    'use strict';
    const printTask = new PrintTask('random URL');
    const template = new PrintTemplate();
    const params = new PrintParameters();
    const mapDom = $('#mainMap_root')[0];
    let def;

    printTask.on('complete', function (event) {
        //console.log('PRINT RESULT: ' + event.result.url);
        def.resolve({
            event: event,
            exportOptions: template.exportOptions,
        });
    });

    printTask.on('error', function (event) {
        //console.log('PRINT FAILED: ' + event.error.message);
        def.reject(event);
    });


    template.exportOptions = {
        width: mapDom.clientWidth,
        height: mapDom.clientHeight,
        dpi: 96,
    };
    template.format = 'PNG32';
    template.layout = 'MAP_ONLY';
    template.showAttribution = false;

    params.map = mapDom; //mappy;
    params.template = template;
    console.log('submitting print job.  please wait');
    printTask.execute(params);

  return {};
}));
