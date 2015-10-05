var _ = require('lodash');

module.exports = function myJSMergeProcessor(log) {
	return {
		$runAfter: ['computePathsProcessor'],
		$runBefore: ['renderDocsProcessor'],
		$process: function (docs) {

			ngDocs = _(docs).reject({docType: 'ngModule'})
							.reject({docType: 'componentGroup'})
							.value();



			jsDocsWithMemberOf = _(docs).filter({docType: 'js'})
										.filter(function(doc) {
											var tags = doc.tags.tags;
											return _.find(tags, function(tag) {
												if(tag.tagName === 'memberof') {
													return true;
												}
												return false;
											});
										})
										.value();

			jsDocsWithMemberOf.forEach( function(doc, idx) {
				var tags = doc.tags.tags;
				var memberofTag = _.find(tags, function(tag) {
					if(tag.tagName === 'memberof'){
						return true;
					}
				});

				if (typeof memberofTag !== 'undefined'){
					var parentName = memberofTag.description;

					log.debug("memberof: " + parentName);
					// find the associated doc e.g. service or directive
					var parentIdx = _.findIndex(ngDocs, function(a) {
						return a.name === parentName;
					});

					log.debug("doc id:"+ doc.id + ", parentIdx:" + parentIdx + ", memberof:" + parentName);

					

					if(parentIdx > -1){

						var parentDoc = ngDocs[parentIdx];

						if (! parentDoc.hasOwnProperty('methods')) {
							// add methods
							parentDoc.methods = [];
						}

						// update path and outputPath
						doc.path = parentDoc.path;
						doc.outputPath = doc.path + doc.outputPath;
						doc.name = doc.id;
						
						// add method to parent node
						parentDoc.methods.push({
							"name": doc.id,
							"description": doc.description,
							"url": '#/' + doc.path + doc.name
						});

					}
				}

				// update doc type
				doc.docType = "gcMethod";

			});

			return docs;
		}
	};
};