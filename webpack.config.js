/* Webpack command line options
    env.useMap                      -   Enable source maps on develop (increases build time)
    env.geoLocal                    -   Replaces geoApi from npm node_module with a local geoApi repo folder located by ../geoApi
    env.geoLocal="path/to/geoApi"   -   same as no argument env.geoLocal but uses provided path to local folder
*/
module.exports = function(env = {}) {
    return require(`./webpack.${env.prod ? 'prod' : 'dev'}.js`)(env);
}
