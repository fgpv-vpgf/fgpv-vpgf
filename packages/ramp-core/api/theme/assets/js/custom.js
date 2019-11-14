$('body > div.container.container-main > div > div.col-8.col-content > section > h2, body > div.container.container-main > div > div.col-8.col-content > section.tsd-panel-group.tsd-index-group > section > div > section > h3')
    .filter(function() {
        return $(this).html() === 'Events'
    }).html('Observables');

/**
 * @ignore tags are ignored by the parser, so this hack unignores @ignore
 * 
 * <wbr> (Word Break Opportunity) tags are inserted where properties are camelCased. These need to be removed for a :contains selector to work.
 */
const removeSections = $('dt:contains(ignore)').closest('section');
const removeByHTML = removeSections.find('h3').map((_, a) => $(a).html().replace('<wbr>', ''));
removeSections.remove();
removeByHTML.each((_, html) => $(`li a:contains(${html})`).parent().remove());