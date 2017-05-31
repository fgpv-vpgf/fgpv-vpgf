/* Webpack command line options
    env.useMap                      -   Enable source maps on develop (increases build time)
    env.geoLocal                    -   Replaces geoApi from npm node_module with a local geoApi repo folder located by ../geoApi
    env.geoLocal="path/to/geoApi"   -   same as no argument env.geoLocal but uses provided path to local folder
    env.inspect                     -   Bundle analysis for use with build debugging and optimization
*/
module.exports = function(env = {}) {
    env.inspect = env.inspect ? true : false;  // displays interactive bundle analyzer
    return require(`./webpack.${env.prod ? 'prod' : 'dev'}.js`)(env);
}
