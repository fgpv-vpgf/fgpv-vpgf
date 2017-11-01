$('body > div.container.container-main > div > div.col-8.col-content > section > h2, body > div.container.container-main > div > div.col-8.col-content > section.tsd-panel-group.tsd-index-group > section > div > section > h3')
    .filter(function() {
        return $(this).html() === 'Events'
    }).html('Observables');