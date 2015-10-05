// service factory that has deployPath of the application, misc settings for the renderer

module.exports = function myApp() {
	return {
		deployPath: '/dgeni/',
		isDeploy: false
	};
};