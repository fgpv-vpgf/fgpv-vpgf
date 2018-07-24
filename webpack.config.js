/* Webpack command line options
    Use `npm run build -- --env.[]` to supply webpack environmental options.

    env.prod                        -   Create production build
    env.useMap                      -   Enable source maps on develop (increases build time)
    env.geoLocal                    -   Replaces geoApi from npm node_module with a local geoApi repo folder located by ../geoApi
    env.geoLocal="path/to/geoApi"   -   Same as no argument env.geoLocal but uses provided path to local folder
    env.inspect                     -   Use for analysing our bundle component sizes and dependency trees.
*/
module.exports = function(env = {}) {
    return require(`./webpack.${env.prod ? 'prod' : 'dev'}.js`)(env);
};
