;(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['esri/tasks/PrintParameters', 'esri/tasks/PrintTemplate',
     'esri/tasks/PrintTask'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('esri/tasks/PrintParameters'),
     require('esri/tasks/PrintTemplate'),
     require('esri/tasks/PrintTask'));
  } else {
    root.printService = factory(root.PrintParameters);
  };

}(this, function (printService) {
    printTask = new PrintTask(RAMP.config.exportMapUrl);

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

    mapDom = $('#mainMap_root')[0];

    template = new PrintTemplate();
    template.exportOptions = {
        width: mapDom.clientWidth,
        height: mapDom.clientHeight,
        dpi: 96,
    };
    template.format = 'PNG32';
    template.layout = 'MAP_ONLY';
    template.showAttribution = false;

    params = new PrintParameters();
    params.map = mappy;
    params.template = template;
    console.log('submitting print job.  please wait');
    printTask.execute(params);

  return {};
}));
