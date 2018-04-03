module.exports = function() {
    return {
        preInit: () => {
            console.log('Intention: dataTable pre-initialized');
        },
        init: () => {
            console.log('Intention: dataTable initialized');
        }
    }
}
