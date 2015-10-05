var _ = require('lodash');

module.exports = function myNavProcessor(log) {
	return {
		$runAfter: ['myJSMergeProcessor'],
		$runBefore: ['renderDocsProcessor'],
		$process: function (docs) {

			// generate route data
			var apiRoutes = _(docs).filter(function(doc) {
				return !_.contains(['index', 'content'], doc['docType']);
			})
			.value();

			var tmpR = _.map(apiRoutes, function(route){

				if (route.docType === 'gcMethod') {
					return {
						name: route.name,
						outputPath: './partials/' + route.outputPath,
						url: '/' + route.path + route.name 
					};
				} else {
					return {
						name: route.name,
						outputPath: './partials/' + route.outputPath,
						url: '/' + _.trimRight(route.path, '/')
					};
				}

			});

			// generate constant-data for pages
		      docs.push({
		      	name: 'API',
		      	docType: 'constant',
		      	template: 'constant-data.template.js',
		      	outputPath: '../js/api-data.js',
		      	items: tmpR
		      });

		      // generate navMenu for index.html
			var navMenu = [];

			var moduleDocs = _.filter(docs, {docType: 'ngModule'});


			_.forEach(moduleDocs, function(moduleDoc, idx) {
				var subMenu=[];

				// groups is not array
				// convert to array
				var groups = _.pairs(moduleDoc.groups);


				if(groups.length) {
					groups.forEach(function(group) {
						// directives, services, filters ???
						subMenu.push({
							title: group[1].title,
							children: group[1].children
					    });

					    // TODO: each group has children in array format
					    // children has name, outputPath as value
					});

					// build each menu item for module
					navMenu.push({
						name: moduleDoc.name,
						url: moduleDoc.outputPath,
						submenus: subMenu
					});
				}

			});

			// create new doc called index,  set output location to  ../
			// because the output location is in the partial folder for rest of the files
			docs.push({
				'docType': 'index',
				'gcMenu': navMenu,
				'name': 'This is a name field',
				'title': 'This is a title field',
				// 'path': '../../',
				'outputPath': '../index.html'
			});

			// var apiDocs = _(moduleDocs)
			// .mapValues(function(myDocs) {
			// 	return _.map(myDocs, function(doc){
			// 		return {
			// 			name: doc.name,
			// 			outputPath: './partials/' + doc.url,
			// 			url: '/api/' + doc.name,
			// 			label: doc.lable || doc.name
			// 		};
			// 	});
			// })
			// .value();
			



			return docs;
		}
	};
};