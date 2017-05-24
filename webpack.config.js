module.exports = function(env = {}) {
    env.inspect = env.inspect ? true : false;  // displays interactive bundle analyzer
    return require(`./webpack.${env.prod ? 'prod' : 'dev'}.js`)(env);
}
